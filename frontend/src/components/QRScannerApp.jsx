import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

const API_URL = `/api/tickets`;

function QRScannerApp() {
    const [formData, setFormData] = useState({ name: '', userPhone: '', projectName: '', office: '', complaint: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [offices, setOffices] = useState([]);

    useEffect(() => {
        axios.get(`/api/settings/offices`)
            .then(res => setOffices(res.data.offices || []))
            .catch(() => setOffices([]));
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
            setError('Failed to submit ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <img src="/cpecc-logo.png" alt="CPECC Logo" className="w-20 h-20 object-contain mb-3" />
                    <h1 className="text-2xl font-bold text-white tracking-wide">CPECC IT Service Desk</h1>
                </div>

                <div className="bg-gray-800 rounded-xl p-10 flex flex-col items-center border border-gray-700 max-w-md w-full">
                    <FaCheckCircle className="text-6xl text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-center">Ticket Submitted!</h2>
                    <p className="text-gray-400 text-center mb-6">
                        You will receive an acknowledgment on WhatsApp shortly.<br />
                        Our IT team has been notified and will reach you soon.
                    </p>
                    <button onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                        Submit Another Ticket
                    </button>
                </div>

                {/* Footer */}
                <p className="mt-8 text-xs text-gray-600">Program developed by Sandeep Pillai</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-8 px-4">

            {/* CPECC Header */}
            <div className="flex flex-col items-center mb-6">
                <img src="/cpecc-logo.png" alt="CPECC Logo" className="w-20 h-20 object-contain mb-2 drop-shadow-lg" />
                <h1 className="text-2xl font-bold text-white tracking-wide">CPECC IT Service Desk</h1>
                <p className="text-gray-400 text-xs mt-1">Submit your IT support request below</p>
            </div>

            <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">

                <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-400" placeholder="John Doe" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp Number</label>
                        <input required type="text" name="userPhone" value={formData.userPhone} onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-400" placeholder="+1234567890" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                            <input required type="text" name="projectName" value={formData.projectName} onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white" placeholder="Alpha" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Office</label>
                            <select required name="office" value={formData.office} onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white">
                                <option value="">Select office...</option>
                                {offices.map(o => (
                                    <option key={o.id} value={o.name}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Complaint / Issue</label>
                        <textarea required name="complaint" value={formData.complaint} onChange={handleChange} rows="3"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-400 resize-none" placeholder="Describe your IT issue..." />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-transform transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center">
                        {loading ? <FaSpinner className="animate-spin text-xl" /> : 'Submit Ticket'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors border-b border-transparent hover:border-gray-400">
                        Admin Portal &rarr;
                    </a>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-xs text-gray-600">Program developed by Sandeep Pillai</p>
        </div>
    );
}

export default QRScannerApp;
