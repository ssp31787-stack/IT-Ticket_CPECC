const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Helper: send WhatsApp message via Evolution API
async function sendWhatsApp(number, text) {
    if (!number || !process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_INSTANCE) {
        console.warn('[WA-ERROR] Missing env vars or number — skipping send');
        return;
    }
    const cleanNumber = String(number).replace(/[^\d]/g, '');
    try {
        const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`;
        const resp = await axios.post(
            url,
            { number: cleanNumber, text },
            {
                headers: {
                    apikey: process.env.EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        console.log(`[WA-SUCCESS] Message sent to ${cleanNumber}. Status: ${resp.status}`);
    } catch (err) {
        const detail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error(`[WA-ERROR] Failed to send to ${cleanNumber}:`, detail);
    }
}

// Normalise a phone number to digits only (removes +, spaces, dashes)
function normalisePhone(phone) {
    return String(phone || '').replace(/[^\d]/g, '');
}

// Look up admin (any role) by phone number, tolerant of + prefix differences
async function findAdminByPhone(UserModel, rawPhone) {
    const norm = normalisePhone(rawPhone);
    if (!norm) return null;

    // Try direct match first
    let user = await UserModel.findOne({ where: { phone: norm } });
    if (user) return user;

    // Try with + prefix
    user = await UserModel.findOne({ where: { phone: '+' + norm } });
    if (user) return user;

    // Try without + prefix (in case DB has raw digits)
    const withoutPlus = norm.startsWith('0') ? norm.slice(1) : norm;
    user = await UserModel.findOne({ where: { phone: withoutPlus } });
    if (user) return user;

    // Fetch all users and do normalised comparison
    const allUsers = await UserModel.findAll();
    for (const u of allUsers) {
        if (u.phone && normalisePhone(u.phone) === norm) return u;
    }

    return null;
}

// ─── Evolution API incoming message webhook ─────────────────────────────────
router.post('/evolution', async (req, res) => {
    try {
        const payload = req.body;

        // ── [FIX 1] Safely write raw log — don't crash if logs/ folder is missing ──
        try {
            const logPath = path.join(__dirname, '..', '..', 'logs', 'webhook_raw.log');
            fs.appendFileSync(logPath, JSON.stringify(payload, null, 2) + '\n---\n');
        } catch (logErr) {
            console.warn('[WEBHOOK] Could not write raw log:', logErr.message);
        }

        console.log('[WEBHOOK] Evolution incoming:', JSON.stringify(payload).substring(0, 600));

        // ── [FIX 2] Support both flat AND double-nested Evolution API payload formats ──
        // Evolution API v1: { key, message, status }
        // Evolution API v2: { event: "messages.upsert", data: { key, message, status } }
        // Evolution API v2 (some builds): { event, data: { data: { key, message } } }
        let data = payload.data || payload;
        // Handle double-nested: { data: { data: { key, message } } }
        if (data.data && !data.key && !data.message) {
            data = data.data;
        }

        const key = data.key || {};
        const msgObj = data.message || {};
        const remoteJid = key.remoteJid || '';

        // Skip messages sent BY the bot itself (prevents reply loops)
        if (key.fromMe === true) {
            console.log('[WEBHOOK] Skipped: fromMe=true');
            return res.json({ success: true, skipped: 'fromMe=true' });
        }

        // Skip groups, broadcasts, status updates
        if (!remoteJid ||
            remoteJid.includes('@g.us') ||
            remoteJid.includes('@broadcast') ||
            remoteJid.includes('status@')) {
            console.log('[WEBHOOK] Skipped: group/broadcast/status jid=' + remoteJid);
            return res.json({ success: true, skipped: 'group/broadcast/status' });
        }

        // Skip pure delivery ACK / read status events (no user text)
        if (data.status === 'DELIVERY_ACK' || data.status === 'READ' || data.type === 'append') {
            console.log('[WEBHOOK] Skipped: ACK/status event, status=' + data.status);
            return res.json({ success: true, skipped: 'ACK/status event' });
        }

        // ── Extract message text — covers all Evolution API message types ──
        const text = (
            msgObj.conversation ||
            msgObj.extendedTextMessage?.text ||
            msgObj.imageMessage?.caption ||
            msgObj.buttonsResponseMessage?.selectedDisplayText ||
            msgObj.listResponseMessage?.title ||
            data.text ||
            ''
        ).trim();

        console.log('[WEBHOOK] remoteJid:', remoteJid, '| text:', text || '(empty)');

        // Match ticket command: TKT00001 RS / TKT00001 OK etc.
        // Tolerates missing space: TKT00001RS
        const match = text.match(/^(TKT\d+)\s*(.+)$/i);
        if (!match) {
            console.log('[WEBHOOK] Skipped: no ticket command found in text:', JSON.stringify(text));
            return res.json({ success: true, skipped: 'no ticket command' });
        }

        const ticketId = match[1].toUpperCase();
        const command = match[2].trim();

        // ── [FIX] Handle WhatsApp LID JID format ──────────────────────────────
        // Modern Android WhatsApp uses a LID: "275733159129192@lid"
        // The real phone is in key.remoteJidAlt: "971525047540@s.whatsapp.net"
        const rawJid = key.remoteJidAlt || key.remoteJid || remoteJid;
        const senderPhone = rawJid.split('@')[0].replace(/\D/g, '');

        console.log(`[WEBHOOK] Processing: ticketId=${ticketId} command=${command} senderPhone=${senderPhone}`);

        const Ticket = req.app.locals.sequelize.models.Ticket;
        const User = req.app.locals.sequelize.models.User;

        const ticket = await Ticket.findOne({ where: { ticketId } });
        if (!ticket) {
            console.warn('[WEBHOOK] Ticket not found:', ticketId);
            return res.json({ success: false, error: 'Ticket not found' });
        }

        // Look up sender as an admin in the DB (tolerant phone matching)
        const admin = await findAdminByPhone(User, senderPhone);
        const adminName = admin ? admin.username : senderPhone;

        console.log(`[WEBHOOK] Sender identified as: ${adminName}`);

        // Block double-updates on already-resolved tickets
        if (ticket.status === 'Resolved') {
            await sendWhatsApp(senderPhone,
                `⛔ *CPECC IT Service*\n\nTicket *${ticketId}* has already been resolved by *${ticket.resolvedByName}*. No further action is needed.`
            );
            return res.json({ success: true, skipped: 'already resolved' });
        }

        // Contact footer shown in user-facing messages
        const displayName = process.env.SUPER_ADMIN_NAME || adminName;
        const displayContact = process.env.SUPER_ADMIN_CONTACT || (admin ? admin.phone : senderPhone);
        const adminContact = [
            ``,
            `👨‍💻 *Your IT Team:* ${displayName}`,
            `📞 *Contact:* ${displayContact}`,
        ].join('\n');

        // ── Command processing ────────────────────────────────────────────
        const cmdUpper = command.toUpperCase();
        let status = 'Updated';
        let userMessage = '';

        if (cmdUpper === 'OK') {
            status = 'Resolved';
            ticket.resolvedByName = adminName;
            userMessage = [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `✅ *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. We would like to inform you that the concern has been *Resolved Successfully*. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n');

        } else if (cmdUpper === 'L3') {
            status = 'Escalated';
            userMessage = [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. We would like to inform you that the concern has been *escalated to HO IT Team* to resolve. We will update the status once it is complete from HO IT Team. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n');

        } else if (cmdUpper === 'RS') {
            status = 'Restart';
            userMessage = [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. As a primary troubleshooting step, we request you to *restart your device*. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n');

        } else if (cmdUpper === 'AD') {
            status = 'AnyDesk Request';
            userMessage = [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. To check your device remotely, we request you to *send your AnyDesk ID*. You can find the AnyDesk application on your device's main screen — open it and share the numeric address shown. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n');

        } else {
            // Any free-text update
            status = 'Updated';
            userMessage = [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `Update on your ticket *(${ticketId})*: ${command}. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n');
        }

        // ── Save the ticket status update ─────────────────────────────────
        ticket.status = status;
        await ticket.save();
        console.log(`[WEBHOOK] Ticket ${ticketId} → "${status}" by ${adminName}`);

        // ── Notify the user ───────────────────────────────────────────────
        if (ticket.userPhone) {
            await sendWhatsApp(ticket.userPhone, userMessage);
            console.log(`[WEBHOOK] User notified at ${ticket.userPhone}`);
        }

        res.json({ success: true, ticketId, status, adminName });

    } catch (err) {
        console.error('[WEBHOOK] Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
