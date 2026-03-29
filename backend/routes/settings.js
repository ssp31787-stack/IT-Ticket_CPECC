const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Path to backend .env file
const ENV_PATH = path.join(__dirname, '..', '.env');

// Helper: read .env file as a map
function readEnvFile() {
    const map = {};
    if (!fs.existsSync(ENV_PATH)) return map;
    fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) map[key.trim()] = rest.join('=').trim();
    });
    return map;
}

// Helper: write updated env map back to .env file
function writeEnvFile(map) {
    const content = Object.entries(map).map(([k, v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(ENV_PATH, content, 'utf8');
}

// Helper: update specific keys in process.env AND .env file
function updateEnv(updates) {
    const map = readEnvFile();
    Object.entries(updates).forEach(([k, v]) => {
        process.env[k] = v;
        map[k] = v;
    });
    writeEnvFile(map);
}

// GET /api/settings/superadmin — return the super admin display name and contact shown in user messages
router.get('/superadmin', (req, res) => {
    res.json({
        success: true,
        name: process.env.SUPER_ADMIN_NAME || '',
        contact: process.env.SUPER_ADMIN_CONTACT || '',
    });
});

// POST /api/settings/superadmin — save display name and contact number
router.post('/superadmin', (req, res) => {
    try {
        const { name, contact } = req.body;
        if (!name && !contact) return res.status(400).json({ success: false, error: 'name or contact required' });
        const updates = {};
        if (name !== undefined) updates.SUPER_ADMIN_NAME = name;
        if (contact !== undefined) updates.SUPER_ADMIN_CONTACT = contact;
        updateEnv(updates);
        console.log('[SETTINGS] Super Admin display updated → name:', name, 'contact:', contact);
        res.json({ success: true, message: 'Super Admin display info saved. All future messages will use this name and contact.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/settings/evolution-config — return current Evolution API configuration
router.get('/evolution-config', (req, res) => {
    res.json({
        success: true,
        config: {
            url: process.env.EVOLUTION_API_URL || '',
            apiKey: process.env.EVOLUTION_API_KEY || '',
            instance: process.env.EVOLUTION_INSTANCE || '',
        }
    });
});

// POST /api/settings/evolution-config — save new Evolution API configuration
router.post('/evolution-config', async (req, res) => {
    try {
        const { url, apiKey, instance } = req.body;
        if (!url || !apiKey || !instance) {
            return res.status(400).json({ success: false, error: 'url, apiKey, and instance are required' });
        }
        updateEnv({
            EVOLUTION_API_URL: url.replace(/\/$/, ''), // trim trailing slash
            EVOLUTION_API_KEY: apiKey,
            EVOLUTION_INSTANCE: instance,
        });
        console.log('[SETTINGS] Evolution API config updated → instance:', instance, 'url:', url);
        res.json({ success: true, message: 'Evolution API config saved. Changes are live immediately.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/settings/evolution-connect — create or reconnect the Evolution API WhatsApp instance
router.post('/evolution-connect', async (req, res) => {
    try {
        const { url, apiKey, instance } = req.body;
        const apiUrl = url || process.env.EVOLUTION_API_URL;
        const key = apiKey || process.env.EVOLUTION_API_KEY;
        const inst = instance || process.env.EVOLUTION_INSTANCE;
        const headers = { apikey: key, 'Content-Type': 'application/json' };

        // Try to create instance (ignore if already exists)
        try {
            await axios.post(`${apiUrl}/instance/create`,
                { instanceName: inst, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
                { headers }
            );
        } catch (e) {
            // Instance may already exist — that's OK
            console.log('[SETTINGS] Instance create (may already exist):', e.response?.data?.message || e.message);
        }

        res.json({ success: true, message: 'Instance connect initiated. Fetch QR code now.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/settings/evolution-qr — get QR code for the current instance
router.get('/evolution-qr', async (req, res) => {
    try {
        const url = process.env.EVOLUTION_API_URL;
        const key = process.env.EVOLUTION_API_KEY;
        const inst = process.env.EVOLUTION_INSTANCE;
        if (!url || !key || !inst) {
            return res.status(400).json({ success: false, error: 'Evolution API not configured' });
        }
        const r = await axios.get(`${url}/instance/connect/${inst}`,
            { headers: { apikey: key } }
        );
        res.json({ success: true, qr: r.data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.response?.data?.message || err.message });
    }
});

// GET /api/settings/evolution-status — get connection status
router.get('/evolution-status', async (req, res) => {
    try {
        const url = process.env.EVOLUTION_API_URL;
        const key = process.env.EVOLUTION_API_KEY;
        const inst = process.env.EVOLUTION_INSTANCE;
        if (!url || !key || !inst) return res.json({ success: true, state: 'not_configured' });
        const r = await axios.get(`${url}/instance/connectionState/${inst}`, { headers: { apikey: key } });
        res.json({ success: true, state: r.data?.instance?.state || 'unknown' });
    } catch (err) {
        res.json({ success: true, state: 'disconnected', error: err.message });
    }
});

// POST /api/settings/change-whatsapp — full lifecycle: delete old, create new, re-configure webhook
router.post('/change-whatsapp', async (req, res) => {
    try {
        const { newInstanceName } = req.body;
        if (!newInstanceName || !newInstanceName.trim()) {
            return res.status(400).json({ success: false, error: 'newInstanceName is required' });
        }

        const url = process.env.EVOLUTION_API_URL;
        const key = process.env.EVOLUTION_API_KEY;
        const oldInst = process.env.EVOLUTION_INSTANCE;
        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
        const headers = { apikey: key, 'Content-Type': 'application/json' };
        const newInst = newInstanceName.trim();

        // Step 1: Delete old instance gracefully (ignore errors)
        if (oldInst && oldInst !== newInst) {
            try {
                await axios.delete(`${url}/instance/delete/${oldInst}`, { headers });
                console.log(`[SETTINGS] Deleted old instance: ${oldInst}`);
            } catch (e) {
                console.log(`[SETTINGS] Could not delete old instance ${oldInst} (may not exist):`, e.response?.data?.message || e.message);
            }
        }

        // Step 2: Save new instance name to process.env + .env
        updateEnv({ EVOLUTION_INSTANCE: newInst });
        console.log(`[SETTINGS] Instance updated: ${oldInst} → ${newInst}`);

        // Step 3: Create new instance with QR
        try {
            await axios.post(`${url}/instance/create`,
                { instanceName: newInst, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
                { headers }
            );
            console.log(`[SETTINGS] New instance created: ${newInst}`);
        } catch (e) {
            console.log(`[SETTINGS] Instance create (may already exist):`, e.response?.data?.message || e.message);
        }

        // Step 4: Configure webhook to point back to our backend (not N8N)
        try {
            await axios.post(`${url}/webhook/set/${newInst}`, {
                webhook: {
                    url: `${backendUrl}/webhook/evolution`,
                    enabled: true,
                    webhookByEvents: false,
                    webhookBase64: false,
                    events: ['MESSAGES_UPSERT'],
                }
            }, { headers });
            console.log(`[SETTINGS] Webhook re-configured for ${newInst} → ${backendUrl}/webhook/evolution`);
        } catch (e) {
            console.log(`[SETTINGS] Webhook config error:`, e.response?.data?.message || e.message);
        }

        res.json({
            success: true,
            message: `WhatsApp changed to instance "${newInst}". Scan the QR code to connect the new number.`,
            newInstance: newInst,
        });
    } catch (err) {
        console.error('[SETTINGS] change-whatsapp error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all offices
router.get('/offices', async (req, res) => {
    try {
        const Office = req.app.locals.sequelize.models.Office;
        const offices = await Office.findAll();
        res.json({ success: true, offices });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Create new office
router.post('/offices', async (req, res) => {
    try {
        const Office = req.app.locals.sequelize.models.Office;
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Name required' });
        const office = await Office.create({ name });
        res.json({ success: true, office });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, error: 'Office already exists' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Get all IT Admins (non-SuperAdmin)
router.get('/users', async (req, res) => {
    try {
        const User = req.app.locals.sequelize.models.User;
        const users = await User.findAll({ where: { role: 'Admin' } });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Create new IT Admin
router.post('/users', async (req, res) => {
    try {
        const User = req.app.locals.sequelize.models.User;
        const { username, password, phone, officeIds } = req.body;
        if (!username || !password || !officeIds || !phone) return res.status(400).json({ success: false, error: 'All fields required' });

        // Check if valid array
        if (!Array.isArray(officeIds) || officeIds.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one valid Office is required' });
        }

        const user = await User.create({
            username: username.toLowerCase(),
            password,
            phone,
            officeIds,
            role: 'Admin'
        });

        res.json({ success: true, user: { id: user.id, username: user.username, officeIds: user.officeIds, phone: user.phone } });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, error: 'Username already exists' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Update IT Admin (office assignments, phone, etc)
router.put('/users/:id', async (req, res) => {
    try {
        const User = req.app.locals.sequelize.models.User;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        const { phone, officeIds } = req.body;
        if (phone !== undefined) user.phone = phone;
        if (officeIds !== undefined) user.officeIds = officeIds;
        await user.save();
        res.json({ success: true, user: { id: user.id, username: user.username, phone: user.phone, officeIds: user.officeIds } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Wipe Database — SuperAdmin only, preserves the SuperAdmin account
router.post('/wipe', async (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        const { token } = req.body;

        // Verify token and confirm SuperAdmin role
        if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        } catch (e) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        if (decoded.role !== 'SuperAdmin') {
            return res.status(403).json({ success: false, error: 'Only SuperAdmin can wipe the database' });
        }

        const sequelize = req.app.locals.sequelize;
        const Ticket = sequelize.models.Ticket;
        const User = sequelize.models.User;
        const Office = sequelize.models.Office;

        // Delete everything EXCEPT the SuperAdmin account
        await Ticket.destroy({ where: {}, truncate: true });
        await User.destroy({ where: { role: 'Admin' } });  // keep SuperAdmin
        await Office.destroy({ where: {}, truncate: true });

        console.log('[SETTINGS] Database wiped by SuperAdmin. SuperAdmin account preserved.');
        res.json({ success: true, message: 'Database wiped. All tickets, offices, and IT admins removed. SuperAdmin account preserved.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to wipe database.' });
    }
});

module.exports = router;
