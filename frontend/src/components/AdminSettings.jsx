import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaBuilding, FaUserPlus, FaSpinner, FaCheckCircle, FaWhatsapp, FaSync, FaPlug, FaIdCard } from 'react-icons/fa';

const API_URL = `/api/settings`;

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
        <div className="space-y-8 animate-fadeIn">
            {message.text && (
                <div className={`p-4 rounded border ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
                    <div className="flex items-center">{message.type === 'success' && <FaCheckCircle className="mr-2" />}{message.text}</div>
                </div>
            )}




            {/* ─── Offices + Admins ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                        <FaBuilding className="text-2xl text-blue-500" />
                        <h2 className="text-xl font-bold">Manage Offices</h2>
                    </div>
                    <form onSubmit={handleAddOffice} className="mb-6 flex space-x-2">
                        <input type="text" required value={officeName} onChange={e => setOfficeName(e.target.value)}
                            placeholder="New Office Name (e.g. Dubai HQ)"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-colors">Add</button>
                    </form>
                    <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-700 text-xs uppercase text-gray-400">
                                <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Office Name</th></tr>
                            </thead>
                            <tbody>
                                {offices.map(o => (<tr key={o.id} className="border-t border-gray-700 hover:bg-gray-700/50"><td className="px-4 py-3">{o.id}</td><td className="px-4 py-3 font-medium text-white">{o.name}</td></tr>))}
                                {offices.length === 0 && <tr><td colSpan="2" className="px-4 py-4 text-center text-gray-500">No offices found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                        <FaUserPlus className="text-2xl text-blue-500" />
                        <h2 className="text-xl font-bold">Manage IT Admins</h2>
                    </div>
                    <form onSubmit={handleAddAdmin} className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Username</label>
                                <input type="text" required value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" placeholder="johndoe" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Password</label>
                                <input type="password" required value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">WhatsApp Number</label>
                                <input type="text" required value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" placeholder="+971..." />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Assigned Offices</label>
                                <select multiple required value={adminForm.officeIds} onChange={e => {
                                    const selected = Array.from(e.target.selectedOptions, o => o.value);
                                    setAdminForm({ ...adminForm, officeIds: selected });
                                }} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm h-20">
                                    {offices.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                                </select>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-colors flex justify-center items-center">
                            {loading ? <FaSpinner className="animate-spin" /> : 'Create IT Admin'}
                        </button>
                    </form>
                    <div className="border border-gray-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-700 text-xs uppercase text-gray-400 sticky top-0">
                                <tr><th className="px-4 py-3">Username</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Offices</th></tr>
                            </thead>
                            <tbody>
                                {users.map(u => (<tr key={u.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2 font-medium text-white">{u.username}</td>
                                    <td className="px-4 py-2 text-xs text-gray-400">{u.phone}</td>
                                    <td className="px-4 py-2 text-blue-400">{Array.isArray(u.officeIds) ? u.officeIds.map(id => `#${id}`).join(', ') : `#${u.officeIds}`}</td>
                                </tr>))}
                                {users.length === 0 && <tr><td colSpan="3" className="px-4 py-4 text-center text-gray-500">No IT Admins found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Danger Zone — SuperAdmin only */}
            {isSuperAdmin && (
                <div className="bg-red-900/20 p-6 rounded-xl border border-red-700/50 shadow-lg">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
                    <p className="text-gray-400 text-sm mb-1">Permanently delete all tickets, offices, and IT admin users.</p>
                    <p className="text-green-500 text-xs mb-4">✅ Your SuperAdmin account (<strong>Admin</strong>) is preserved after wipe.</p>
                    <button onClick={handleWipeDB} disabled={loading} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded text-white font-bold transition-colors">
                        {loading ? <FaSpinner className="animate-spin inline mr-2" /> : null} Wipe Database
                    </button>
                </div>
            )}
        </div>
    );
}

export default AdminSettings;

