import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUserShield, FaSignOutAlt, FaFilter, FaDownload, FaCog, FaList, FaSync, FaServer, FaDesktop, FaNetworkWired, FaDatabase, FaWifi, FaLaptopCode } from 'react-icons/fa';
import AdminSettings from './AdminSettings';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    'Pending': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: '🟡' },
    'Resolved': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: '✅' },
    'Escalated': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: '🔴' },
    'Restart': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: '🔄' },
    'AnyDesk Request': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: '🖥️' },
    'Updated': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', dot: '📋' },
};

function getStatusStyle(status) {
    return STATUS_CONFIG[status] || { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: '📋' };
}

// ─── Animated IT Components ──────────────────────────────────────────────────
function AnimatedNode({ icon: Icon, style, animClass }) {
    return (
        <div className={`it-node ${animClass}`} style={style}>
            <div className="node-glow"></div>
            <Icon />
        </div>
    );
}

// ─── Beautiful Light CSS Injected Once ──────────────────────────────────────
const LIGHT_ANIM_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;600&display=swap');

.portal-root * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }
.portal-mono { font-family: 'Fira Code', monospace; }

/* ── Deep Tech Background ── */
.portal-bg {
    min-height: 100vh;
    background: #f8fafc; /* Slate 50 */
    position: relative;
    overflow: hidden;
    color: #0f172a;
    display: flex;
    justify-content: center;
}

/* ── Animated Gradient Blobs ── */
.portal-bg::before, .portal-bg::after {
    content: ''; position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0;
    opacity: 0.6;
}
.portal-bg::before {
    width: 600px; height: 600px; background: rgba(56, 189, 248, 0.25); /* Sky blue */
    top: -150px; left: -100px;
    animation: blob-drift 12s infinite alternate ease-in-out;
}
.portal-bg::after {
    width: 500px; height: 500px; background: rgba(167, 139, 250, 0.2); /* Violet */
    bottom: -150px; right: -100px;
    animation: blob-drift 15s infinite alternate-reverse ease-in-out;
}
@keyframes blob-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(100px, 80px) scale(1.1); } }

/* ── Grid Pattern ── */
.it-grid {
    position: absolute; inset: 0; z-index: 0;
    background-size: 50px 50px;
    background-image: 
        linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148,163,184,0.15) 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 30%, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 30%, transparent 80%);
}

/* ── Animated Data Packets (Line Beams) ── */
.data-beam {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(14,165,233,0.8), transparent);
    height: 2px; width: 200px;
    opacity: 0; z-index: 1;
    filter: drop-shadow(0 0 8px rgba(14,165,233,0.6));
}
.beam-1 { top: 20%; left: -200px; animation: beamH 6s infinite linear 1s; }
.beam-2 { top: 75%; left: -200px; animation: beamH 8s infinite linear 3s; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent); }
.beam-v {
    position: absolute; width: 2px; height: 200px;
    background: linear-gradient(180deg, transparent, rgba(14,165,233,0.8), transparent);
    opacity: 0; z-index: 1; filter: drop-shadow(0 0 8px rgba(14,165,233,0.6));
}
.beam-3 { left: 25%; top: -200px; animation: beamV 7s infinite linear 2s; }
.beam-4 { left: 80%; top: -200px; animation: beamV 9s infinite linear 5s; background: linear-gradient(180deg, transparent, rgba(16,185,129,0.8), transparent); }

@keyframes beamH { 0% { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform: translateX(110vw); opacity:0; } }
@keyframes beamV { 0% { transform: translateY(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform: translateY(110vh); opacity:0; } }

/* ── Floating IT Nodes ── */
.it-node {
    position: absolute;
    width: 56px; height: 56px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(14,165,233,0.3);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    color: #0284c7; font-size: 1.5rem;
    box-shadow: 0 10px 25px rgba(14,165,233,0.15);
    z-index: 2;
}
.node-glow {
    position: absolute; inset: -3px;
    border-radius: 18px; border: 2px solid rgba(14,165,233,0.5);
    animation: ring-expand 3s infinite;
}
@keyframes ring-expand { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }

.float-slow { animation: hoverMove 6s infinite ease-in-out alternate; }
.float-med  { animation: hoverMove 5s infinite ease-in-out alternate-reverse; }
.float-fast { animation: hoverMove 4s infinite ease-in-out alternate; }
@keyframes hoverMove { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-20px) rotate(5deg); } }

