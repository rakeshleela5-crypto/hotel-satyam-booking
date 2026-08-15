import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';

export function AdminDashboard({ onBack }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [walkins, setWalkins] = useState([]);
  const [walkinsLoading, setWalkinsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    fetchTodayWalkins();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/bookings');
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayWalkins = async () => {
    try {
      setWalkinsLoading(true);
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const data = await apiCall(`/api/admin/walkins?date=${today}`);
      if (data.success) {
        setWalkins(data.walkins);
      }
    } catch (err) {
      console.error('Failed to fetch today walk-ins:', err);
    } finally {
      setWalkinsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'SAFE') return <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✅ SAFE</span>;
    if (status === 'FLAGGED') return <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>🚨 FLAGGED</span>;
    return <span style={{ color: '#aaa' }}>⏳ Pending Analysis...</span>;
  };

  return (
    <div className="section container" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--background-color)' }}>
      <button className="btn-small-secondary mb-4" onClick={onBack}>← Back to Website</button>
      <h2 className="serif mb-2">Admin Dashboard</h2>
      <p className="mb-6">AI-Powered Booking Analysis & Fraud Detection</p>

      {/* Today’s Walk-ins Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 className="serif mb-2">Today’s Walk-ins</h3>
        <p className="mb-4" style={{ fontSize: '14px', opacity: 0.8 }}>
          Walk-in bookings with check-in date = today
        </p>

        {walkinsLoading ? (
          <p>Loading today’s walk-ins…</p>
        ) : walkins.length === 0 ? (
          <p>No walk-in bookings for today.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>Booking ID</th>
                  <th style={{ padding: '8px' }}>Guest Name</th>
                  <th style={{ padding: '8px' }}>Phone</th>
                  <th style={{ padding: '8px' }}>Check-in</th>
                  <th style={{ padding: '8px' }}>Check-out</th>
                  <th style={{ padding: '8px' }}>Nights</th>
                  <th style={{ padding: '8px' }}>Amount</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {walkins.map(b => (
                  <tr key={b.booking_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}>{b.booking_id}</td>
                    <td style={{ padding: '8px' }}>{b.full_name}</td>
                    <td style={{ padding: '8px' }}>{b.phone}</td>
                    <td style={{ padding: '8px' }}>{b.check_in}</td>
                    <td style={{ padding: '8px' }}>{b.check_out}</td>
                    <td style={{ padding: '8px' }}>{b.nights}</td>
                    <td style={{ padding: '8px' }}>₹{b.total_amount}</td>
                    <td style={{ padding: '8px' }}>{b.booking_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Bookings (AI Fraud Analysis) */}
      <div>
        <h3 className="serif mb-2">All Bookings (AI Fraud Analysis)</h3>
        <p className="mb-4" style={{ fontSize: '14px', opacity: 0.8 }}>
          Latest 50 bookings with AI fraud status
        </p>

        {loading ? (
          <p>Loading bookings…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {bookings.map(booking => (
              <div key={booking.booking_id} style={{
                background: 'rgba(26,26,26,0.9)',
                padding: '20px',
                borderRadius: '12px',
                border: booking.fraud_status === 'FLAGGED' ? '1px solid #ff4d4d' : '1px solid var(--border-color)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                  {getStatusBadge(booking.fraud_status)}
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{booking.booking_id} - {booking.full_name}</h3>
                <p><strong>Phone:</strong> {booking.phone}</p>
                <p><strong>Check In:</strong> {booking.check_in} | <strong>Check Out:</strong> {booking.check_out} ({booking.nights} nights)</p>
                <p><strong>Amount:</strong> ₹{booking.total_amount} | <strong>Status:</strong> {booking.booking_status}</p>

                {booking.fraud_reason && (
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '8px',
                    borderLeft: booking.fraud_status === 'FLAGGED' ? '4px solid #ff4d4d' : '4px solid #4CAF50'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px', color: '#D4AF37' }}>AI Analysis Report:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', color: '#ddd', margin: 0 }}>
                      {booking.fraud_reason}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {bookings.length === 0 && <p>No bookings found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}