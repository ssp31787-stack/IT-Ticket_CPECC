import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUserShield, FaSignOutAlt, FaFilter, FaDownload, FaCog, FaList, FaSync, FaServer, FaDesktop, FaNetworkWired, FaDatabase } from 'react-icons/fa';
import AdminSettings from './AdminSettings';

const API_URL = `/api`;

// ─── Glowing Data Node Component ─────────────────────────────────────────────
function DataNode({ style, icon: Icon, delay }) {
    return (
        <div className="it-data-node" style={{ ...style, animationDelay: delay }}>
            <div className="node-ring"></div>
            <Icon />
        </div>
    );
}

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    'Pending': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: '🟡' },
    'Resolved': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '✅' },
    'Escalated': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', dot: '🔴' },
    'Restart': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: '🔄' },
    'AnyDesk Request': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', dot: '🖥️' },
    'Updated': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', dot: '📋' },
};

function getStatusStyle(status) {
    return STATUS_CONFIG[status] || { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: '📋' };
}

// ─── Advanced CSS Injected Once ─────────────────────────────────────────────
const CYBER_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');

.cyber-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
.cyber-mono { font-family: 'JetBrains Mono', monospace; }

/* ── Deep Tech Background ── */
.cyber-bg {
    min-height: 100vh;
    background-color: #020617; /* Slate 950 */
    background-image: 
        radial-gradient(circle at 15% 50%, rgba(14, 165, 233, 0.08), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08), transparent 25%);
    position: relative;
    overflow: hidden;
    color: #f8fafc;
}

/* ── Animated Grid Lines ── */
.cyber-grid {
    position: absolute; inset: 0; z-index: 0;
    background-size: 40px 40px;
    background-image: 
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent);
}

/* ── Data Streams (Fiber Optics effect) ── */
.data-stream {
    position: absolute;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.8), transparent);
    height: 1px; width: 150px;
    opacity: 0;
    z-index: 1;
}
.stream-1 { top: 20%; left: -150px; animation: streamH 6s infinite linear 1s; }
.stream-2 { top: 60%; left: -150px; animation: streamH 8s infinite linear 3s; background: linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent); }
.stream-3 { top: 85%; left: -150px; animation: streamH 7s infinite linear 5s; }

.stream-v {
    position: absolute;
    background: linear-gradient(180deg, transparent, rgba(56,189,248,0.8), transparent);
    width: 1px; height: 150px;
    opacity: 0; z-index: 1;
}
.stream-4 { left: 15%; top: -150px; animation: streamV 9s infinite linear 2s; }
.stream-5 { left: 75%; top: -150px; animation: streamV 7s infinite linear 4s; background: linear-gradient(180deg, transparent, rgba(52,211,153,0.8), transparent); }

@keyframes streamH { 0% { transform: translateX(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform: translateX(110vw); opacity:0; } }
@keyframes streamV { 0% { transform: translateY(0); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform: translateY(110vh); opacity:0; } }

/* ── Data Nodes ── */
.it-data-node {
    position: absolute;
    width: 48px; height: 48px;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(56,189,248,0.3);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: #38bdf8; font-size: 1.2rem;
    box-shadow: 0 0 20px rgba(56,189,248,0.1);
    z-index: 2;
    animation: node-float 6s infinite ease-in-out alternate;
}
.node-ring {
    position: absolute; inset: -4px;
    border-radius: 14px;
    border: 1px solid rgba(56,189,248,0.4);
    animation: ring-pulse 3s infinite;
}
@keyframes node-float { from { transform: translateY(0px); } to { transform: translateY(-15px); } }
@keyframes ring-pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.3); opacity: 0; } }

