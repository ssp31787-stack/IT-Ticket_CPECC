const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const exceljs = require('exceljs');
const fs = require('fs');
const path = require('path');

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const User = req.app.locals.sequelize.models.User;
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) return res.status(400).json({ success: false, error: 'Invalid Credentials' });

        const isMatch = password === user.password;

        if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid Credentials' });

        const payload = { id: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({ success: true, token, user: { username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Setup / Reset SuperAdmin — always creates Admin/Allied@2020, safe to call again
router.post('/setup', async (req, res) => {
    try {
        const User = req.app.locals.sequelize.models.User;
        // Remove any existing SuperAdmin rows and recreate with correct credentials
        await User.destroy({ where: { role: 'SuperAdmin' } });
        await User.create({
            username: 'Admin',
            password: 'Allied@2020',
            role: 'SuperAdmin',
            officeIds: []
        });
        res.json({ success: true, message: 'SuperAdmin reset: username=Admin password=Allied@2020' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Excel Export: Save tickets to a local folder
router.get('/export', async (req, res) => {
    try {
        const Ticket = req.app.locals.sequelize.models.Ticket;
        const tickets = await Ticket.findAll({ order: [['createdAt', 'DESC']] });

        const workbook = new exceljs.Workbook();
        const sheet = workbook.addWorksheet('Tickets');

        sheet.columns = [
            { header: 'ID', key: 'ticketId', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'User Name', key: 'name', width: 20 },
            { header: 'User Phone', key: 'userPhone', width: 15 },
            { header: 'Project', key: 'projectName', width: 20 },
            { header: 'Office', key: 'office', width: 20 },
            { header: 'Complaint', key: 'complaint', width: 40 },
            { header: 'Resolved By', key: 'resolvedByName', width: 20 },
            { header: 'Created At', key: 'createdAt', width: 25 },
        ];

        tickets.forEach(t => {
            sheet.addRow({
                ticketId: t.ticketId,
                status: t.status,
                name: t.name,
                userPhone: t.userPhone,
                projectName: t.projectName,
                office: t.office,
                complaint: t.complaint,
                resolvedByName: t.resolvedByName,
                createdAt: t.createdAt.toISOString()
            });
        });

        // Ensure exports directory exists
        const exportDir = path.join(__dirname, '..', '..', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const fileName = `tickets_export_${new Date().getTime()}.xlsx`;
        const filePath = path.join(exportDir, fileName);

        await workbook.xlsx.writeFile(filePath);

        console.log(`[ADMIN] Tickets exported to ${filePath}`);
        res.json({ success: true, message: 'Excel file created successfully', path: filePath, fileName });
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ success: false, error: 'Failed to export tickets' });
    }
});

module.exports = router;
