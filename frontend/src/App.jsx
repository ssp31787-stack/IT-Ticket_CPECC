import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QRScannerApp from './components/QRScannerApp';
import AdminPortal from './components/AdminPortal';
import './index.css';

function App() {
    return (
        <Router basename="/IT-Ticket_CPECC">
            <Routes>
                <Route path="/" element={<QRScannerApp />} />
                <Route path="/admin/*" element={<AdminPortal />} />
            </Routes>
        </Router>
    );
}

export default App;