/* ── Login Glass Card ── */
.cyber-card {
    background: rgba(15, 23, 42, 0.5); /* Slate 900 with transparency */
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-top: 1px solid rgba(255,255,255,0.15);
    border-radius: 1.5rem;
    padding: 2.5rem;
    width: 100%; max-width: 420px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 20px rgba(56,189,248,0.05);
    position: relative; z-index: 10;
    animation: card-in 0.8s cubic-bezier(0.16,1,0.3,1) both;
}
.cyber-card::before {
    content:''; position:absolute; inset:0; border-radius:1.5rem;
    padding:1px; background:linear-gradient(135deg, rgba(56,189,248,0.4), transparent 60%);
    -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
}
@keyframes card-in { from { opacity:0; transform:translateY(30px) scale(0.95); } to { opacity:1; transform:none; } }

.login-title { font-size:1.75rem; font-weight:800; color:#f8fafc; text-align:center; margin-bottom:.25rem; letter-spacing:-0.03em; }
.login-sub   { font-size:.8rem; color:#94a3b8; text-align:center; margin-bottom:2rem; letter-spacing:.08em; text-transform:uppercase; font-weight:600; }

/* ── Cyber Profile/Shield ── */
.shield-container {
    display: flex; justify-content: center; margin-bottom: 1.5rem; position: relative;
}
.shield-icon {
    font-size: 2.8rem; color: #38bdf8;
    filter: drop-shadow(0 0 12px rgba(56,189,248,0.6));
    animation: shield-glow 3s infinite alternate;
}
@keyframes shield-glow { from { filter: drop-shadow(0 0 8px rgba(56,189,248,0.4)); } to { filter: drop-shadow(0 0 20px rgba(56,189,248,0.8)); } }

/* ── Inputs ── */
.cyber-input {
    width: 100%; padding: .85rem 1rem;
    background: rgba(2, 6, 23, 0.6);
    border: 1px solid rgba(71,85,105,0.4);
    border-radius: .75rem; font-size:.95rem; color: #f8fafc;
    transition: all .3s; outline: none;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}
.cyber-input:focus {
    border-color: #38bdf8;
    background: rgba(15,23,42,0.8);
    box-shadow: 0 0 0 3px rgba(56,189,248,0.15), inset 0 2px 4px rgba(0,0,0,0.2);
}
.cyber-label { display:block; font-size:.78rem; font-weight:600; color:#94a3b8; margin-bottom:.4rem; letter-spacing:.03em; text-transform:uppercase; }

/* ── Cyber Button ── */
.cyber-btn {
    width: 100%; padding: .85rem; margin-top: 1rem;
    background: linear-gradient(135deg, #0284c7 0%, #3b82f6 100%);
    color: #fff; font-weight: 700; font-size: .95rem; letter-spacing: .05em;
    border: none; border-radius: .75rem; cursor: pointer;
    position: relative; overflow: hidden;
    box-shadow: 0 4px 15px rgba(2,132,199,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
    transition: all .2s;
}
.cyber-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(2,132,199,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
}
.cyber-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: btn-sweep 3s infinite;
}
@keyframes btn-sweep { 0% { left: -100%; } 20%, 100% { left: 200%; } }

/* ── Error Box ── */
.cyber-error {
    background: rgba(225,29,72,0.15); border: 1px solid rgba(225,29,72,0.3);
    color: #fda4af; border-radius: .5rem; padding: .75rem; font-size: .85rem;
    text-align: center; margin-bottom: 1.5rem; backdrop-filter: blur(4px);
}

/* ── Dashboard Layout ── */
.dash-root { padding: 1.5rem; min-height: 100vh; display:flex; justify-content:center; }
.dash-container { width: 100%; max-width: 1400px; position:relative; z-index:10; }

.dash-header {
    background: rgba(15,23,42,0.6); backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1);
    border-radius: 1.25rem; padding: 1.25rem 1.75rem;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 1.5rem;
}
.dash-title { font-size:1.4rem; font-weight:800; color:#f8fafc; letter-spacing:-0.02em; }
.dash-sub { font-size:.75rem; color:#64748b; margin-top:.2rem; font-weight:500; }

/* ── Dashboard Tabs & Buttons ── */
.tab-btn {
    display:flex; align-items:center; gap:.5rem; padding:.5rem 1.25rem; border-radius:.75rem;
    font-weight:600; font-size:.85rem; cursor:pointer; transition:all .2s; border:1px solid transparent;
    background: transparent; color: #94a3b8;
}
.tab-btn:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
.tab-btn.active { 
    background: rgba(56,189,248,0.15); color: #38bdf8; 
    border-color: rgba(56,189,248,0.3); box-shadow: 0 0 15px rgba(56,189,248,0.1); 
}

.icon-btn {
    display:flex; align-items:center; justify-content:center; padding:.5rem .75rem;
    border-radius:.75rem; border:1px solid rgba(255,255,255,0.1);
    background:rgba(15,23,42,0.6); color:#94a3b8; cursor:pointer; transition:all .2s;
}
.icon-btn:hover { background:rgba(255,255,255,0.1); color:#e2e8f0; }

.logout-btn {
    display:flex; align-items:center; gap:.5rem; padding:.5rem 1rem; border-radius:.75rem;
    border:1px solid rgba(225,29,72,0.3); background:rgba(225,29,72,0.1); color:#f43f5e;
    font-weight:600; font-size:.85rem; cursor:pointer; transition:all .2s;
}
.logout-btn:hover { background:rgba(225,29,72,0.2); box-shadow:0 0 15px rgba(225,29,72,0.2); }

/* ── Stats ── */
.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; margin-bottom:1.5rem; }
@media(max-width:800px){ .stat-grid{ grid-template-columns:repeat(2,1fr); } }
.stat-card {
    background: rgba(15,23,42,0.5); backdrop-filter: blur(12px);
    border-radius: 1.25rem; padding: 1.5rem; text-align: center;
    border: 1px solid rgba(255,255,255,0.05);
    border-top: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    transition: transform .2s, box-shadow .2s; position:relative; overflow:hidden;
}
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
.stat-card::after {
    content:''; position:absolute; bottom:0; left:0; width:100%; height:3px;
    background: var(--stat-color); opacity: 0.7;
}
.stat-num { font-size:2.2rem; font-weight:800; font-family:'JetBrains Mono', monospace; line-height:1; margin-bottom:.5rem; }
.stat-lbl { font-size:.7rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.1em; }

/* ── Controls Bar ── */
.controls-bar {
    background: rgba(15,23,42,0.6); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.05); border-radius: 1.25rem;
    padding: 1rem 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem;
    align-items: center; justify-content: space-between; margin-bottom: 1.5rem;
}
.cyber-search {
    flex:1; min-width:220px; padding:.65rem 1rem; border-radius:.75rem;
    border:1px solid rgba(255,255,255,0.1); background:rgba(2,6,23,0.5);
    color:#f8fafc; font-size:.85rem; outline:none; transition:all .2s;
}
.cyber-search:focus { border-color:#38bdf8; box-shadow:0 0 0 2px rgba(56,189,248,0.2); }
.cyber-select {
    padding:.65rem 1rem; border-radius:.75rem;
    border:1px solid rgba(255,255,255,0.1); background:rgba(2,6,23,0.8);
    color:#f8fafc; font-size:.85rem; outline:none; cursor:pointer;
}

.export-btn {
    display:flex; align-items:center; gap:.5rem; padding:.65rem 1.25rem; border-radius:.75rem;
    font-size:.85rem; font-weight:600; cursor:pointer;
    border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#cbd5e1;
    transition:all .2s;
}
.export-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
.export-excel { background:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.4); color:#34d399; }
.export-excel:hover { background:rgba(16,185,129,0.25); box-shadow:0 0 15px rgba(16,185,129,0.2); color:#fff; }

/* ── Table ── */
.table-wrap {
    background: rgba(15,23,42,0.6); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.05); border-radius: 1.25rem;
    overflow: hidden; overflow-x: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.cyber-table { width:100%; border-collapse:collapse; font-size:.85rem; }
.cyber-table thead { background: rgba(2,6,23,0.8); border-bottom: 1px solid rgba(255,255,255,0.1); }
.cyber-table th { padding:1rem 1.25rem; color:#94a3b8; font-weight:700; font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; text-align:left; }
.cyber-table tbody tr { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background .2s; }
.cyber-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.cyber-table td { padding: 1rem 1.25rem; vertical-align: middle; color: #cbd5e1; }
.ticket-id { color: #38bdf8; font-weight: 700; font-size: .8rem; }
.status-pill { display:inline-flex; align-items:center; gap:.4rem; padding:.25rem .75rem; border-radius:999px; font-size:.75rem; font-weight:600; border:1px solid; }

/* Footer */
.cyber-footer { text-align:center; padding:1.5rem; font-size:.75rem; color:#475569; letter-spacing:.03em; }

.fade-in { animation: fade-in .5s ease both; }
@keyframes fade-in { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }
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

    // Inject CSS once
    useEffect(() => {
        const id = 'cyber-styles';
        if (!document.getElementById(id)) {
            const tag = document.createElement('style');
            tag.id = id;
            tag.textContent = CYBER_STYLES;
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

    // ── BACKGROUND ANIMATION ELEMENTS ────────────────────────────────────────
    const BackgroundElements = () => (
        <>
            <div className="cyber-grid"></div>
            {/* Horizontal Data Streams */}
            <div className="data-stream stream-1"></div>
            <div className="data-stream stream-2"></div>
            <div className="data-stream stream-3"></div>
            {/* Vertical Data Streams */}
            <div className="stream-v stream-4"></div>
            <div className="stream-v stream-5"></div>

            {/* Floating IT Nodes */}
            <DataNode icon={FaServer} style={{ top: '15%', left: '10%' }} delay="0s" />
            <DataNode icon={FaNetworkWired} style={{ top: '25%', right: '15%' }} delay="1s" />
            <DataNode icon={FaDatabase} style={{ bottom: '20%', left: '20%' }} delay="2s" />
            <DataNode icon={FaDesktop} style={{ bottom: '30%', right: '10%' }} delay="0.5s" />
        </>
    );

    // ── LOGIN SCREEN ────────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className="cyber-root cyber-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <BackgroundElements />

                <div className="cyber-card">
                    {/* Logo & Icon */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.9)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <img src="/cpecc-logo.png" alt="CPECC" style={{ height: '45px', objectFit: 'contain' }} />
                        </div>
                    </div>

                    <div className="shield-container">
                        <FaUserShield className="shield-icon" />
                    </div>

                    <div className="login-title">IT Service Hub</div>
                    <div className="login-sub">Secure Network Access</div>

                    {error && <div className="cyber-error">{error}</div>}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="cyber-label">Admin Identity</label>
                            <input
                                type="text" required autoComplete="username" className="cyber-input"
                                placeholder="Enter username..."
                                value={credentials.username}
                                onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="cyber-label">Passkey</label>
                            <input
                                type="password" required autoComplete="current-password" className="cyber-input"
                                placeholder="••••••••••••"
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="cyber-btn">
                            Initialize Session
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        System Verification Required
                    </div>
                </div>
            </div>
        );
    }

    // ── DASHBOARD ────────────────────────────────────────────────────────────
    return (
        <div className="cyber-root cyber-bg dash-root fade-in">
            <BackgroundElements />

            <div className="dash-container">
                {/* Header */}
                <div className="dash-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.9)', padding: '0.4rem', borderRadius: '0.5rem' }}>
                            <img src="/cpecc-logo.png" alt="CPECC" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <div className="dash-title">IT Service Hub</div>
                            {lastRefresh && (
                                <div className="dash-sub">
                                    Network Last Polled: {lastRefresh.toLocaleTimeString()} (Auto 15s)
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                        <button className={`tab-btn${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <FaList /> Work Queue
                        </button>
                        <button className={`tab-btn${activeTab === 'settings' ? ' active' : ''}`} onClick={() => setActiveTab('settings')}>
                            <FaCog /> Configuration
                        </button>
                        <button className="icon-btn" onClick={fetchTickets} title="Force Sync">
                            <FaSync />
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            <FaSignOutAlt /> Terminate Session
                        </button>
                    </div>
                </div>

                {activeTab === 'settings' ? (
                    <div style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.25rem', padding: '2rem' }}>
                        <AdminSettings />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="stat-grid">
                            {[
                                { label: 'Total Requests', value: stats.total, color: '#38bdf8', icon: '🌐' },
                                { label: 'Pending Tasks', value: stats.pending, color: '#fbbf24', icon: '⏳' },
                                { label: 'Active Network', value: stats.active, color: '#a78bfa', icon: '⚡' },
                                { label: 'Resolved', value: stats.resolved, color: '#34d399', icon: '✅' },
                            ].map(s => (
                                <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
                                    <div className="stat-lbl" style={{ color: s.color }}>{s.icon} {s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Controls Bar */}
                        <div className="controls-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1, minWidth: '250px' }}>
                                <FaFilter style={{ color: '#475569', fontSize: '1.1rem' }} />
                                <input
                                    type="text"
                                    placeholder="Query by ID, Name, Node, or Location..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="cyber-search"
                                />
                            </div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="cyber-select">
                                <option value="all">Global Scope</option>
                                <option value="Pending">Pending</option>
                                <option value="Escalated">Escalated</option>
                                <option value="Restart">Restart</option>
                                <option value="AnyDesk Request">AnyDesk</option>
                                <option value="Updated">Updated</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                            <div style={{ display: 'flex', gap: '.75rem' }}>
                                <button onClick={downloadCSV} className="export-btn">
                                    <FaDownload /> Export CSV
                                </button>
                                <button onClick={handleExcelExport} className="export-btn export-excel">
                                    <FaDatabase style={{ marginRight: '.4rem' }} /> Export Node Data
                                </button>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="table-wrap">
                            <table className="cyber-table">
                                <thead>
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Timestamp</th>
                                        <th>Origin Node</th>
                                        <th>Location / Project</th>
                                        <th>Diagnostic Info</th>
                                        <th>State</th>
                                        <th>SysAdmin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket) => {
                                        const s = getStatusStyle(ticket.status);
                                        const isResolved = ticket.status === 'Resolved';
                                        return (
                                            <tr key={ticket.ticketId} style={{ opacity: isResolved ? 0.5 : 1 }}>
                                                <td><span className="ticket-id cyber-mono">{ticket.ticketId}</span></td>
                                                <td style={{ fontSize: '.75rem', color: '#64748b' }}>
                                                    {new Date(ticket.createdAt).toLocaleString()}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{ticket.name}</div>
                                                    <div className="cyber-mono" style={{ fontSize: '.75rem', color: '#94a3b8' }}>{ticket.userPhone}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{ticket.projectName}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#38bdf8' }}>{ticket.office}</div>
                                                </td>
                                                <td style={{ maxWidth: '280px' }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#cbd5e1' }} title={ticket.complaint}>
                                                        {ticket.complaint}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${s.bg} ${s.text} ${s.border}`}>
                                                        {s.dot} {ticket.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '.8rem' }}>
                                                    {ticket.resolvedByName
                                                        ? <span style={{ color: '#34d399', fontWeight: 600 }}>[ {ticket.resolvedByName} ]</span>
                                                        : <span style={{ color: '#475569' }}>WAITING</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTickets.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: '#475569', fontSize: '1rem' }}>
                                                &lt; NO DATA STREAMS FOUND &gt;
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div className="cyber-footer">
                    CPECC IT Service Network &nbsp;·&nbsp; Engineered by <span style={{ color: '#94a3b8' }}>Sandeep Pillai</span>
                </div>
            </div>
        </div>
    );
}

export default AdminPortal;