/* ── Login Glass Card ── */
.glass-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 1.5rem; padding: 2.5rem;
    width: 100%; max-width: 440px;
    box-shadow: 0 20px 40px -10px rgba(14,165,233,0.15), 0 0 0 1px rgba(14,165,233,0.05);
    position: relative; z-index: 10;
    align-self: center; /* for login screen */
    margin: 1.5rem;
    animation: slide-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes slide-up { from { opacity:0; transform:translateY(40px) scale(0.96); } to { opacity:1; transform:none; } }

.login-title { font-size: 1.8rem; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: .2rem; letter-spacing: -0.02em; }
.login-sub   { font-size: .8rem; color: #64748b; text-align: center; margin-bottom: 2rem; letter-spacing: .06em; text-transform: uppercase; font-weight: 600; }

/* ── Giant Central Shield Pulse ── */
.shield-wrapper { display: flex; justify-content: center; margin-bottom: 1.5rem; position: relative; }
.shield-icon { font-size: 3.5rem; color: #0ea5e9; position: relative; z-index: 2; animation: icon-float 4s infinite alternate ease-in-out; }
.shield-pulse { position: absolute; width: 60px; height: 60px; background: rgba(14,165,233,0.2); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); animation: giant-pulse 3s infinite; }
@keyframes icon-float { from { transform: translateY(-3px); filter: drop-shadow(0 5px 10px rgba(14,165,233,0.3)); } to { transform: translateY(3px); filter: drop-shadow(0 15px 25px rgba(14,165,233,0.4)); } }
@keyframes giant-pulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }

