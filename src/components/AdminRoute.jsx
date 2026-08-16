import React, { useEffect, useState } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export function AdminRoute({ onBack }) {
    const [isAuthenticated, setIsAuthenticated] =
        useState(false);

    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let authenticated = false;

        try {
            authenticated =
                sessionStorage.getItem(
                    'isAdminAuthenticated'
                ) === 'true';
        } catch (error) {
            console.error(
                'Could not read admin session:',
                error
            );
        }

        setIsAuthenticated(authenticated);
        setChecked(true);
    }, []);

    const handleLoginSuccess = () => {
        try {
            sessionStorage.setItem(
                'isAdminAuthenticated',
                'true'
            );
        } catch (error) {
            console.error(
                'Could not save admin session:',
                error
            );
        }

        setIsAuthenticated(true);
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }

        window.location.href = '/';
    };

    if (!checked) {
        return (
            <div
                className="section container"
                style={{
                    padding: '40px 20px',
                    minHeight: '100vh',
                    background: 'var(--background-color)',
                    textAlign: 'center'
                }}
            >
                <p>Loading secure dashboard...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <AdminLogin
                onLoginSuccess={handleLoginSuccess}
            />
        );
    }

    return (
        <AdminDashboard
            onBack={handleBack}
        />
    );
}