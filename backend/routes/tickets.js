const express = require('express');
const router = express.Router();
const axios = require('axios');

// Helper: find all admins for a given office name (case-insensitive)
async function getOfficeAdmins(sequelize, officeName) {
    const OfficeModel = sequelize.models.Office;
    const UserModel = sequelize.models.User;

    // Use case-insensitive lookup via Sequelize.fn for SQLite compatibility
    const { Op, fn, col } = require('sequelize');
    const officeRecord = await OfficeModel.findOne({
        where: sequelize.where(
            fn('UPPER', col('name')),
            { [Op.eq]: (officeName || '').trim().toUpperCase() }
        )
    });

    if (!officeRecord) {
        console.warn(`[TICKET] Office not found in DB: "${officeName}". Make sure it is created in Settings → Offices.`);
        return [];
    }
    const admins = await UserModel.findAll({ where: { role: 'Admin' } });
    return admins.filter(a => {
        let parsedIds = [];
        try { parsedIds = Array.isArray(a.officeIds) ? a.officeIds : JSON.parse(a.officeIds || '[]'); } catch (e) { }
        return parsedIds.map(String).includes(String(officeRecord.id));
    });
}


// Helper: send WhatsApp message via Evolution API
async function sendWhatsApp(number, text) {
    if (!number || !process.env.EVOLUTION_API_URL || !process.env.EVOLUTION_INSTANCE) {
        console.warn('[TICKET-WA-ERROR] Missing config or number — skipping send');
        return;
    }
    const cleanNumber = String(number).replace(/[^\d]/g, '');
    try {
        const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`;
        console.log(`[TICKET-WA-INFO] Attempting send to ${cleanNumber}...`);
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
        console.log(`[TICKET-WA-SUCCESS] Sent to ${cleanNumber}. Status: ${resp.status}`);
    } catch (err) {
        const detail = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error(`[TICKET-WA-ERROR] Failed to send to ${cleanNumber}:`, detail);
    }
}

router.post('/new', async (req, res) => {
    try {
        const Ticket = req.app.locals.sequelize.models.Ticket;
        const { name, userPhone, projectName, office, complaint } = req.body;

        // Generate unique Ticket ID
        const count = await Ticket.count();
        const ticketId = `TKT${String(count + 1).padStart(5, '0')}`;

        const newTicket = await Ticket.create({ ticketId, name, userPhone, projectName, office, complaint });

        // Find ALL admins assigned to this office
        const officeAdmins = await getOfficeAdmins(req.app.locals.sequelize, office);
        console.log(`[TICKET] Found ${officeAdmins.length} admin(s) for office "${office}"`);

        // Broadcast WhatsApp notification to ALL office admins
        const adminMsg = [
            `*CPECC IT Service Ticket*`,
            `*To:* IT Admin – Acknowledgement`,
            `*User Details:*`,
            ``,
            `*User Name:* ${name}`,
            `*User WhatsApp Number:* ${userPhone}`,
            `*Project:* ${projectName}`,
            `*Office:* ${office}`,
            `*Description of Ticket:* ${complaint}`,
            `*Ticket Number:* ${ticketId}`,
            ``,
            ``,
            `*Reply Commands Format for IT Admin*`,
            `*Examples:*`,
            ``,
            `*${ticketId} RS* – Request user to Restart PC`,
            `*${ticketId} AD* – Request Anydesk ID`,
            `*${ticketId} L3* – Escalated to HO`,
            `*${ticketId} OK* – Ticket Resolved`
        ].join('\n');

        for (const admin of officeAdmins) {
            if (admin.phone) {
                await sendWhatsApp(admin.phone, adminMsg);
            }
        }

        // Send user acknowledgment directly
        const userAckMsg = [
            `━━━━━━━━━━━━━━━━━━━━━━`,
            `📋 *CPECC IT Service*`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `Dear Customer,`,
            ``,
            `Thank you for reaching out to CPECC IT Site Service Desk.`,
            `Your ticket *(${ticketId})* has been successfully generated and forwarded to the responsible Site IT Team.`,
            `They will contact you as soon as possible.`,
            ``,
            `Thank you for your patience.`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
        ].join('\n');

        await sendWhatsApp(userPhone, userAckMsg);

        res.status(201).json({ success: true, ticket: newTicket });
    } catch (error) {
        console.error('[TICKET] Error creating ticket:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});
async function processTicketUpdate(ticketId, command, adminPhone, dbModels) {
    const Ticket = dbModels.Ticket;
    const UserModel = dbModels.User;

    const ticket = await Ticket.findOne({ where: { ticketId } });
    if (!ticket) {
        console.warn(`[TICKET_UPDATE_API] Ticket not found: ${ticketId}`);
        return { success: false, error: 'Ticket not found' };
    }

    const admin = await UserModel.findOne({ where: { phone: adminPhone, role: 'Admin' } });
    const adminName = admin ? admin.username : adminPhone;

    if (ticket.status === 'Resolved') {
        return {
            success: true,
            alreadyCompleted: true,
            resolvedByName: ticket.resolvedByName,
            ticketId
        };
    }

    // Contact footer matches CPECC style
    const displayName = process.env.SUPER_ADMIN_NAME || adminName;
    const displayContact = process.env.SUPER_ADMIN_CONTACT || adminPhone;
    const adminContact = [
        ``,
        `👨‍💻 *Your IT Team:* ${displayName}`,
        `📞 *Contact:* ${displayContact}`,
    ].join('\n');

    let status = 'Updated';
    let userMessage = '';
    const cmdUpper = command.trim().toUpperCase();

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

    ticket.status = status;
    await ticket.save();
    console.log(`[TICKET_UPDATE] DB Update: ${ticketId} -> ${status}`);

    if (ticket.userPhone) {
        await sendWhatsApp(ticket.userPhone, userMessage);
    }

    return {
        success: true,
        ticketId,
        status,
        adminName
    };
}

router.post('/n8n-webhook', async (req, res) => {
    try {
        const rawPayload = req.body;
        const rawStr = JSON.stringify(rawPayload);
        console.log('[N8N-WEBHOOK] Received payload (first 500 chars):', rawStr.substring(0, 500));

        let foundText = '';
        let foundSender = '';

        // Recursive deep search — handles any nesting depth
        function deepSearch(obj) {
            if (typeof obj === 'string') {
                if (!foundText) {
                    const m = obj.match(/(TKT\d{5}(?:\s+\w+)?)/i);
                    if (m && obj.length < 500) foundText = m[1].trim();
                }
                if (!foundSender) {
                    const m = obj.match(/(\d{10,15})@s\.whatsapp\.net/i);
                    if (m) foundSender = m[1];
                }
                return;
            }
            if (Array.isArray(obj)) { obj.forEach(deepSearch); return; }
            if (obj && typeof obj === 'object') {
                // Direct Evolution API field shortcuts (fastest path)
                if (!foundSender && obj.key && obj.key.remoteJid) {
                    const jm = String(obj.key.remoteJid).match(/(\d{10,15})@s\.whatsapp\.net/i);
                    if (jm) foundSender = jm[1];
                }
                const conv = obj.message && (obj.message.conversation || obj.message.extendedTextMessage && obj.message.extendedTextMessage.text);
                if (!foundText && conv) {
                    const mm = String(conv).match(/(TKT\d{5}(?:\s+\w+)?)/i);
                    if (mm) foundText = mm[1].trim();
                }
                Object.values(obj).forEach(deepSearch);
            }
        }

        // N8N wraps the original POST body inside { body: { ... }, headers: {...} }
        // Try the real payload first, fall back to scanning the entire object
        const innerPayload = rawPayload.body || rawPayload;
        deepSearch(innerPayload);

        // Last-resort: scan the entire stringified JSON
        if (!foundText) {
            const m = rawStr.match(/(TKT\d{5}(?:\\s+\\w+)?)/i);
            if (m) foundText = m[1].replace(/\\s/g, ' ').trim();
        }
        if (!foundSender) {
            const m = rawStr.match(/(\d{10,15})(?:@s\\.whatsapp\\.net|@s\.whatsapp\.net)/i);
            if (m) foundSender = m[1];
        }

        console.log(`[N8N-WEBHOOK] Extracted -> text="${foundText}" sender="${foundSender}"`);

        if (!foundText) {
            console.log('[N8N-WEBHOOK] No Ticket ID found – ignoring non-admin message.');
            return res.json({ success: true, ignored: true, reason: 'no_ticket_id' });
        }

        const ticketIdMatch = foundText.match(/(TKT\d{5})/i);
        if (!ticketIdMatch) {
            return res.json({ success: true, ignored: true, reason: 'no_tkt_match' });
        }

        const ticketId = ticketIdMatch[1].toUpperCase();
        const command = foundText.replace(new RegExp(ticketId, 'i'), '').trim();

        console.log(`[N8N-WEBHOOK] Processing -> ticketId=${ticketId} command="${command}" adminPhone=${foundSender}`);

        const result = await processTicketUpdate(
            ticketId, command, foundSender, req.app.locals.sequelize.models
        );

        if (!result.success && result.error) {
            return res.status(404).json(result);
        }
        return res.json(result);

    } catch (error) {
        console.error('[N8N-WEBHOOK] Critical error:', error.message, error.stack);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

router.post('/update-status-from-whatsapp', async (req, res) => {
    try {
        const { ticketId, command, adminPhone } = req.body;
        const result = await processTicketUpdate(ticketId, command, adminPhone, req.app.locals.sequelize.models);

        if (!result.success && result.error) {
            return res.status(404).json(result);
        }
        return res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const Ticket = req.app.locals.sequelize.models.Ticket;
        const tickets = await Ticket.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
