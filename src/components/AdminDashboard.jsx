import React, { useState, useEffect } from 'react';
import {
  apiCall,
  blockRoomDates,
  getBlockedDates,
  unblockRoomDate,
  getAdminRoomsList,
  getServiceTickets,
  updateServiceTicketStatus,
  getDynamicPricing,
  generateReviewResponse
} from '../api';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-basic-dist-min';

const Plot = createPlotlyComponent(Plotly);

export function AdminDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('blocking'); // 'blocking' | 'revenue' | 'fraud' | 'ai'

  // AI Operations & Tickets State
  const [aiTickets, setAiTickets] = useState([]);
  const [aiTicketsLoading, setAiTicketsLoading] = useState(false);
  const [dynamicPricingData, setDynamicPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // AI Review Responder State
  const [reviewForm, setReviewForm] = useState({
    guestName: 'Rajesh K.',
    rating: 5,
    reviewText: 'Wonderful stay at Satyam Residency Rayagada! The rooms were immaculate, AC cooling was great, and the staff was extremely hospitable.',
    tone: 'warm'
  });
  const [generatedReviewReply, setGeneratedReviewReply] = useState('');
  const [generatingReview, setGeneratingReview] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);

  // Date Blocking & Walk-Ins State
  const [blockedRooms, setBlockedRooms] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Manual Date Blocking
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

  const [blockForm, setBlockForm] = useState({
    reason: 'walk-in', // 'walk-in' | 'phone_reservation' | 'maintenance' | 'vip_hold' | 'admin_hold'
    roomType: 'Standard',
    roomId: '',
    checkIn: todayStr,
    checkOut: tomorrowStr,
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guests: 1,
    paymentMethod: 'cash', // 'cash' | 'upi' | 'card' | 'pay_at_desk' | 'na'
    paymentStatus: 'paid', // 'paid' | 'pending' | 'na'
    customAmount: '',
    notes: ''
  });

  const [blockLoading, setBlockLoading] = useState(false);
  const [blockMessage, setBlockMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Revenue & Bookings State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [walkins, setWalkins] = useState([]);
  const [walkinsLoading, setWalkinsLoading] = useState(false);

  const [onlineBookings, setOnlineBookings] = useState([]);
  const [onlineBookingsLoading, setOnlineBookingsLoading] = useState(false);

  const [walkinDate, setWalkinDate] = useState(() => todayStr);

  const [revenueTrend, setRevenueTrend] = useState([]);
  const [revenueTrendLoading, setRevenueTrendLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(7);

  useEffect(() => {
    fetchBlockedDates();
    fetchRoomsList();
    fetchBookings();
    fetchTodayWalkins(walkinDate);
    fetchTodayOnlineBookings(walkinDate);
    fetchRevenueTrend(trendDays);
    fetchAiTickets();
    fetchDynamicPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAiTickets = async () => {
    try {
      setAiTicketsLoading(true);
      const res = await getServiceTickets();
      if (res.success) {
        setAiTickets(res.tickets || []);
      }
    } catch (err) {
      console.warn('Failed to fetch AI tickets:', err);
    } finally {
      setAiTicketsLoading(false);
    }
  };

  const fetchDynamicPricing = async () => {
    try {
      setPricingLoading(true);
      const res = await getDynamicPricing();
      if (res.success) {
        setDynamicPricingData(res);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic pricing:', err);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await updateServiceTicketStatus(ticketId, newStatus);
      fetchAiTickets();
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const handleGenerateReviewReply = async (e) => {
    e.preventDefault();
    setGeneratingReview(true);
    try {
      const res = await generateReviewResponse(reviewForm);
      if (res.success && res.aiResponse) {
        setGeneratedReviewReply(res.aiResponse);
      }
    } catch (err) {
      alert('Failed to generate review reply: ' + err?.message);
    } finally {
      setGeneratingReview(false);
    }
  };

  const handleCopyReviewReply = () => {
    if (generatedReviewReply) {
      navigator.clipboard.writeText(generatedReviewReply);
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 3000);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      setBlockedLoading(true);
      const data = await getBlockedDates();
      if (data.success) {
        setBlockedRooms(data.blocks || []);
      }
    } catch (err) {
      console.error('Failed to fetch blocked dates:', err);
    } finally {
      setBlockedLoading(false);
    }
  };

  const fetchRoomsList = async () => {
    try {
      const data = await getAdminRoomsList();
      if (data.success) {
        setRoomsList(data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms list:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/admin/bookings');
      if (data.success) {
        setBookings(data.bookings || []);
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
        setWalkins(data.walkins || []);
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
        setOnlineBookings(data.bookings || []);
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
        setRevenueTrend(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch revenue trend:', err);
    } finally {
      setRevenueTrendLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBlockForm((prev) => ({
      ...prev,
      [name]: name === 'guests' ? Number(value) : value
    }));
  };

  const handleReasonChange = (reason) => {
    setBlockForm((prev) => ({
      ...prev,
      reason,
      paymentMethod: reason === 'maintenance' || reason === 'vip_hold' ? 'na' : (prev.paymentMethod === 'na' ? 'cash' : prev.paymentMethod),
      paymentStatus: reason === 'maintenance' || reason === 'vip_hold' ? 'na' : 'paid',
      guestName: reason === 'maintenance' ? 'Maintenance / Repair' : (reason === 'vip_hold' ? 'VIP Hold' : prev.guestName)
    }));
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setBlockMessage(null);

    if (!blockForm.checkIn || !blockForm.checkOut) {
      setBlockMessage({ type: 'error', text: 'Please select both Check-In and Check-Out dates.' });
      return;
    }

    if (new Date(blockForm.checkIn) >= new Date(blockForm.checkOut)) {
      setBlockMessage({ type: 'error', text: 'Check-Out date must be strictly after Check-In date.' });
      return;
    }

    setBlockLoading(true);
    try {
      const payload = {
        reason: blockForm.reason,
        roomType: blockForm.roomType,
        roomId: blockForm.roomId || undefined,
        checkIn: blockForm.checkIn,
        checkOut: blockForm.checkOut,
        guestName: blockForm.guestName,
        guestPhone: blockForm.guestPhone,
        guestEmail: blockForm.guestEmail,
        guests: blockForm.guests,
        paymentMethod: blockForm.paymentMethod,
        paymentStatus: blockForm.paymentStatus,
        amount: blockForm.customAmount ? Number(blockForm.customAmount) : undefined,
        notes: blockForm.notes
      };

      const res = await blockRoomDates(payload);
      if (res.success) {
        setBlockMessage({
          type: 'success',
          text: `Dates successfully blocked! Assigned Room: ${res.roomNumber || res.roomId} (${res.roomType}) | Booking Code: ${res.bookingCode}`
        });

        // Reset form to sensible defaults
        setBlockForm((prev) => ({
          ...prev,
          roomId: '',
          guestName: '',
          guestPhone: '',
          guestEmail: '',
          customAmount: '',
          notes: ''
        }));

        // Refresh blocks list and today's walk-ins
        fetchBlockedDates();
        fetchTodayWalkins(walkinDate);
      } else {
        setBlockMessage({ type: 'error', text: res.error || 'Failed to block room dates.' });
      }
    } catch (err) {
      setBlockMessage({ type: 'error', text: err.message || 'An error occurred while blocking dates.' });
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async (bookingId, code, roomInfo) => {
    const confirmRelease = window.confirm(
      `Are you sure you want to release / unblock ${roomInfo || 'this room'} (Code: ${code})?\n\nThis will immediately restore online booking availability.`
    );
    if (!confirmRelease) return;

    setUnblockingId(bookingId);
    try {
      const res = await unblockRoomDate(bookingId);
      if (res.success) {
        setBlockMessage({ type: 'success', text: `Room block (${code}) successfully released and opened for booking!` });
        fetchBlockedDates();
        fetchTodayWalkins(walkinDate);
      } else {
        setBlockMessage({ type: 'error', text: res.error || 'Failed to release room block.' });
      }
    } catch (err) {
      setBlockMessage({ type: 'error', text: err.message || 'Failed to release room block.' });
    } finally {
      setUnblockingId(null);
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

  const getReasonBadge = (source, bookingStatus) => {
    if (source === 'maintenance' || bookingStatus === 'blocked') {
      return <span className="badge-maintenance">🔧 Maintenance</span>;
    }
    if (source === 'phone' || source === 'phone_reservation') {
      return <span className="badge-phone">📞 Phone Reservation</span>;
    }
    if (source === 'vip_hold') {
      return <span className="badge-vip">⭐ VIP Hold</span>;
    }
    if (source === 'walk-in') {
      return <span className="badge-walkin">🚶 Walk-In Guest</span>;
    }
    return <span className="badge-admin">🛡️ Admin Hold</span>;
  };

  // Filtered blocked rooms
  const filteredBlocks = blockedRooms.filter((b) => {
    if (filterType !== 'all') {
      if (filterType === 'maintenance' && b.source !== 'maintenance' && b.booking_status !== 'blocked') return false;
      if (filterType === 'phone' && b.source !== 'phone' && b.source !== 'phone_reservation') return false;
      if (filterType === 'walkin' && b.source !== 'walk-in') return false;
      if (filterType === 'vip' && b.source !== 'vip_hold') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (b.full_name || '').toLowerCase().includes(q);
      const matchPhone = (b.phone || '').toLowerCase().includes(q);
      const matchRoom = (b.room_number || '').toLowerCase().includes(q);
      const matchCode = (b.booking_code || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchRoom || matchCode;
    }
    return true;
  });

  // Available room options filtered by selected room type
  const availableRoomsForType = roomsList.filter((r) => {
    const s = (r.room_type_name || '').toLowerCase();
    const target = blockForm.roomType.toLowerCase();
    return s.includes(target) || target.includes(s);
  });

  // Walk-ins stats
  const totalWalkins = walkins.length;
  const totalAmountTodayWalkins = walkins.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const averageBookingAmountWalkins = totalWalkins > 0 ? totalAmountTodayWalkins / totalWalkins : 0;
  const totalNightsWalkins = walkins.reduce((sum, b) => sum + (parseInt(b.nights, 10) || 0), 0);
  const revenuePerNightWalkins = totalNightsWalkins > 0 ? totalAmountTodayWalkins / totalNightsWalkins : 0;

  // Online bookings stats
  const totalOnline = onlineBookings.length;
  const totalAmountTodayOnline = onlineBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const averageBookingAmountOnline = totalOnline > 0 ? totalAmountTodayOnline / totalOnline : 0;
  const totalNightsOnline = onlineBookings.reduce((sum, b) => sum + (parseInt(b.nights, 10) || 0), 0);
  const revenuePerNightOnline = totalNightsOnline > 0 ? totalAmountTodayOnline / totalNightsOnline : 0;

  // Revenue trend totals for selected period
  const totalWalkinRevenue = revenueTrend.reduce((sum, r) => sum + (r.walkin_revenue || 0), 0);
  const totalOnlineRevenue = revenueTrend.reduce((sum, r) => sum + (r.online_revenue || 0), 0);

  // Plotly chart data
  const dates = revenueTrend.map((r) => r.date);
  const walkinSeries = revenueTrend.map((r) => r.walkin_revenue);
  const onlineSeries = revenueTrend.map((r) => r.online_revenue);

  const layout = {
    margin: { t: 30, b: 40, l: 50, r: 20 },
    height: 260,
    xaxis: {
      title: 'Date',
      tickangle: -30,
      tickfont: { size: 11 }
    },
    yaxis: {
      title: 'Revenue (₹)',
      tickfont: { size: 11 }
    },
    barmode: 'group',
    showlegend: true,
    legend: { x: 0, y: 1 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#ddd' }
  };

  const traces = [
    {
      x: dates,
      y: walkinSeries,
      name: 'Walk‑in',
      type: 'bar',
      marker: { color: '#D4AF37' }
    },
    {
      x: dates,
      y: onlineSeries,
      name: 'Online',
      type: 'bar',
      marker: { color: '#3b82f6' }
    }
  ];

  return (
    <div className="section container premium-container" style={{ padding: '40px 20px', minHeight: '100vh', background: 'var(--background-color)', maxWidth: '960px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <button className="btn-small-secondary" onClick={onBack}>← Back to Website</button>
        <span style={{ fontSize: '13px', color: '#c9a84c', background: 'rgba(201,168,76,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid #c9a84c' }}>
          🔒 Password Protected Admin Portal
        </span>
      </div>

      <h2 className="serif mb-1" style={{ fontSize: '32px' }}>Satyam Residency Control Center</h2>
      <p className="mb-6 gold-text" style={{ fontSize: '15px' }}>
        Live Room Date Blocking, Front Desk Walk-Ins, Revenue Analytics &amp; Double-Booking Protection
      </p>

      {/* Tab Navigation */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'blocking' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocking')}
        >
          🏨 Room Date Blocking &amp; Walk-Ins
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          📊 Revenue &amp; Analytics
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'fraud' ? 'active' : ''}`}
          onClick={() => setActiveTab('fraud')}
        >
          🛡️ AI Fraud &amp; All Bookings
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI Operations &amp; Revenue
        </button>
      </div>

      {/* TAB 1: ROOM DATE BLOCKING & WALK-INS */}
      {activeTab === 'blocking' && (
        <div>
          {/* Notification Banner */}
          {blockMessage && (
            <div
              style={{
                padding: '14px 18px',
                marginBottom: '24px',
                borderRadius: '10px',
                border: `1px solid ${blockMessage.type === 'error' ? '#ff4d4d' : '#4CAF50'}`,
                background: blockMessage.type === 'error' ? 'rgba(255, 77, 77, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                color: blockMessage.type === 'error' ? '#ff6b6b' : '#69db7c',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{blockMessage.text}</span>
              <button
                type="button"
                onClick={() => setBlockMessage(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>
          )}

          {/* Form Card: Block Room Dates */}
          <div className="admin-card mb-6" style={{ border: '1px solid rgba(201, 168, 76, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 className="serif" style={{ margin: 0, fontSize: '22px' }}>Manual Date Blocking &amp; Reservations</h3>
                <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 0 0' }}>
                  Block room dates for walk-in guests, phone bookings, or maintenance to prevent online double-booking.
                </p>
              </div>
            </div>

            {/* Block Type Buttons */}
            <div className="block-type-selector mb-4">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#c9a84c' }}>
                Select Block Reason / Reservation Type:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`block-mode-chip ${blockForm.reason === 'walk-in' ? 'active' : ''}`}
                  onClick={() => handleReasonChange('walk-in')}
                >
                  🚶 Walk-In Guest
                </button>
                <button
                  type="button"
                  className={`block-mode-chip ${blockForm.reason === 'phone_reservation' ? 'active' : ''}`}
                  onClick={() => handleReasonChange('phone_reservation')}
                >
                  📞 Phone Reservation
                </button>
                <button
                  type="button"
                  className={`block-mode-chip ${blockForm.reason === 'maintenance' ? 'active' : ''}`}
                  onClick={() => handleReasonChange('maintenance')}
                >
                  🔧 Room Maintenance / Out of Order
                </button>
                <button
                  type="button"
                  className={`block-mode-chip ${blockForm.reason === 'vip_hold' ? 'active' : ''}`}
                  onClick={() => handleReasonChange('vip_hold')}
                >
                  ⭐ VIP / Staff Hold
                </button>
              </div>
            </div>

            <form onSubmit={handleBlockSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Room Category */}
                <div className="gold-input-group">
                  <label className="gold-label">Room Type *</label>
                  <select
                    name="roomType"
                    className="gold-input"
                    value={blockForm.roomType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Standard" style={{ color: '#000' }}>Standard Room (₹1,499)</option>
                    <option value="Deluxe" style={{ color: '#000' }}>Deluxe Room (₹2,499)</option>
                    <option value="Suite" style={{ color: '#000' }}>Executive Suite (₹4,999)</option>
                  </select>
                </div>

                {/* Specific Room Number (Optional) */}
                <div className="gold-input-group">
                  <label className="gold-label">Specific Room Number (Optional)</label>
                  <select
                    name="roomId"
                    className="gold-input"
                    value={blockForm.roomId}
                    onChange={handleFormChange}
                  >
                    <option value="" style={{ color: '#000' }}>Auto-Assign First Available Room</option>
                    {availableRoomsForType.map((r) => (
                      <option key={r.room_id} value={r.room_id} style={{ color: '#000' }}>
                        Room {r.room_number || r.room_id} (Floor {r.floor || '1'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Check-In Date */}
                <div className="gold-input-group">
                  <label className="gold-label">Check-In Date *</label>
                  <input
                    type="date"
                    className="gold-input"
                    name="checkIn"
                    value={blockForm.checkIn}
                    onChange={handleFormChange}
                    min={todayStr}
                    required
                  />
                </div>

                {/* Check-Out Date */}
                <div className="gold-input-group">
                  <label className="gold-label">Check-Out Date *</label>
                  <input
                    type="date"
                    className="gold-input"
                    name="checkOut"
                    value={blockForm.checkOut}
                    onChange={handleFormChange}
                    min={blockForm.checkIn || todayStr}
                    required
                  />
                </div>
              </div>

              {/* Guest / Contact Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="gold-input-group">
                  <label className="gold-label">
                    {blockForm.reason === 'maintenance' ? 'Staff / Department Name' : 'Guest / Caller Name *'}
                  </label>
                  <input
                    type="text"
                    className="gold-input"
                    name="guestName"
                    value={blockForm.guestName}
                    onChange={handleFormChange}
                    placeholder={blockForm.reason === 'maintenance' ? 'e.g., Maintenance Team' : 'Guest Full Name'}
                    required={blockForm.reason !== 'maintenance' && blockForm.reason !== 'vip_hold'}
                  />
                </div>

                <div className="gold-input-group">
                  <label className="gold-label">
                    {blockForm.reason === 'maintenance' ? 'Internal Phone / Extension' : 'Guest Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    className="gold-input"
                    name="guestPhone"
                    value={blockForm.guestPhone}
                    onChange={handleFormChange}
                    placeholder="e.g. +91 9876543210"
                    required={blockForm.reason !== 'maintenance' && blockForm.reason !== 'vip_hold'}
                  />
                </div>

                {blockForm.reason !== 'maintenance' && (
                  <div className="gold-input-group">
                    <label className="gold-label">Guest Email (Optional)</label>
                    <input
                      type="email"
                      className="gold-input"
                      name="guestEmail"
                      value={blockForm.guestEmail}
                      onChange={handleFormChange}
                      placeholder="guest@example.com"
                    />
                  </div>
                )}

                <div className="gold-input-group">
                  <label className="gold-label">Number of Guests</label>
                  <input
                    type="number"
                    className="gold-input"
                    name="guests"
                    min="1"
                    max="6"
                    value={blockForm.guests}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Payment & Rate Details */}
              {blockForm.reason !== 'maintenance' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="gold-input-group">
                    <label className="gold-label">Payment Mode</label>
                    <select
                      name="paymentMethod"
                      className="gold-input"
                      value={blockForm.paymentMethod}
                      onChange={handleFormChange}
                    >
                      <option value="cash" style={{ color: '#000' }}>💵 Cash at Counter</option>
                      <option value="upi" style={{ color: '#000' }}>📱 UPI / QR Code</option>
                      <option value="card" style={{ color: '#000' }}>💳 Credit/Debit Card (POS)</option>
                      <option value="pay_at_desk" style={{ color: '#000' }}>⏳ Pay on Arrival / Check-In</option>
                      <option value="na" style={{ color: '#000' }}>🆓 Complimentary / VIP</option>
                    </select>
                  </div>

                  <div className="gold-input-group">
                    <label className="gold-label">Payment Status</label>
                    <select
                      name="paymentStatus"
                      className="gold-input"
                      value={blockForm.paymentStatus}
                      onChange={handleFormChange}
                    >
                      <option value="paid" style={{ color: '#000' }}>✅ Collected / Paid</option>
                      <option value="pending" style={{ color: '#000' }}>⏳ Pending / Pay at Desk</option>
                      <option value="na" style={{ color: '#000' }}>N/A (Hold/Complimentary)</option>
                    </select>
                  </div>

                  <div className="gold-input-group">
                    <label className="gold-label">Custom Collected Rate (₹)</label>
                    <input
                      type="number"
                      className="gold-input"
                      name="customAmount"
                      value={blockForm.customAmount}
                      onChange={handleFormChange}
                      placeholder="Leave blank for standard rate"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="gold-input-group mb-4">
                <label className="gold-label">Special Notes / Hold Reason</label>
                <input
                  type="text"
                  className="gold-input"
                  name="notes"
                  value={blockForm.notes}
                  onChange={handleFormChange}
                  placeholder="e.g. Early check-in requested / AC repair scheduled / Phone booking by Mr. Roy"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="gold-button"
                disabled={blockLoading}
                style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {blockLoading ? '🔒 Processing & Blocking Dates...' : '🔒 Block Room Dates Now (Prevent Double-Booking)'}
              </button>
            </form>
          </div>

          {/* Table: Active Blocked Dates & Reservations */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="serif" style={{ margin: 0, fontSize: '22px' }}>Active Blocked Dates &amp; Reservations</h3>
                <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 0 0' }}>
                  Manage all active manual date blocks, phone reservations, and walk-ins. Click &quot;Unblock&quot; to restore online availability.
                </p>
              </div>
              <button
                type="button"
                className="btn-small-secondary"
                onClick={fetchBlockedDates}
                disabled={blockedLoading}
              >
                {blockedLoading ? 'Refreshing…' : '🔄 Refresh List'}
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
              <input
                type="text"
                className="gold-input"
                style={{ maxWidth: '280px', padding: '8px 12px', fontSize: '13px' }}
                placeholder="🔍 Search guest, phone, room, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({blockedRooms.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterType === 'walkin' ? 'active' : ''}`}
                  onClick={() => setFilterType('walkin')}
                >
                  Walk-Ins
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterType === 'phone' ? 'active' : ''}`}
                  onClick={() => setFilterType('phone')}
                >
                  Phone Reservations
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterType === 'maintenance' ? 'active' : ''}`}
                  onClick={() => setFilterType('maintenance')}
                >
                  Maintenance
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterType === 'vip' ? 'active' : ''}`}
                  onClick={() => setFilterType('vip')}
                >
                  VIP Holds
                </button>
              </div>
            </div>

            {blockedLoading ? (
              <p>Loading blocked dates…</p>
            ) : filteredBlocks.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                <p style={{ margin: 0, opacity: 0.8 }}>No active blocked dates matching your criteria.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Type / Reason</th>
                      <th>Guest / Contact</th>
                      <th>Dates</th>
                      <th>Nights</th>
                      <th>Amount &amp; Payment</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlocks.map((b) => (
                      <tr key={b.booking_id}>
                        <td>
                          <strong>Room {b.room_number || 'Auto'}</strong>
                          <div style={{ fontSize: '11px', color: '#c9a84c' }}>{b.room_type_name}</div>
                          <div style={{ fontSize: '10px', opacity: 0.6 }}>{b.booking_code}</div>
                        </td>
                        <td>{getReasonBadge(b.source, b.booking_status)}</td>
                        <td>
                          <strong>{b.full_name}</strong>
                          {b.phone && <div style={{ fontSize: '12px', opacity: 0.8 }}>📞 {b.phone}</div>}
                        </td>
                        <td>
                          <div><strong>In:</strong> {b.check_in}</div>
                          <div><strong>Out:</strong> {b.check_out}</div>
                        </td>
                        <td>{b.nights} {b.nights === 1 ? 'night' : 'nights'}</td>
                        <td>
                          <div>₹{Number(b.total_amount || 0).toLocaleString('en-IN')}</div>
                          <span style={{
                            fontSize: '11px',
                            color: b.payment_status === 'paid' ? '#4CAF50' : '#ffa500'
                          }}>
                            {b.payment_status === 'paid' ? '● Paid' : '● Pay on Arrival'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '160px', fontSize: '12px', opacity: 0.8 }}>
                          {b.special_requests || '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-unblock"
                            onClick={() => handleUnblock(b.booking_id, b.booking_code, `Room ${b.room_number || b.room_type_name}`)}
                            disabled={unblockingId === b.booking_id}
                          >
                            {unblockingId === b.booking_id ? 'Releasing…' : '🔓 Unblock'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & ANALYTICS */}
      {activeTab === 'revenue' && (
        <div>
          {/* Today’s Walk‑ins Section */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="serif" style={{ margin: 0 }}>Today’s Walk‑ins</h3>
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
                  type="button"
                  className="btn-small-secondary"
                  onClick={handleRefreshWalkins}
                  disabled={walkinsLoading || onlineBookingsLoading}
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
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guest Name</th>
                      <th>Phone</th>
                      <th>Check‑in</th>
                      <th>Check‑out</th>
                      <th>Nights</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walkins.map((b) => (
                      <tr key={b.booking_id}>
                        <td>{b.booking_id}</td>
                        <td>{b.full_name}</td>
                        <td>{b.phone}</td>
                        <td>{b.check_in}</td>
                        <td>{b.check_out}</td>
                        <td>{b.nights}</td>
                        <td>₹{b.total_amount}</td>
                        <td>{b.booking_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Today’s Online Bookings Section */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="serif" style={{ margin: 0 }}>Today’s Online Bookings</h3>
              <p style={{ fontSize: '13px', opacity: 0.8 }}>Check‑in date = {walkinDate}</p>
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
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guest Name</th>
                      <th>Phone</th>
                      <th>Check‑in</th>
                      <th>Check‑out</th>
                      <th>Nights</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlineBookings.map((b) => (
                      <tr key={b.booking_id}>
                        <td>{b.booking_id}</td>
                        <td>{b.full_name}</td>
                        <td>{b.phone}</td>
                        <td>{b.check_in}</td>
                        <td>{b.check_out}</td>
                        <td>{b.nights}</td>
                        <td>₹{b.total_amount}</td>
                        <td>{b.booking_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revenue Trend (Last 7/14/30 Days) */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="serif" style={{ margin: 0 }}>Revenue Trend</h3>
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
        </div>
      )}

      {/* TAB 3: ALL BOOKINGS & AI FRAUD ANALYSIS */}
      {activeTab === 'fraud' && (
        <div className="admin-card">
          <h3 className="serif mb-2">All Bookings (AI Fraud Analysis)</h3>
          <p className="mb-4" style={{ fontSize: '14px', opacity: 0.8 }}>
            Latest bookings with automated AI fraud status verification
          </p>

          {loading ? (
            <p>Loading bookings…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {bookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="admin-card"
                  style={{
                    margin: '0',
                    border: booking.fraud_status === 'FLAGGED' ? '1px solid #ff4d4d' : '1px solid var(--border-color)',
                    position: 'relative',
                    background: 'rgba(10,10,10,0.8)'
                  }}
                >
                  <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    {getStatusBadge(booking.fraud_status)}
                  </div>
                  <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>
                    {booking.booking_id} - {booking.full_name}
                  </h3>
                  <p><strong>Phone:</strong> {booking.phone}</p>
                  <p>
                    <strong>Check In:</strong> {booking.check_in} | <strong>Check Out:</strong> {booking.check_out} ({booking.nights} nights)
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{booking.total_amount} | <strong>Status:</strong> {booking.booking_status} | <strong>Source:</strong> {booking.source || 'online'}
                  </p>
                  {booking.fraud_reason && (
                    <div
                      style={{
                        marginTop: '15px',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '8px',
                        borderLeft: booking.fraud_status === 'FLAGGED' ? '4px solid #ff4d4d' : '4px solid #4CAF50'
                      }}
                    >
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
      )}

      {/* TAB 4: AI OPERATIONS & REVENUE MANAGEMENT */}
      {activeTab === 'ai' && (
        <div className="flex-column gap-4">
          {/* Section 1: Live Housekeeping & Service Ticket Dispatch */}
          <div className="admin-card" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid var(--border-color)' }}>
            <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div>
                <h3 className="serif" style={{ fontSize: '20px', margin: 0 }}>
                  🛎️ Autonomous Guest Service &amp; Housekeeping Tickets
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Requests parsed via AI Concierge and dispatched to on-duty staff
                </p>
              </div>
              <button
                type="button"
                className="btn-small-secondary"
                onClick={fetchAiTickets}
                disabled={aiTicketsLoading}
              >
                {aiTicketsLoading ? 'Refreshing...' : '🔄 Refresh Tickets'}
              </button>
            </div>

            {aiTickets.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No active service tickets. All guest requests are currently fulfilled! ✨
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aiTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div className="flex-row gap-2">
                        <strong style={{ color: 'var(--primary-color)', fontSize: '15px' }}>
                          Room {ticket.room_number || '204'}
                        </strong>
                        <span style={{ fontSize: '11px', background: 'rgba(201,168,76,0.15)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '10px' }}>
                          {ticket.department}
                        </span>
                        {ticket.priority === 'urgent' && (
                          <span style={{ fontSize: '11px', background: 'rgba(229,57,53,0.2)', color: '#ff6b6b', padding: '2px 8px', borderRadius: '10px', border: '1px solid #e53935' }}>
                            🚨 Urgent
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#fff' }}>
                        &quot;{ticket.request_text}&quot;
                      </p>
                      <small style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Ticket ID: {ticket.id} • Created: {new Date(ticket.created_at || Date.now()).toLocaleTimeString()}
                      </small>
                    </div>

                    <div className="flex-row gap-2">
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: ticket.status === 'resolved' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                          color: ticket.status === 'resolved' ? '#81c784' : '#ffb74d',
                          border: `1px solid ${ticket.status === 'resolved' ? '#81c784' : '#ffb74d'}`
                        }}
                      >
                        {ticket.status === 'resolved' ? '✓ Resolved' : '⚡ ' + ticket.status}
                      </span>
                      {ticket.status !== 'resolved' && (
                        <button
                          type="button"
                          className="btn-small-primary"
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Dynamic Pricing & Surge Intelligence */}
          <div className="admin-card" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid var(--border-color)' }}>
            <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div>
                <h3 className="serif" style={{ fontSize: '20px', margin: 0 }}>
                  📈 Dynamic Pricing &amp; Occupancy Surge Engine
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Automated tariff optimization based on inventory threshold &amp; local demand
                </p>
              </div>
              <div className="flex-row gap-2">
                <button
                  type="button"
                  className="btn-small-secondary"
                  onClick={fetchDynamicPricing}
                  disabled={pricingLoading}
                >
                  {pricingLoading ? 'Calculating...' : '🔄 Recalculate'}
                </button>
                <span style={{ fontSize: '12px', background: 'rgba(201,168,76,0.15)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--primary-color)' }}>
                  {dynamicPricingData?.badgeText || '⚡ Active Engine'}
                </span>
              </div>
            </div>

            {dynamicPricingData ? (
              <div>
                {/* Live Occupancy Meter */}
                <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                  <div className="flex-row justify-between mb-1" style={{ fontSize: '13px' }}>
                    <span>Current Hotel Occupancy: <strong>{dynamicPricingData.occupancyRate}%</strong></span>
                    <span>Surge Multiplier: <strong style={{ color: 'var(--primary-color)' }}>{dynamicPricingData.surgeMultiplier}x</strong></span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, dynamicPricingData.occupancyRate)}%`,
                        height: '100%',
                        background: dynamicPricingData.occupancyRate > 80 ? '#e53935' : (dynamicPricingData.occupancyRate > 60 ? 'var(--primary-color)' : '#4caf50'),
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Dynamic Room Rates Table */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {dynamicPricingData.roomRates?.map((r) => (
                    <div
                      key={r.room_type_id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <h4 style={{ fontSize: '14px', color: 'var(--primary-color)', marginBottom: '4px' }}>
                        {r.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: r.dynamicPrice !== r.basePrice ? 'line-through' : 'none' }}>
                        Base: ₹{r.basePrice}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '4px 0' }}>
                        ₹{r.dynamicPrice} <small style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>/ nt</small>
                      </div>
                      <span style={{ fontSize: '11px', color: '#81c784' }}>
                        {r.discount ? `🏷️ ${r.discount}` : '⚡ Live AI Adjusted'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading dynamic pricing calculations...</p>
            )}
          </div>

          {/* Section 3: AI Review Responder & Reputation Management */}
          <div className="admin-card" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid var(--border-color)' }}>
            <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
              <div>
                <h3 className="serif" style={{ fontSize: '20px', margin: 0 }}>
                  ✍️ AI Review Responder &amp; Brand Tone Generator
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Generate empathetic, brand-aligned 1-click management responses to guest reviews
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateReviewReply} className="flex-column gap-3">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    Guest Reviewer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.guestName}
                    onChange={(e) => setReviewForm({ ...reviewForm, guestName: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    Rating
                  </label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '13px', background: '#1a1a1a', color: '#fff' }}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    Tone of Response
                  </label>
                  <select
                    value={reviewForm.tone}
                    onChange={(e) => setReviewForm({ ...reviewForm, tone: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '13px', background: '#1a1a1a', color: '#fff' }}
                  >
                    <option value="warm">Warm &amp; Gracious</option>
                    <option value="executive">Executive &amp; Crisp</option>
                    <option value="apologetic">Apologetic &amp; Solution</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Guest Review Text (Paste from Google Maps / MakeMyTrip / Booking.com)
                </label>
                <textarea
                  rows={2}
                  required
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={generatingReview}
                style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
              >
                {generatingReview ? '⚡ Generating Response...' : '✨ Generate AI Management Response'}
              </button>
            </form>

            {generatedReviewReply && (
              <div style={{ marginTop: '16px', background: 'rgba(201, 168, 76, 0.08)', border: '1px solid var(--primary-color)', borderRadius: '10px', padding: '14px' }}>
                <div className="flex-row justify-between mb-2">
                  <strong style={{ color: 'var(--primary-color)', fontSize: '13px' }}>
                    AI-Crafted Official Response:
                  </strong>
                  <button
                    type="button"
                    className="btn-small-primary"
                    onClick={handleCopyReviewReply}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {copiedReply ? '✓ Copied!' : '📋 Copy to Clipboard'}
                  </button>
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.5' }}>
                  {generatedReviewReply}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}