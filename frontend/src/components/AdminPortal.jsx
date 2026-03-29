import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUserShield, FaSignOutAlt, FaFilter, FaDownload, FaCog, FaList, FaSync, FaServer, FaDesktop, FaNetworkWired, FaDatabase, FaRobot, FaMicrochip, FaCogs } from 'react-icons/fa';
import AdminSettings from './AdminSettings';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

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

const AI_LIGHT_THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;600&display=swap');

.portal-root * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }
.portal-mono { font-family: 'Fira Code', monospace; }

.portal-bg {
    min-height: 100vh;
    background: #f0fdfa;
    position: relative;
    overflow: hidden;
    color: #0f172a;
    display: flex;
    justify-content: center;
}

.ai-grid {
    position: absolute; inset: 0; z-index: 0;
    background-size: 60px 60px;
    background-image: 
        linear-gradient(to right, rgba(14,165,233,0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(14,165,233,0.15) 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 40%, transparent 90%);
    -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 40%, transparent 90%);
}
.portal-bg::before, .portal-bg::after {
    content: ''; position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.6;
}
.portal-bg::before { width: 600px; height: 600px; background: rgba(56, 189, 248, 0.3); top: -150px; left: -100px; animation: blob-drift 12s infinite alternate ease-in-out; }
.portal-bg::after { width: 500px; height: 500px; background: rgba(16, 185, 129, 0.2); bottom: -150px; right: -100px; animation: blob-drift 15s infinite alternate-reverse ease-in-out; }
@keyframes blob-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(100px, 80px) scale(1.1); } }

.ai-scanner {
    position: absolute; width: 100%; height: 4px;
    background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
    top: -10px; z-index: 1; opacity: 0.5; filter: drop-shadow(0 4px 6px rgba(14,165,233,0.5));
    animation: scan-down 8s infinite linear;
}
@keyframes scan-down { 0% { top: -10px; } 100% { top: 110vh; } }

.ai-node {
    position: absolute;
    width: 60px; height: 60px;
    background: rgba(255,255,255,0.7); backdrop-filter: blur(8px);
    border: 1px solid rgba(14,165,233,0.3); border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    color: #0ea5e9; font-size: 1.8rem;
    box-shadow: 0 10px 25px rgba(14,165,233,0.15); z-index: 2;
}
.ai-node-glow {
    position: absolute; inset: -4px;
    border-radius: 20px; border: 2px dashed rgba(16,185,129,0.5);
    animation: ring-spin 8s infinite linear;
}
@keyframes ring-spin { 100% { transform: rotate(360deg); } }
.float-s { animation: aiHover 6s infinite ease-in-out alternate; }
.float-f { animation: aiHover 4s infinite ease-in-out alternate-reverse; }
@keyframes aiHover { from { transform: translateY(-15px) rotate(-5deg); } to { transform: translateY(15px) rotate(5deg); } }

