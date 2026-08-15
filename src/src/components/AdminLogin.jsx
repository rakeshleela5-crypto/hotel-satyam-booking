import React, { useState } from 'react';
import { apiCall } from '../api';

export function AdminLogin({ onLoginSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await apiCall('/api/admin/login', {
                method: 'POST',
                body: JSON.stringify({ password }),
            });

            if (res.success) {
                // Mark as authenticated in this session
                sessionStorage.setItem('isAdminAuthenticated', 'true');
                onLoginSuccess();
            } else {
                setError(res.error || 'Invalid password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section container" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--background-color)' }}>
            <div style={{ maxWidth: '360px', margin: '80px auto', background: 'rgba(26,26,26,0.9)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h2 className="serif mb-2" style={{ textAlign: 'center' }}>Admin Login</h2>
                <p className="mb-4" style={{ textAlign: 'center', fontSize: '14px', opacity: 0.8 }}>
                    Enter password to access the admin dashboard
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                marginTop: '6px',
                                padding: '8px 10px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: '#fff',
                            }}
                        />
                    </label>

                    {error && (
                        <p style={{ color: '#ff4d4d', fontSize: '13px', marginTop: '8px', marginBottom: '12px' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? 'Checking...' : 'Login'}
                    </button>
                </form>

                <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '16px', textAlign: 'center' }}>
                    Access is restricted to authorized staff only.
                </p>
            </div>
        </div>
    );
}