/* ── Inputs ── */
.glass-input {
    width: 100%; padding: .9rem 1rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: .75rem; font-size:.95rem; color: #0f172a;
    transition: all .2s; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.glass-input:focus {
    border-color: #0ea5e9; background: #fff;
    box-shadow: 0 0 0 4px rgba(14,165,233,0.15), inset 0 2px 4px rgba(0,0,0,0.02);
}
.glass-label { display:block; font-size:.8rem; font-weight:600; color:#475569; margin-bottom:.4rem; letter-spacing:.02em; }

/* ── Cyber Hover Button ── */
.animated-btn {
    width: 100%; padding: .9rem; margin-top: .5rem;
    background: linear-gradient(135deg, #0284c7 0%, #3b82f6 100%);
    color: #fff; font-weight: 700; font-size: 1rem; letter-spacing: .02em;
    border: none; border-radius: .75rem; cursor: pointer;
    position: relative; overflow: hidden;
    box-shadow: 0 8px 20px rgba(2,132,199,0.3);
    transition: all .2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.animated-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 25px rgba(2,132,199,0.4);
}
.animated-btn:active { transform: translateY(0); }
.animated-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:40%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: wave-slide 2.5s infinite;
}
@keyframes wave-slide { 0% { left: -100%; } 20%, 100% { left: 200%; } }

/* ── Error Box ── */
.error-msg { background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; border-radius: .6rem; padding: .8rem; font-size: .85rem; text-align: center; margin-bottom: 1.5rem; font-weight: 500; }

/* ── Dashboard Layout ── */
.dash-content { width: 100%; max-width: 1400px; padding: 1.5rem; position: relative; z-index: 10; margin: 0 auto; }

.dash-header {
    background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 1.25rem; padding: 1.25rem 1.75rem;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
    box-shadow: 0 10px 30px rgba(14,165,233,0.08); margin-bottom: 1.5rem;
}
.dash-header-title { font-size:1.5rem; font-weight:800; color:#0f172a; letter-spacing:-0.02em; }
.dash-header-sub { font-size:.75rem; color:#64748b; margin-top:.2rem; font-weight:500; }

/* ── Dashboard Buttons ── */
.nav-btn {
    display:flex; align-items:center; gap:.5rem; padding:.55rem 1.25rem; border-radius:.75rem;
    font-weight:600; font-size:.85rem; cursor:pointer; transition:all .2s; border:1px solid transparent;
    background: transparent; color: #64748b;
}
.nav-btn:hover { background: #f1f5f9; color: #1e293b; }
.nav-btn.active {
    background: #e0f2fe; color: #0284c7; border-color: #bae6fd;
    box-shadow: 0 4px 12px rgba(14,165,233,0.1);
}

.ico-btn {
    display:flex; align-items:center; justify-content:center; padding:.55rem .8rem;
    border-radius:.75rem; border:1px solid #e2e8f0;
    background:#fff; color:#64748b; cursor:pointer; transition:all .2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.ico-btn:hover { background:#f1f5f9; color:#0284c7; border-color:#cbd5e1; }

.kill-btn {
    display:flex; align-items:center; gap:.5rem; padding:.55rem 1.1rem; border-radius:.75rem;
    border:1px solid #fecaca; background:#fef2f2; color:#e11d48;
    font-weight:600; font-size:.85rem; cursor:pointer; transition:all .2s;
}
.kill-btn:hover { background:#ffe4e6; box-shadow:0 4px 12px rgba(225,29,72,0.15); transform:translateY(-1px); }

/* ── Stats ── */
.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; margin-bottom:1.5rem; }
@media(max-width:800px){ .stat-grid{ grid-template-columns:repeat(2,1fr); } }
.stat-box {
    background: rgba(255,255,255,0.9); backdrop-filter: blur(16px);
    border-radius: 1.25rem; padding: 1.5rem; text-align: center;
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 8px 20px rgba(14,165,233,0.06);
    transition: all .3s cubic-bezier(0.2, 0.8, 0.2, 1);
    position: relative; overflow: hidden;
}
.stat-box:hover { transform: translateY(-5px); box-shadow: 0 15px 30px var(--hover-shadow); }
.stat-box::before { content:''; position:absolute; top:0; left:0; width:100%; height:4px; background: var(--stat-color); }
.stat-val { font-size:2.4rem; font-weight:800; font-family:'Fira Code', monospace; line-height:1; margin-bottom:.5rem; color: #0f172a; }
.stat-lbl { font-size:.7rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.08em; }

/* ── Controls Bar ── */
.filter-bar {
    background: rgba(255,255,255,0.85); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.8); border-radius: 1.25rem;
    padding: 1rem 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem;
    align-items: center; justify-content: space-between; margin-bottom: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}
.text-filter {
    flex:1; min-width:220px; padding:.7rem 1.1rem; border-radius:.75rem;
    border:1px solid #cbd5e1; background:#f8fafc; color:#0f172a; font-size:.85rem; outline:none; transition:all .2s;
}
.text-filter:focus { border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.15); background:#fff; }
.drop-filter {
    padding:.7rem 1.1rem; border-radius:.75rem; border:1px solid #cbd5e1; background:#f8fafc; color:#0f172a; font-size:.85rem; outline:none; cursor:pointer;
}

.act-btn {
    display:flex; align-items:center; gap:.5rem; padding:.7rem 1.25rem; border-radius:.75rem; font-size:.85rem; font-weight:600; cursor:pointer;
    border:1px solid #e2e8f0; background:#fff; color:#475569; transition:all .2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.act-btn:hover { background:#f8fafc; color:#0f172a; transform:translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.act-excel { background:linear-gradient(135deg, #10b981, #059669); border:none; color:#fff; box-shadow: 0 4px 15px rgba(16,185,129,0.3); }
.act-excel:hover { transform:translateY(-2px); box-shadow: 0 8px 20px rgba(16,185,129,0.4); color:#fff; }

/* ── Data Table ── */
.data-card {
    background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.8); border-radius: 1.25rem;
    overflow: hidden; overflow-x: auto; box-shadow: 0 10px 30px rgba(14,165,233,0.06);
}
.ticket-table { width:100%; border-collapse:collapse; font-size:.85rem; }
.ticket-table thead { background: #f1f5f9; border-bottom: 2px solid #e2e8f0; }
.ticket-table th { padding:1.1rem 1.25rem; color:#475569; font-weight:700; font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; text-align:left; }
.ticket-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: all .2s; }
.ticket-table tbody tr:hover { background: #f8fafc; }
.ticket-table td { padding: 1.1rem 1.25rem; vertical-align: middle; color: #334155; }
.id-badge { color: #0284c7; font-weight: 700; font-size: .85rem; padding: 0.2rem 0.6rem; background: #e0f2fe; border-radius: 0.4rem; border: 1px solid #bae6fd; }
.state-pill { display:inline-flex; align-items:center; gap:.4rem; padding:.3rem .8rem; border-radius:999px; font-size:.75rem; font-weight:600; border:1px solid; }

.anim-fade { animation: fade-in .5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes fade-in { from{opacity:0;transform:translateY(15px);} to{opacity:1;transform:none;} }
`;

function AdminPortal() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [tickets, setTickets] = useState([]);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [lastRefresh, setLastRefresh] = useState(null);
    const refreshIntervalRef = useRef(null);

    useEffect(() => {
        const id = 'light-anim-styles';
        if (!document.getElementById(id)) {
            const tag = document.createElement('style');
            tag.id = id;
            tag.textContent = LIGHT_ANIM_STYLES;
            document.head.appendChild(tag);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) { setIsLoggedIn(true); fetchTickets(); }
    }, []);

    useEffect(() => {
        if (isLoggedIn) refreshIntervalRef.current = setInterval(fetchTickets, 15000);
        return () => clearInterval(refreshIntervalRef.current);
    }, [isLoggedIn]);

    const handleLogin = async (e) => {
        e.preventDefault(); setError('');
        try {
            const res = await axios.post(`${API_URL}/admin/login`, credentials);
            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                localStorage.setItem('adminRole', res.data.user?.role || '');
                setIsLoggedIn(true); fetchTickets();
            }
        } catch (err) { setError(err.response?.data?.error || 'Invalid Credentials'); }
    };

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${API_URL}/tickets`);
            setTickets(res.data.tickets || []);
            setLastRefresh(new Date());
        } catch { }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken'); localStorage.removeItem('adminRole');
        setIsLoggedIn(false); setTickets([]); clearInterval(refreshIntervalRef.current);
    };

    const filteredTickets = tickets.filter(t => {
        const q = filter.toLowerCase();
        const matchSearch = t.ticketId.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q)
            || t.office.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
        return matchSearch && (statusFilter === 'all' || t.status === statusFilter);
    });

    const stats = {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'Pending').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        active: tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Pending').length,
    };

    const downloadCSV = () => {
        const headers = ['Ticket ID', 'Name', 'Phone', 'Project', 'Office', 'Complaint', 'Status', 'Resolved By', 'Date'];
        const rows = filteredTickets.map(t => [
            t.ticketId, t.name, t.userPhone, t.projectName, t.office,
            `"${t.complaint.replace(/"/g, '""')}"`,
            t.status, t.resolvedByName || '', new Date(t.createdAt).toLocaleString()
        ]);
        const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const a = document.createElement('a');
        a.href = encodeURI(csv); a.download = 'tickets_export.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const handleExcelExport = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/export`);
            if (res.data.success) alert(`Excel exported: ${res.data.path}`);
        } catch { alert('Export failed'); }
    };

    // ── BACKGROUND ANIMATIONS ────────────────────────────────────────────────
    const ItNetworkBackground = () => (
        <>
            <div className="it-grid"></div>
            {/* Horizontal Beams */}
            <div className="data-beam beam-1"></div>
            <div className="data-beam beam-2"></div>
            {/* Vertical Beams */}
            <div className="beam-v beam-3"></div>
            <div className="beam-v beam-4"></div>

            {/* Animated Hardware Nodes */}
            <AnimatedNode icon={FaServer} style={{ top: '12%', left: '15%' }} animClass="float-slow" />
            <AnimatedNode icon={FaNetworkWired} style={{ top: '25%', right: '18%' }} animClass="float-med" />
            <AnimatedNode icon={FaDatabase} style={{ bottom: '15%', left: '22%' }} animClass="float-fast" />
            <AnimatedNode icon={FaLaptopCode} style={{ bottom: '25%', right: '12%' }} animClass="float-slow" />
            <AnimatedNode icon={FaWifi} style={{ top: '50%', left: '8%' }} animClass="float-med" />
        </>
    );

    // ── LOGIN SCREEN ────────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className="portal-root portal-bg">
                <ItNetworkBackground />

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 5 }}>
                        <div style={{ background: '#fff', padding: '0.6rem 1rem', borderRadius: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                            <img src={`${import.meta.env.BASE_URL}cpecc-logo.png`} alt="CPECC" style={{ height: '48px', objectFit: 'contain' }} />
                        </div>
                    </div>

                    <div className="shield-wrapper">
                        <div className="shield-pulse"></div>
                        <FaUserShield className="shield-icon" />
                    </div>

                    <div className="login-title">IT Service Hub</div>
                    <div className="login-sub">Secure Network Access</div>

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 5 }}>
                        <div>
                            <label className="glass-label">Username</label>
                            <input
                                type="text" required autoComplete="username" className="glass-input"
                                placeholder="Enter your ID..."
                                value={credentials.username}
                                onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="glass-label">Password</label>
                            <input
                                type="password" required autoComplete="current-password" className="glass-input"
                                placeholder="••••••••••••"
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="animated-btn">
                            Initialize Session
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        System Verification Required
                    </div>
                </div>
            </div>
        );
    }

    // ── DASHBOARD ────────────────────────────────────────────────────────────
    return (
        <div className="portal-root portal-bg anim-fade">
            <ItNetworkBackground />

            <div className="dash-content">
                {/* Header */}
                <div className="dash-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <img src={`${import.meta.env.BASE_URL}cpecc-logo.png`} alt="CPECC" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <div className="dash-header-title">IT Service Desk</div>
                            {lastRefresh && (
                                <div className="dash-header-sub">
                                    Network Synced: {lastRefresh.toLocaleTimeString()} (Auto 15s)
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                        <button className={`nav-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <FaList /> Manage Tickets
                        </button>
                        <button className={`nav-btn${activeTab === 'settings' ? ' active' : ''}`} onClick={() => setActiveTab('settings')}>
                            <FaCog /> Configuration
                        </button>
                        <button className="ico-btn" onClick={fetchTickets} title="Sync Network">
                            <FaSync />
                        </button>
                        <button className="kill-btn" onClick={handleLogout}>
                            <FaSignOutAlt /> End Session
                        </button>
                    </div>
                </div>

                {activeTab === 'settings' ? (
                    <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderRadius: '1.25rem', padding: '2rem', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 10px 30px rgba(14,165,233,0.06)' }}>
                        <AdminSettings />
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="stat-grid">
                            {[
                                { label: 'Total Assets', value: stats.total, color: '#0284c7', shadow: 'rgba(2,132,199,0.15)', icon: '🗂️' },
                                { label: 'Queueing', value: stats.pending, color: '#d97706', shadow: 'rgba(217,119,6,0.15)', icon: '⏳' },
                                { label: 'In Progress', value: stats.active, color: '#7c3aed', shadow: 'rgba(124,58,237,0.15)', icon: '⚡' },
                                { label: 'Resolved', value: stats.resolved, color: '#059669', shadow: 'rgba(5,150,105,0.15)', icon: '✅' },
                            ].map(s => (
                                <div key={s.label} className="stat-box" style={{ '--stat-color': s.color, '--hover-shadow': s.shadow }}>
                                    <div className="stat-val">{s.value}</div>
                                    <div className="stat-lbl">{s.icon} {s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Controls Bar */}
                        <div className="filter-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1, minWidth: '250px' }}>
                                <FaFilter style={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                                <input
                                    type="text"
                                    placeholder="Search ID, Name, Project, or Office..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="text-filter"
                                />
                            </div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="drop-filter">
                                <option value="all">Global Scope</option>
                                <option value="Pending">Pending</option>
                                <option value="Escalated">Escalated</option>
                                <option value="Restart">Restart</option>
                                <option value="AnyDesk Request">AnyDesk</option>
                                <option value="Updated">Updated</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                            <div style={{ display: 'flex', gap: '.75rem' }}>
                                <button onClick={downloadCSV} className="act-btn">
                                    <FaDownload /> Export CSV
                                </button>
                                <button onClick={handleExcelExport} className="act-btn act-excel">
                                    <FaDatabase style={{ marginRight: '.4rem' }} /> Export Excel Data
                                </button>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="data-card">
                            <table className="ticket-table">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Date/Time</th>
                                        <th>User Details</th>
                                        <th>Location details</th>
                                        <th>Issue Description</th>
                                        <th>Current Status</th>
                                        <th>Assigned Admin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket) => {
                                        const s = getStatusStyle(ticket.status);
                                        const isResolved = ticket.status === 'Resolved';
                                        return (
                                            <tr key={ticket.ticketId} style={{ opacity: isResolved ? 0.6 : 1 }}>
                                                <td><span className="id-badge portal-mono">{ticket.ticketId}</span></td>
                                                <td style={{ fontSize: '.75rem', color: '#64748b' }}>
                                                    {new Date(ticket.createdAt).toLocaleString()}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ticket.name}</div>
                                                    <div className="portal-mono" style={{ fontSize: '.75rem', color: '#64748b' }}>{ticket.userPhone}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{ticket.projectName}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#0284c7', fontWeight: 500 }}>{ticket.office}</div>
                                                </td>
                                                <td style={{ maxWidth: '280px' }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontWeight: 500 }} title={ticket.complaint}>
                                                        {ticket.complaint}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`state-pill ${s.bg} ${s.text} ${s.border}`}>
                                                        {s.dot} {ticket.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '.8rem' }}>
                                                    {ticket.resolvedByName
                                                        ? <span style={{ color: '#059669', fontWeight: 700 }}>{ticket.resolvedByName}</span>
                                                        : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Waiting...</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTickets.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontSize: '1rem' }}>
                                                Zero active tickets found in the network.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div style={{ textAlign: 'center', padding: '2rem', fontSize: '.75rem', color: '#94a3b8', letterSpacing: '.03em', fontWeight: 500 }}>
                    CPECC IT Service Network &nbsp;·&nbsp; Engineered by <span style={{ color: '#64748b', fontWeight: 700 }}>Sandeep Pillai</span>
                </div>
            </div>
        </div>
    );
}

export default AdminPortal;