.ai-glass {
    background: rgba(255,255,255,0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.9); border-radius: 1.5rem;
    box-shadow: 0 20px 40px -10px rgba(14,165,233,0.15), 0 0 0 1px rgba(14,165,233,0.05);
    position: relative; z-index: 10;
}
.glass-login { width: 100%; max-width: 440px; padding: 2.5rem; align-self: center; margin: 1.5rem; animation: slide-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes slide-up { from { opacity:0; transform:translateY(40px) scale(0.96); } to { opacity:1; transform:none; } }

.brain-wrapper { display: flex; justify-content: center; margin-bottom: 1.5rem; position: relative; }
.brain-icon { font-size: 4rem; color: #0ea5e9; position: relative; z-index: 2; animation: brain-pulse 2s infinite alternate ease-in-out; }
.brain-ring { position: absolute; width: 80px; height: 80px; border: 2px solid rgba(14,165,233,0.3); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); animation: radar 3s infinite; }
@keyframes brain-pulse { from { filter: drop-shadow(0 0 10px rgba(14,165,233,0.2)); } to { filter: drop-shadow(0 0 25px rgba(14,165,233,0.6)); } }
@keyframes radar { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }

.ai-input { width: 100%; padding: .9rem 1rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: .75rem; font-size:.95rem; color: #0f172a; transition: all .2s; outline: none; }
.ai-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,0.15); }
.ai-label { display:block; font-size:.8rem; font-weight:700; color:#475569; margin-bottom:.4rem; text-transform:uppercase; letter-spacing:0.05em; }

.ai-btn {
    width: 100%; padding: 1rem; margin-top: 1rem;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #fff; font-weight: 800; font-size: 1.05rem; letter-spacing: .03em;
    border: none; border-radius: .75rem; cursor: pointer; position: relative; overflow: hidden;
    box-shadow: 0 10px 25px rgba(37,99,235,0.3); transition: all .3s cubic-bezier(0.2, 0.8, 0.2, 1);
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
}
.error-msg { background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; border-radius: .6rem; padding: .8rem; font-size: .85rem; text-align: center; margin-bottom: 1.5rem; font-weight: 600; }

.dash-content { width: 100%; max-width: 1400px; padding: 1.5rem; position: relative; z-index: 10; margin: 0 auto; }
.dash-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; padding: 1.25rem 1.75rem; }
.dash-title { font-size:1.6rem; font-weight:800; color:#0f172a; letter-spacing:-0.02em; }
.dash-sub { font-size:.8rem; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }

.nav-btn { display:flex; align-items:center; gap:.5rem; padding:.6rem 1.25rem; border-radius:.75rem; font-weight:700; cursor:pointer; background: transparent; color: #64748b; border: 1px solid transparent; transition: all .2s; }
.nav-btn:hover { background: #f1f5f9; color: #0f172a; }
.nav-btn.active { background: #e0f2fe; color: #0ea5e9; border-color: #bae6fd; box-shadow: 0 4px 12px rgba(14,165,233,0.1); }
.ico-btn { display:flex; align-items:center; justify-content:center; padding:.6rem; border-radius:.75rem; border:1px solid #e2e8f0; background:#fff; color:#64748b; cursor:pointer; transition:all .2s; }

.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; margin-bottom:1.5rem; }
@media(max-width:800px){ .stat-grid{ grid-template-columns:repeat(2,1fr); } }
.stat-box { padding: 1.5rem; text-align: center; transition: all .3s; position: relative; overflow: hidden; }
.stat-box::before { content:''; position:absolute; top:0; left:0; width:100%; height:4px; background: var(--stat-color); }
.stat-val { font-size:2.5rem; font-weight:800; font-family:'Fira Code', monospace; line-height:1; margin-bottom:.5rem; color: #0f172a; }
.stat-lbl { font-size:.7rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:.05em; display:flex; align-items:center; justify-content:center; gap:.4rem; }

.filter-bar { padding: 1rem 1.5rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.text-filter { flex:1; min-width:220px; padding:.7rem 1.1rem; border-radius:.75rem; border:1px solid #cbd5e1; background:#f8fafc; font-size:.9rem; outline:none; transition:all .2s; font-weight:500; }
.text-filter:focus { border-color:#0ea5e9; box-shadow:0 0 0 3px rgba(14,165,233,0.15); background:#fff; }
.drop-filter { padding:.7rem 1.1rem; border-radius:.75rem; border:1px solid #cbd5e1; background:#f8fafc; font-weight:600; font-size:.85rem; outline:none; cursor:pointer; color:#0f172a; }

.ticket-table { width:100%; border-collapse:collapse; font-size:.85rem; }
.ticket-table thead { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
.ticket-table th { padding:1.1rem; color:#475569; font-weight:800; font-size:.7rem; text-transform:uppercase; letter-spacing:.05em; text-align:left; }
.ticket-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: all .2s; }
.ticket-table td { padding: 1.1rem; vertical-align: middle; color: #334155; }
.id-badge { color: #0ea5e9; font-weight: 700; font-size: .85rem; padding: 0.3rem 0.6rem; background: #e0f2fe; border-radius: 0.4rem; border: 1px solid #bae6fd; }
.state-pill { display:inline-flex; align-items:center; gap:.4rem; padding:.3rem .8rem; border-radius:999px; font-size:.75rem; font-weight:700; border:1px solid; }

.act-excel { background:linear-gradient(135deg, #10b981, #059669); border:none; color:#fff; padding:.7rem 1.25rem; border-radius:.75rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:.5rem; box-shadow: 0 4px 15px rgba(16,185,129,0.3); transition:all .2s; }
`;

function AnimatedAiNode({ icon: Icon, style, animClass }) {
    return (
        <div className={`ai-node ${animClass}`} style={style}>
            <div className="ai-node-glow"></div>
            <Icon />
        </div>
    );
}

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
        const id = 'ai-light-portal-css';
        if (!document.getElementById(id)) {
            const tag = document.createElement('style');
            tag.id = id; tag.textContent = AI_LIGHT_THEME_CSS;
            document.head.appendChild(tag);
        }
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
        localStorage.removeItem('adminToken'); setIsLoggedIn(false); setTickets([]);
        clearInterval(refreshIntervalRef.current);
    };

    const filteredTickets = tickets.filter(t => {
        const q = filter.toLowerCase();
        const matchSearch = t.ticketId.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q) || t.office.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
        return matchSearch && (statusFilter === 'all' || t.status === statusFilter);
    });

    const stats = {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'Pending').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
        active: tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Pending').length,
    };

    const handleExcelExport = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/export`);
            if (res.data.success) alert(`Excel exported: ${res.data.path}`);
        } catch { alert('Export failed'); }
    };

    const Background = () => (
        <>
            <div className="ai-grid"></div>
            <div className="ai-scanner"></div>
            <AnimatedAiNode icon={FaRobot} style={{ top: '12%', left: '10%' }} animClass="float-s" />
            <AnimatedAiNode icon={FaMicrochip} style={{ top: '25%', right: '10%' }} animClass="float-f" />
            <AnimatedAiNode icon={FaDatabase} style={{ bottom: '15%', left: '15%' }} animClass="float-f" />
            <AnimatedAiNode icon={FaNetworkWired} style={{ bottom: '20%', right: '15%' }} animClass="float-s" />
        </>
    );

    if (!isLoggedIn) {
        return (
            <div className="portal-root portal-bg">
                <Background />
                <div className="ai-glass glass-login">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <img src={`${import.meta.env.BASE_URL || '/'}cpecc-logo.png`} alt="CPECC" style={{ height: '50px' }} />
                    </div>
                    <div className="brain-wrapper">
                        <div className="brain-ring"></div>
                        <FaRobot className="brain-icon" />
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>IT AI Security Core</h2>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authentication Required</span>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1rem' }}>
                        <div>
                            <label className="ai-label">Admin Identity</label>
                            <input type="text" required autoComplete="username" className="ai-input" placeholder="Enter ID..." value={credentials.username} onChange={e => setCredentials({ ...credentials, username: e.target.value })} />
                        </div>
                        <div>
                            <label className="ai-label">Security Passkey</label>
                            <input type="password" required autoComplete="current-password" className="ai-input" placeholder="••••••••" value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })} />
                        </div>
                        <button type="submit" className="ai-btn"><FaUserShield /> Access AI Core Network</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="portal-root portal-bg" style={{ animation: 'slide-up 0.5s ease-out' }}>
            <Background />
            <div className="dash-content">
                <div className="ai-glass dash-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={`${import.meta.env.BASE_URL || '/'}cpecc-logo.png`} alt="CPECC" style={{ height: '45px' }} />
                        <div>
                            <div className="dash-title">CPECC IT Service <span style={{ color: '#0ea5e9' }}>AI Hub</span></div>
                            {lastRefresh && <div className="dash-sub">Network Node Synced: {lastRefresh.toLocaleTimeString()}</div>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><FaList /> Process Tickets</button>
                        <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><FaCogs /> System Config</button>
                        <button className="ico-btn" onClick={fetchTickets} title="Force Sync"><FaSync /></button>
                        <button className="nav-btn" onClick={handleLogout} style={{ color: '#e11d48' }}><FaSignOutAlt /> End Session</button>
                    </div>
                </div>

                {activeTab === 'settings' ? (
                    <div className="ai-glass" style={{ padding: '2rem' }}><AdminSettings /></div>
                ) : (
                    <>
                        <div className="stat-grid">
                            {[
                                { label: 'Total Data Nodes', value: stats.total, color: '#0ea5e9', shadow: 'rgba(14,165,233,0.15)', icon: <FaServer /> },
                                { label: 'Pending Analysis', value: stats.pending, color: '#d97706', shadow: 'rgba(217,119,6,0.15)', icon: <FaMicrochip /> },
                                { label: 'Active Processing', value: stats.active, color: '#8b5cf6', shadow: 'rgba(139,92,246,0.15)', icon: <FaNetworkWired /> },
                                { label: 'AI Resolved', value: stats.resolved, color: '#10b981', shadow: 'rgba(16,185,129,0.15)', icon: <FaRobot /> },
                            ].map(s => (
                                <div key={s.label} className="ai-glass stat-box" style={{ '--stat-color': s.color, '--hover-shadow': s.shadow }}>
                                    <div className="stat-val">{s.value}</div>
                                    <div className="stat-lbl">{s.icon} {s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="ai-glass filter-bar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '250px' }}>
                                <FaFilter style={{ color: '#94a3b8' }} />
                                <input type="text" placeholder="Scan Network for Identity, Project, or ID..." value={filter} onChange={e => setFilter(e.target.value)} className="text-filter" />
                            </div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="drop-filter">
                                <option value="all">Any Status Level</option>
                                {Object.keys(STATUS_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <button onClick={handleExcelExport} className="act-excel"><FaDownload /> Export Network Data</button>
                        </div>

                        <div className="ai-glass" style={{ overflowX: 'auto' }}>
                            <table className="ticket-table">
                                <thead><tr><th>Ticket ID Node</th><th>Timestamp</th><th>User Identity</th><th>Physical Location</th><th>Anomaly Detected</th><th>Current Status AI</th><th>Assigned Engineer</th></tr></thead>
                                <tbody>
                                    {filteredTickets.map(t => {
                                        const s = getStatusStyle(t.status);
                                        return (
                                            <tr key={t.ticketId} style={{ opacity: t.status === 'Resolved' ? 0.6 : 1 }}>
                                                <td><span className="id-badge portal-mono">{t.ticketId}</span></td>
                                                <td style={{ fontSize: '.75rem', color: '#64748b' }}>{new Date(t.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.name}</div>
                                                    <div className="portal-mono" style={{ fontSize: '.75rem', color: '#64748b' }}>{t.userPhone}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.projectName}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#0ea5e9', fontWeight: 600 }}>{t.office}</div>
                                                </td>
                                                <td style={{ maxWidth: '280px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontWeight: 600 }} title={t.complaint}>{t.complaint}</div></td>
                                                <td><span className={`state-pill ${s.bg} ${s.text} ${s.border}`}>{s.dot} {t.status}</span></td>
                                                <td style={{ fontSize: '.8rem' }}>
                                                    {t.resolvedByName ? <span style={{ color: '#10b981', fontWeight: 800 }}><FaRobot style={{ display: 'inline' }} /> {t.resolvedByName}</span> : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned...</span>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredTickets.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 600 }}>Zero anomalies detected in sector search.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminPortal;
