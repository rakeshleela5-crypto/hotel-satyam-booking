import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export function AdminRoute({ onBack }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const auth = sessionStorage.getItem('isAdminAuthenticated') === 'true';
        setIsAuthenticated(auth);
        setChecked(true);
    }, []);

    if (!checked) {
        return (
            <div className="section container" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--background-color)' }}>
                <p>Loading…</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return <AdminDashboard onBack={onBack} />;
}
