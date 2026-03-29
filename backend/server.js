require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
});

const app = express();

// Accept JSON, URL-encoded, AND raw text/plain (Evolution API sometimes sends without proper Content-Type)
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    // If body still not parsed (e.g. text/plain or missing Content-Type), try to parse as JSON
    if (!req.body && req.method === 'POST') {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            if (raw) {
                try { req.body = JSON.parse(raw); } catch { req.body = { raw }; }
            }
            next();
        });
    } else {
        next();
    }
});
app.use(cors());

// Log all incoming requests — safe against undefined body
app.use((req, _res, next) => {
    const safeBody = JSON.stringify(req.body ?? {}).substring(0, 400);
    console.log(`[HTTP] ${req.method} ${req.url} | body: ${safeBody}`);
    next();
});

// Make sequelize available to routes/models
app.locals.sequelize = sequelize;

// Initialize models
require('./models/Ticket')(sequelize);
require('./models/User')(sequelize);
require('./models/Office')(sequelize);

// Connect to SQLite
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Connected to SQLite and synced models');
        // Auto-configure Evolution API webhook to point directly to backend
        configureEvolutionWebhook();
        // Start the reliable message poller (polls Evolution API every 5s)
        const { startPoller } = require('./message-poller');
        startPoller(sequelize, 5000);
    })
    .catch((err) => console.error('SQLite connection error:', err));


// Auto-configure Evolution API webhook on startup with retries
async function configureEvolutionWebhook(retries = 5) {
    const url = process.env.EVOLUTION_API_URL;
    const key = process.env.EVOLUTION_API_KEY;
    const inst = process.env.EVOLUTION_INSTANCE;

    if (!url || !key || !inst) {
        console.log('[WEBHOOK CONFIG] Evolution API not configured — skipping webhook auto-setup');
        return;
    }

    // Prioritize NGROK_DOMAIN for public access, fallback to BACKEND_API_URL or localhost
    let backendUrl = process.env.BACKEND_API_URL || `http://localhost:${process.env.PORT || 5000}`;

    // Check if ngrok domain is set and use it
    if (process.env.NGROK_DOMAIN) {
        backendUrl = `https://${process.env.NGROK_DOMAIN}`;
    }

    const webhookUrl = `${backendUrl}/webhook/evolution`;

    for (let i = 1; i <= retries; i++) {
        try {
            // First check if instance exists
            await axios.get(`${url}/instance/connectionState/${inst}`, { headers: { apikey: key } });

            await axios.post(`${url}/webhook/set/${inst}`, {
                webhook: {
                    url: webhookUrl,
                    enabled: true,
                    webhookByEvents: false,
                    webhookBase64: false,
                    events: ['MESSAGES_UPSERT']
                }
            }, { headers: { apikey: key, 'Content-Type': 'application/json' } });
            console.log(`[WEBHOOK CONFIG] ✅ Evolution API webhook set to ${webhookUrl}`);
            return;
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            console.error(`[WEBHOOK CONFIG] (Attempt ${i}/${retries}) ⚠️  Failed: ${errorMsg}`);
            if (i < retries) {
                console.log(`[WEBHOOK CONFIG] Retrying in 5s...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    console.log('[WEBHOOK CONFIG] ❌ All attempts failed. Check if Evolution API and Instance are running.');
}

const ticketRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const webhookRoutes = require('./routes/webhooks');

app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/webhook', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// ── Serve built React frontend ──────────────────────────────────────────────
// In production, the frontend is built to ../frontend/dist
const distPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// SPA catch-all: Express 5 requires /{*path} instead of *
app.get('/{*path}', (req, res) => {
    res.sendFile('index.html', { root: distPath });
});
// ────────────────────────────────────────────────────────────────────────────

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Frontend served from: ${distPath}`);
});
