import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaBuilding, FaUserPlus, FaSpinner, FaCheckCircle, FaWhatsapp, FaSync, FaPlug, FaIdCard } from 'react-icons/fa';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/settings';

function AdminSettings() {
    const [offices, setOffices] = useState([]);
    const [users, setUsers] = useState([]);
    const [officeName, setOfficeName] = useState('');
    const [adminForm, setAdminForm] = useState({ username: '', password: '', phone: '', officeIds: [] });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });



    // Super Admin Display Name & Contact (shown in all user-facing WhatsApp messages)
    const [superAdmin, setSuperAdmin] = useState({ name: '', contact: '' });
    const [superAdminSaving, setSuperAdminSaving] = useState(false);

    useEffect(() => {
        fetchData();
        fetchSuperAdmin();
    }, []);

    const fetchSuperAdmin = async () => {
        try {
            const res = await axios.get(`${API_URL}/superadmin`);
            if (res.data.success) setSuperAdmin({ name: res.data.name || '', contact: res.data.contact || '' });
        } catch { }
    };

    const handleSaveSuperAdmin = async (e) => {
        e.preventDefault();
        setSuperAdminSaving(true);
        try {
            const res = await axios.post(`${API_URL}/superadmin`, superAdmin);
            if (res.data.success) showMessage('success', '✅ IT Team contact info saved! All user messages will now use this name and number.');
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to save.');
        }
        setSuperAdminSaving(false);
    };

    const fetchData = async () => {
        try {
            const [officeRes, userRes] = await Promise.all([
                axios.get(`${API_URL}/offices`),
                axios.get(`${API_URL}/users`)
            ]);
            setOffices(officeRes.data.offices || []);
            setUsers(userRes.data.users || []);
        } catch (err) { console.error('Failed to fetch settings data', err); }
    };



    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleAddOffice = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/offices`, { name: officeName });
            if (res.data.success) { setOffices([...offices, res.data.office]); setOfficeName(''); showMessage('success', 'Office added!'); }
        } catch (err) { showMessage('error', err.response?.data?.error || 'Failed to add office'); }
        setLoading(false);
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/users`, adminForm);
            if (res.data.success) { setUsers([...users, res.data.user]); setAdminForm({ username: '', password: '', phone: '', officeIds: [] }); showMessage('success', 'IT Admin created!'); }
        } catch (err) { showMessage('error', err.response?.data?.error || 'Failed to add admin'); }
        setLoading(false);
    };

    const handleWipeDB = async () => {
        if (!window.confirm("Are you absolutely sure? This will delete ALL tickets, offices, and IT admins. Your SuperAdmin account will be preserved.")) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${API_URL}/wipe`, { token });
            if (res.data.success) {
                showMessage('success', 'Database wiped! SuperAdmin account preserved.');
                setOffices([]);
                setUsers([]);
            }
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to wipe database.');
        }
        setLoading(false);
    };

    const isSuperAdmin = localStorage.getItem('adminRole') === 'SuperAdmin';

    return (
        <div className="space-y-8">
            {message.text && (
                <div className={`p-4 rounded-xl border animate-slide-up ${message.type === 'success' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                    <div className="flex items-center font-bold">{message.type === 'success' && <FaCheckCircle className="mr-2" />}{message.text}</div>
                </div>
            )}

            {/* Sub-header to match the theme */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                    <FaCogs style={{ display: 'inline', color: '#0ea5e9' }} /> System <span style={{ color: '#0ea5e9' }}>Configuration</span>
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>CPECC IT Core Network Management</p>
            </div>

            {/* ─── Offices + Admins ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="ai-glass" style={{ padding: '2rem' }}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: '1rem' }}>
                            <FaBuilding className="text-2xl text-blue-600" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800">Operational Sectors</h2>
                    </div>
                    <form onSubmit={handleAddOffice} className="mb-6 flex space-x-2">
                        <input type="text" required value={officeName} onChange={e => setOfficeName(e.target.value)}
                            placeholder="New Office Name (e.g. Dubai HQ)"
                            className="ai-input flex-1" />
                        <button type="submit" disabled={loading} className="ai-btn" style={{ marginTop: 0, width: 'auto', padding: '0 1.5rem' }}>Add</button>
                    </form>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden', background: '#fff' }}>
                        <table className="w-full text-left text-sm">
                            <thead style={{ background: '#f8fafc' }}>
                                <tr><th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Sector ID</th><th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Location Name</th></tr>
                            </thead>
                            <tbody>
                                {offices.map(o => (<tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-mono text-blue-500 font-bold">#{o.id}</td><td className="px-4 py-3 font-bold text-slate-700">{o.name}</td></tr>))}
                                {offices.length === 0 && <tr><td colSpan="2" className="px-4 py-4 text-center text-slate-400 font-semibold italic">No localized sectors found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="ai-glass" style={{ padding: '2rem' }}>
                    <div className="flex items-center space-x-3 mb-6">
                        <div style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: '1rem' }}>
                            <FaUserPlus className="text-2xl text-blue-600" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800">IT Operator Node</h2>
                    </div>
                    <form onSubmit={handleAddAdmin} className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="ai-label">Operator ID</label>
                                <input type="text" required value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })}
                                    className="ai-input" placeholder="johndoe" />
                            </div>
                            <div>
                                <label className="ai-label">Secure Phrasal</label>
                                <input type="password" required value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                    className="ai-input" placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="ai-label">Comms Frequency</label>
                                <input type="text" required value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })}
                                    className="ai-input" placeholder="+971..." />
                            </div>
                            <div>
                                <label className="ai-label">Sector Permissions</label>
                                <select multiple required value={adminForm.officeIds} onChange={e => {
                                    const selected = Array.from(e.target.selectedOptions, o => o.value);
                                    setAdminForm({ ...adminForm, officeIds: selected });
                                }} className="ai-input h-20">
                                    {offices.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="ai-btn">
                            {loading ? <FaSpinner className="animate-spin" /> : <><FaRobot /> Initialize Operator</>}
                        </button>
                    </form>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden', background: '#fff', maxHeight: '200px', overflowY: 'auto' }}>
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0" style={{ background: '#f8fafc', zIndex: 5 }}>
                                <tr><th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Access ID</th><th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Comms</th><th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px]">Sectors</th></tr>
                            </thead>
                            <tbody>
                                {users.map(u => (<tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-2 font-bold text-slate-700">{u.username}</td>
                                    <td className="px-4 py-2 font-mono text-[11px] text-slate-500">{u.phone}</td>
                                    <td className="px-4 py-2">
                                        {Array.isArray(u.officeIds) ? u.officeIds.map(id => (<span key={id} className="inline-block px-1.5 py-0.5 m-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100">#{id}</span>)) : <span className="text-blue-500 font-bold">#{u.officeIds}</span>}
                                    </td>
                                </tr>))}
                                {users.length === 0 && <tr><td colSpan="3" className="px-4 py-4 text-center text-slate-400 font-semibold italic">No operators active.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Danger Zone — SuperAdmin only */}
            {isSuperAdmin && (
                <div style={{ background: '#fff1f2', border: '2px dashed #fecdd3', padding: '2rem', borderRadius: '1.5rem' }}>
                    <h2 className="text-xl font-extrabold text-rose-600 mb-2">Critical Data Override</h2>
                    <p className="text-slate-500 text-sm font-semibold mb-1">Permanently purge all network data, including tickets and operator nodes.</p>
                    <p className="text-emerald-600 text-[11px] font-black uppercase mb-4 tracking-wider">🔒 Master account preserved</p>
                    <button onClick={handleWipeDB} disabled={loading} className="px-8 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-black transition-all shadow-lg shadow-rose-200 active:transform active:scale-95">
                        {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null} Purge Core Database
                    </button>
                </div>
            )}
        </div>
    );
}

export default AdminSettings;

