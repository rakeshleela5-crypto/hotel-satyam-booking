import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist-min';

const Plot = createPlotlyComponent(Plotly);

export function AdminDashboard({ onBack }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [walkins, setWalkins] = useState([]);
  const [walkinsLoading, setWalkinsLoading] = useState(false);

  const [onlineBookings, setOnlineBookings] = useState([]);
  const [onlineBookingsLoading, setOnlineBookingsLoading] = useState(false);

  const [walkinDate, setWalkinDate] = useState(() => {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  });

  const [revenueTrend, setRevenueTrend] = useState([]);
  const [revenueTrendLoading, setRevenueTrendLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(7); // 7 | 14 | 30

  useEffect(() => {
    fetchBookings();
    fetchTodayWalkins(walkinDate);
    fetchTodayOnlineBookings(walkinDate);
    fetchRevenueTrend(trendDays);
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

  const fetchTodayWalkins = async (date) => {
    try {
      setWalkinsLoading(true);
      const data = await apiCall(`/api/admin/walkins?date=${date}`);
      if (data.success) {
        setWalkins(data.walkins);
      }
    } catch (err) {
      console.error('Failed to fetch today walk-ins:', err);
    } finally {
      setWalkinsLoading(false);
    }
  };

  const fetchTodayOnlineBookings = async (date) => {
    try {
      setOnlineBookingsLoading(true);
      const data = await apiCall(`/api/admin/online-bookings?date=${date}`);
      if (data.success) {
        setOnlineBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch today online bookings:', err);
    } finally {
      setOnlineBookingsLoading(false);
    }
  };

  const fetchRevenueTrend = async (days) => {
    try {
      setRevenueTrendLoading(true);
      const data = await apiCall(`/api/admin/revenue-trend?days=${days}`);
      if (data.success) {
        setRevenueTrend(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch revenue trend:', err);
    } finally {
      setRevenueTrendLoading(false);
    }
  };

  const handleRefreshWalkins = () => {
    fetchTodayWalkins(walkinDate);
    fetchTodayOnlineBookings(walkinDate);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setWalkinDate(newDate);
    fetchTodayWalkins(newDate);
    fetchTodayOnlineBookings(newDate);
  };

  const handleTrendDaysChange = (e) => {
    const days = parseInt(e.target.value, 10);
    setTrendDays(days);
    fetchRevenueTrend(days);
  };

  const getStatusBadge = (status) => {
    if (status === 'SAFE') return <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✅ SAFE</span>;
    if (status === 'FLAGGED') return <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>🚨 FLAGGED</span>;
    return <span style={{ color: '#aaa' }}>⏳ Pending Analysis...</span>;
  };

  // Walk-ins stats
  const totalWalkins = walkins.length;

  const totalAmountTodayWalkins = walkins.reduce((sum, b) => {
    const amt = parseFloat(b.total_amount) || 0;
    return sum + amt;
  }, 0);

  const averageBookingAmountWalkins = totalWalkins > 0 ? totalAmountTodayWalkins / totalWalkins : 0;

  const totalNightsWalkins = walkins.reduce((sum, b) => {
    const nights = parseInt(b.nights) || 0;
    return sum + nights;
  }, 0);

  const revenuePerNightWalkins = totalNightsWalkins > 0 ? totalAmountTodayWalkins / totalNightsWalkins : 0;

  // Online bookings stats
  const totalOnline = onlineBookings.length;

  const totalAmountTodayOnline = onlineBookings.reduce((sum, b) => {
    const amt = parseFloat(b.total_amount) || 0;
    return sum + amt;
  }, 0);
  
  const averageBookingAmountOnline = totalOnline > 0 ? totalAmountTodayOnline / totalOnline : 0;

  const totalNightsOnline = onlineBookings.reduce((sum, b) => {
    const nights = parseInt(b.nights) || 0;
    return sum + nights;
  }, 0);

  const revenuePerNightOnline = totalNightsOnline > 0 ? totalAmountTodayOnline / totalNightsOnline : 0;

  // Revenue trend totals for selected period
  const totalWalkinRevenue = revenueTrend.reduce((sum, r) => sum + (r.walkin_revenue || 0), 0);
  const totalOnlineRevenue = revenueTrend.reduce((sum, r) => sum + (r.online_revenue || 0), 0);

  // Prepare chart data
  const dates = revenueTrend.map(r => r.date);
  const walkinSeries = revenueTrend.map(r => r.walkin_revenue);
  const onlineSeries = revenueTrend.map(r => r.online_revenue);

  const layout = {
    margin: { t: 30, b: 40, l: 50, r: 20 },
    height: 260,
    xaxis: {
      title: 'Date',
      tickangle: -30,
      tickfont: { size: 11 },
    },
    yaxis: {
      title: 'Revenue (₹)',
      tickfont: { size: 11 },
    },
    barmode: 'group',
    showlegend: true,
    legend: { x: 0, y: 1 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#ddd' },
  };

  const traces = [
    {
      x: dates,
      y: walkinSeries,
      name: 'Walk‑in',
      type: 'bar',
      marker: { color: '#D4AF37' },
    },
    {
      x: dates,
      y: onlineSeries,
      name: 'Online',
      type: 'bar',
      marker: { color: '#3b82f6' },
    },
  ];

  return (
    <div className="section container" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--background-color)' }}>
      <button className="btn-small-secondary mb-4" onClick={onBack}>← Back to Website</button>
      <h2 className="serif mb-2">Admin Dashboard</h2>
      <p className="mb-6">AI-Powered Booking Analysis & Fraud Detection</p>

      {/* Today’s Walk‑ins Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="serif">Today’s Walk‑ins</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px' }}>
              Date:
              <input
                type="date"
                value={walkinDate}
                onChange={handleDateChange}
                style={{ marginLeft: '6px', padding: '4px 6px', fontSize: '13px' }}
              />
            </label>
            <button
              className="btn-small-secondary"
              onClick={handleRefreshWalkins}
              disabled={walkinsLoading || onlineBookingsLoading}
              style={{ marginLeft: '6px' }}
            >
              {walkinsLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <p className="mb-2" style={{ fontSize: '14px', opacity: 0.8 }}>
          Walk‑in bookings with check‑in date = {walkinDate}
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Total walk‑ins: {totalWalkins}
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Total amount today (walk‑in): ₹{totalAmountTodayWalkins.toLocaleString('en-IN')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Average booking amount (walk‑in): ₹{Math.round(averageBookingAmountWalkins).toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Revenue per night (walk‑in): ₹{Math.round(revenuePerNightWalkins).toLocaleString('en-IN')}
          </p>
        </div>

        {walkinsLoading ? (
          <p>Loading walk‑ins…</p>
        ) : walkins.length === 0 ? (
          <p>No walk‑in bookings for this date.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>Booking ID</th>
                  <th style={{ padding: '8px' }}>Guest Name</th>
                  <th style={{ padding: '8px' }}>Phone</th>
                  <th style={{ padding: '8px' }}>Check‑in</th>
                  <th style={{ padding: '8px' }}>Check‑out</th>
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

      {/* Today’s Online Bookings Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="serif">Today’s Online Bookings</h3>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>
            Check‑in date = {walkinDate}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Total online bookings: {totalOnline}
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Total amount today (online): ₹{totalAmountTodayOnline.toLocaleString('en-IN')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Average booking amount (online): ₹{Math.round(averageBookingAmountOnline).toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Revenue per night (online): ₹{Math.round(revenuePerNightOnline).toLocaleString('en-IN')}
          </p>
        </div>

        {onlineBookingsLoading ? (
          <p>Loading online bookings…</p>
        ) : onlineBookings.length === 0 ? (
          <p>No online bookings for this date.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>Booking ID</th>
                  <th style={{ padding: '8px' }}>Guest Name</th>
                  <th style={{ padding: '8px' }}>Phone</th>
                  <th style={{ padding: '8px' }}>Check‑in</th>
                  <th style={{ padding: '8px' }}>Check‑out</th>
                  <th style={{ padding: '8px' }}>Nights</th>
                  <th style={{ padding: '8px' }}>Amount</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {onlineBookings.map(b => (
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

      {/* Revenue Trend (Last 7/14/30 Days) */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="serif">Revenue Trend</h3>
          <label style={{ fontSize: '13px' }}>
            Period:
            <select
              value={trendDays}
              onChange={handleTrendDaysChange}
              style={{ marginLeft: '6px', padding: '4px 6px', fontSize: '13px' }}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
        </div>

        <p className="mb-2" style={{ fontSize: '14px', opacity: 0.8 }}>
          Daily walk‑in vs online booking revenue by check‑in date
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Total walk‑in revenue: ₹{Math.round(totalWalkinRevenue).toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>
            Total online revenue: ₹{Math.round(totalOnlineRevenue).toLocaleString('en-IN')}
          </p>
        </div>

        {revenueTrendLoading ? (
          <p>Loading revenue trend…</p>
        ) : revenueTrend.length === 0 ? (
          <p>No revenue data available for the selected period.</p>
        ) : (
          <div style={{
            background: 'rgba(26,26,26,0.9)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <Plot
              data={traces}
              layout={layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
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