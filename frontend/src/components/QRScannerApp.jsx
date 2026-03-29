import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaSpinner, FaRobot, FaMicrochip, FaNetworkWired, FaTools } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://operatic-jerrod-gamily.ngrok-free.dev';
const API_URL = API_BASE + '/api/tickets';
console.log('[AI DEBUGLOG] QR Portal API Base:', API_BASE);

const AI_LIGHT_THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.qr-root * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }

.qr-bg {
    min-height: 100vh;
    background: #f0fdfa; /* Light teal/cyan tint */
    position: relative;
    overflow: hidden;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 2rem 1rem;
    color: #0f172a;
}

/* ── AI Background Grid ── */
.ai-grid {
    position: absolute; inset: 0; z-index: 0;
    background-size: 60px 60px;
    background-image: 
        linear-gradient(to right, rgba(14,165,233,0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(14,165,233,0.1) 1px, transparent 1px);
    mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 10%, transparent 90%);
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 10%, transparent 90%);
}

/* ── Floating AI Brain / Orbs ── */
.orb {
    position: absolute; border-radius: 50%; filter: blur(60px); z-index: 0; opacity: 0.5;
}
.orb-1 { width: 400px; height: 400px; background: rgba(56, 189, 248, 0.4); top: -100px; left: -100px; animation: float-1 10s infinite alternate ease-in-out; }
.orb-2 { width: 350px; height: 350px; background: rgba(16, 185, 129, 0.3); bottom: -100px; right: -50px; animation: float-2 12s infinite alternate-reverse ease-in-out; }

@keyframes float-1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(100px, 80px) scale(1.2); } }
@keyframes float-2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-80px, -100px) scale(1.1); } }

/* ── Circuit Lines ── */
.circuit {
    position: absolute; width: 2px; background: linear-gradient(180deg, transparent, #0ea5e9, transparent);
    z-index: 1; opacity: 0;
}
.c-1 { left: 15%; top:-100px; height: 300px; animation: dataDrop 5s infinite linear 1s; }
.c-2 { right: 20%; top:-100px; height: 200px; animation: dataDrop 7s infinite linear 3s; }
@keyframes dataDrop { 0% { transform: translateY(0); opacity:0; } 20% { opacity:1; } 80% { opacity:1; } 100% { transform: translateY(120vh); opacity:0; } }

/* ── Floating Tech Icons ── */
.tech-icon {
    position: absolute; color: #0284c7; font-size: 2rem; opacity: 0.4; z-index: 1;
    animation: slow-hover 6s infinite ease-in-out alternate;
}
@keyframes slow-hover { from { transform: translateY(-10px); } to { transform: translateY(10px); } }

/* ── Main Form Glass Card ── */
.qr-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 1);
    border-radius: 1.5rem; padding: 2.5rem;
    width: 100%; max-width: 540px;
    box-shadow: 0 25px 50px -12px rgba(14,165,233,0.15), 0 0 0 1px rgba(14,165,233,0.05);
    position: relative; z-index: 10;
    animation: fade-slide 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes fade-slide { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }

/* ── Inputs ── */
.ai-input {
    width: 100%; padding: 0.95rem 1.1rem;
    background: #f8fafc; border: 1px solid #cbd5e1;
    border-radius: 0.75rem; font-size: 0.95rem; color: #0f172a;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); outline: none;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.ai-input:focus {
    background: #ffffff; border-color: #0ea5e9;
    box-shadow: 0 0 0 4px rgba(14,165,233,0.15), inset 0 2px 4px rgba(0,0,0,0.02);
    transform: translateY(-2px);
}
.ai-label { display:block; font-size:0.85rem; font-weight:700; color:#475569; margin-bottom:0.4rem; letter-spacing:0.02em; }

/* ── AI Submit Button ── */
.submit-btn {
    width: 100%; padding: 1rem; margin-top: 1rem;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
    color: #fff; font-weight: 800; font-size: 1.1rem; letter-spacing: 0.03em;
    border: none; border-radius: 0.75rem; cursor: pointer;
    position: relative; overflow: hidden;
    box-shadow: 0 10px 25px rgba(37,99,235,0.3);
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
}
.submit-btn:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 15px 35px rgba(37,99,235,0.4);
}
.submit-btn::before {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: shine 3s infinite;
}
@keyframes shine { 0% { left: -100%; } 20%, 100% { left: 200%; } }

