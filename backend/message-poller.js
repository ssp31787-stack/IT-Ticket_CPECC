// message-poller.js
// ──────────────────────────────────────────────────────────────────────────────
// Reliable Admin Message Poller
// Polls Evolution API every 5 seconds for new inbound admin messages.
// Handles @lid JID format (newer WhatsApp) via remoteJidAlt fallback.
// Eliminates webhook → ngrok → backend dependency chain entirely.
// ──────────────────────────────────────────────────────────────────────────────
const axios = require('axios');

// Track processed message IDs to avoid duplicates
const processedIds = new Set();
// Start timestamp: only process messages newer than this
let lastProcessedTimestamp = Math.floor(Date.now() / 1000) - 300; // last 5 minutes on first run

// ── Extract a clean phone number from a remoteJid or remoteJidAlt ──────────
function extractPhone(key) {
    // Modern WhatsApp uses LID format: "275733159129192@lid"
    // The real phone is in remoteJidAlt: "971525047540@s.whatsapp.net"
    const jid = key.remoteJidAlt || key.remoteJid || '';
    return jid.split('@')[0].replace(/\D/g, '');
}

// ── Build a CPECC-branded user message for a given command ─────────────────
function buildUserMessage(ticketId, command, displayName, displayContact) {
    const adminContact = [
        ``,
        `👨‍💻 *Your IT Team:* ${displayName}`,
        `📞 *Contact:* ${displayContact}`,
    ].join('\n');

    const cmdUpper = command.trim().toUpperCase();

    if (cmdUpper === 'OK') {
        return {
            status: 'Resolved',
            text: [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `✅ *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. We would like to inform you that the concern has been *Resolved Successfully*. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n')
        };
    } else if (cmdUpper === 'L3') {
        return {
            status: 'Escalated',
            text: [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. We would like to inform you that the concern has been *escalated to HO IT Team* to resolve. We will update the status once it is complete from HO IT Team. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n')
        };
    } else if (cmdUpper === 'RS') {
        return {
            status: 'Restart',
            text: [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. As a primary troubleshooting step, we request you to *restart your device*. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n')
        };
    } else if (cmdUpper === 'AD') {
        return {
            status: 'AnyDesk Request',
            text: [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `We received your ticket *(${ticketId})*. To check your device remotely, we request you to *send your AnyDesk ID*. You can find the AnyDesk application on your device's main screen — open it and share the numeric address shown. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n')
        };
    } else {
        return {
            status: 'Updated',
            text: [
                `━━━━━━━━━━━━━━━━━━━━━━`,
                `📋 *CPECC IT Service*`,
                `━━━━━━━━━━━━━━━━━━━━━━`,
                ``,
                `Dear Customer,`,
                ``,
                `Update on your ticket *(${ticketId})*: ${command}. Feel free to contact us by WhatsApp or on call on the below contact number.`,
                adminContact,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n')
        };
    }
}

// ── Process a single admin ticket command ──────────────────────────────────
async function processCommand(ticketId, command, senderPhone, sequelize) {
    try {
        const Ticket = sequelize.models.Ticket;
        const User = sequelize.models.User;

        const ticket = await Ticket.findOne({ where: { ticketId: ticketId.toUpperCase() } });
        if (!ticket) {
            console.log(`[POLLER] ⚠️  Ticket not found: ${ticketId}`);
            return;
        }

        if (ticket.status === 'Resolved') {
            console.log(`[POLLER] ⚠️  ${ticketId} already resolved — skipping`);
            return;
        }

        // Look up admin by phone (normalised digit comparison)
        const allAdmins = await User.findAll({ where: { role: 'Admin' } });
        const normSender = senderPhone.replace(/\D/g, '');
        const admin = allAdmins.find(a => {
            const normAdmin = String(a.phone || '').replace(/\D/g, '');
            return normAdmin && (normAdmin === normSender || normAdmin.endsWith(normSender) || normSender.endsWith(normAdmin));
        });
        const adminName = admin ? admin.username : senderPhone;
        const displayName = process.env.SUPER_ADMIN_NAME || adminName;
        const displayContact = process.env.SUPER_ADMIN_CONTACT || (admin ? admin.phone : senderPhone);

        const { status, text: userMessage } = buildUserMessage(ticketId, command, displayName, displayContact);

        // Update the ticket in DB
        ticket.status = status;
        if (status === 'Resolved') ticket.resolvedByName = adminName;
        await ticket.save();
        console.log(`[POLLER] ✅ DB updated: ${ticketId} → "${status}" by ${adminName}`);

        // Send WhatsApp to the user — non-fatal: DB update already succeeded above
        if (ticket.userPhone) {
            const cleanNumber = String(ticket.userPhone).replace(/[^\d]/g, '');
            const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`;
            try {
                await axios.post(url,
                    { number: cleanNumber, text: userMessage },
                    {
                        headers: { apikey: process.env.EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
                        timeout: 10000
                    }
                );
                console.log(`[POLLER] ✅ WhatsApp sent to user: ${cleanNumber}`);
            } catch (waErr) {
                const detail = waErr.response?.data
                    ? JSON.stringify(waErr.response.data)
                    : waErr.message;
                console.warn(`[POLLER] ⚠️  WhatsApp send failed for ${cleanNumber} (status ${waErr.response?.status}): ${detail}`);
                console.warn(`[POLLER]    → DB was updated. Number may not be on WhatsApp.`);
            }
        } else {
            console.warn(`[POLLER] ⚠️  No userPhone on ticket ${ticketId} — cannot notify user`);
        }

    } catch (err) {
        console.error(`[POLLER] ❌ Error processing ${ticketId} ${command}:`, err.message);
    }
}

// ── Poll Evolution API for new inbound messages ────────────────────────────
async function pollMessages(sequelize) {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;

    if (!apiUrl || !apiKey || !instance) return;

    try {
        // Use the correct endpoint: POST /chat/findMessages/{instance}
        const resp = await axios.post(
            `${apiUrl}/chat/findMessages/${instance}`,
            {
                limit: 30,
                where: {
                    key: { fromMe: false },
                    messageTimestamp: { gte: lastProcessedTimestamp - 30 }
                }
            },
            {
                headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                timeout: 8000
            }
        );

        // Response structure: { messages: { total, pages, currentPage, records: [...] } }
        const records = resp.data?.messages?.records || [];
        if (records.length === 0) return;

        for (const msg of records) {
            const dbId = msg.id || msg.key?.id;
            if (!dbId || processedIds.has(dbId)) continue;

            const key = msg.key || {};

            // Skip own messages
            if (key.fromMe === true) continue;

            // ── Handle LID JID format ──────────────────────────────────────
            // WhatsApp LID: remoteJid = "275733159129192@lid"
            //               remoteJidAlt = "971525047540@s.whatsapp.net"  ← real phone
            const remoteJid = key.remoteJid || '';
            if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) continue;

            // Extract text
            const msgObj = msg.message || {};
            const text = (
                msgObj.conversation ||
                msgObj.extendedTextMessage?.text ||
                msgObj.imageMessage?.caption ||
                ''
            ).trim();

            if (!text) continue;

            // Match ticket command
            const match = text.match(/^(TKT\d+)\s+(.+)$/i);
            if (!match) continue;

            const ticketId = match[1].toUpperCase();
            const command = match[2].trim();
            const senderPhone = extractPhone(key);  // handles @lid via remoteJidAlt

            const msgTs = msg.messageTimestamp || 0;
            if (msgTs > lastProcessedTimestamp) lastProcessedTimestamp = msgTs;

            // Mark as processed
            processedIds.add(dbId);
            if (processedIds.size > 1000) {
                processedIds.delete(processedIds.values().next().value);
            }

            console.log(`[POLLER] 📩 Command found: ${ticketId} ${command} from ${senderPhone} (jid: ${remoteJid})`);
            await processCommand(ticketId, command, senderPhone, sequelize);
        }

    } catch (err) {
        if (err.response?.status !== 404) {
            console.warn(`[POLLER] Poll error (${err.response?.status || 'network'}): ${err.message}`);
        }
    }
}

function startPoller(sequelize, intervalMs = 5000) {
    console.log(`[POLLER] 🚀 Started — polling every ${intervalMs / 1000}s via /chat/findMessages`);
    // Initial poll after 3 seconds
    setTimeout(() => pollMessages(sequelize), 3000);
    // Then every intervalMs
    setInterval(() => pollMessages(sequelize), intervalMs);
}

module.exports = { startPoller };