/* ── Header Area ── */
.header-area { text-align: center; margin-bottom: 2rem; position: relative; z-index: 10; }
.logo-box { 
    display: inline-flex; justify-content: center; align-items: center;
    background: #fff; padding: 1rem; border-radius: 1.25rem;
    box-shadow: 0 10px 25px rgba(14,165,233,0.1); border: 1px solid #e0f2fe;
    margin-bottom: 1rem; position: relative;
}
.logo-ring { position:absolute; inset:-4px; border-radius:1.4rem; border:2px dashed #0ea5e9; animation: spin 10s linear infinite; opacity: 0.3; }
@keyframes spin { 100% { transform: rotate(360deg); } }
`;

function QRScannerApp() {
    const [formData, setFormData] = useState({ name: '', userPhone: '', projectName: '', office: '', complaint: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [offices, setOffices] = useState([]);

    useEffect(() => {
        const id = 'ai-light-theme-css';
        if (!document.getElementById(id)) {
            const tag = document.createElement('style');
            tag.id = id;
            tag.textContent = AI_LIGHT_THEME_CSS;
            document.head.appendChild(tag);
        }

        console.log('[AI DEBUGLOG] Fetching offices from:', API_BASE + '/api/settings/offices');
        axios.get(API_BASE + `/api/settings/offices`)
            .then(res => {
                console.log('[AI DEBUGLOG] Offices received:', res.data.offices);
                setOffices(res.data.offices || []);
            })
            .catch(err => {
                console.error('[AI DEBUGLOG] Office Fetch Error:', err.message);
                setOffices([]);
            });
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/new`, formData);
            setSubmitted(true);
        } catch (err) {
            setError('System link failed. Please retry transmission.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="qr-root qr-bg">
                <div className="ai-grid"></div>
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>

                <div className="qr-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div className="logo-box">
                        <img src={`${import.meta.env.BASE_URL}cpecc-logo.png`} alt="CPECC" style={{ height: '60px' }} />
                    </div>

                    <div style={{ background: '#dcfce7', borderRadius: '50%', padding: '1.5rem', marginBottom: '1.5rem', border: '4px solid #bbf7d0', boxShadow: '0 10px 25px rgba(34,197,94,0.2)' }}>
                        <FaCheckCircle style={{ fontSize: '4rem', color: '#16a34a' }} />
                    </div>

                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Transmission Successful</h2>
                    <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                        Your support ticket has been intelligently routed to our IT engineers.<br />
                        <b>You will receive a WhatsApp acknowledgment momentarily.</b>
                    </p>

                    <button onClick={() => window.location.reload()} className="submit-btn" style={{ maxWidth: '250px' }}>
                        <FaRobot /> Start New Session
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="qr-root qr-bg">
            <div className="ai-grid"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="circuit c-1"></div>
            <div className="circuit c-2"></div>

            <FaMicrochip className="tech-icon" style={{ top: '15%', left: '15%' }} />
            <FaNetworkWired className="tech-icon" style={{ bottom: '20%', right: '10%', animationDelay: '1s' }} />
            <FaTools className="tech-icon" style={{ top: '30%', right: '15%', animationDelay: '2s' }} />

            <div className="header-area">
                <div className="logo-box">
                    <div className="logo-ring"></div>
                    <img src={`${import.meta.env.BASE_URL}cpecc-logo.png`} alt="CPECC" style={{ height: '70px', position: 'relative', zIndex: 2 }} />
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                    CPECC IT Service <span style={{ color: '#0ea5e9' }}>AI Desk</span>
                </h1>
                <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Intelligent Support Routing System
                </p>
            </div>

            <div className="qr-card">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div>
                        <label className="ai-label">End User Identity</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange}
                            className="ai-input" placeholder="Full Name" />
                    </div>

                    <div>
                        <label className="ai-label">WhatsApp Comms Number</label>
                        <input required type="text" name="userPhone" value={formData.userPhone} onChange={handleChange}
                            className="ai-input" placeholder="+1234567890" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="ai-label">Active Project</label>
                            <input required type="text" name="projectName" value={formData.projectName} onChange={handleChange}
                                className="ai-input" placeholder="e.g. Project Alpha" />
                        </div>
                        <div>
                            <label className="ai-label">Physical Location</label>
                            <select required name="office" value={formData.office} onChange={handleChange} className="ai-input">
                                <option value="">Select office...</option>
                                {offices.map(o => (
                                    <option key={o.id} value={o.name}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="ai-label">System Anomaly / Issue</label>
                        <textarea required name="complaint" value={formData.complaint} onChange={handleChange} rows="3"
                            className="ai-input" style={{ resize: 'none' }} placeholder="Describe the technical anomaly..." />
                    </div>

                    {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>{error}</p>}

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? <FaSpinner className="animate-spin" /> : <><FaRobot /> Transmit Ticket Request</>}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <a href={`${import.meta.env.BASE_URL}admin`} style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid transparent', transition: 'all 0.2s' }}>
                        Admin Authentication Gateway &rarr;
                    </a>
                </div>
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, zIndex: 10 }}>
                System Architect: Sandeep Pillai
            </p>
        </div>
    );
}

export default QRScannerApp;
