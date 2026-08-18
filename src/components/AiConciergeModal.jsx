import React, { useState } from 'react';
import { conciergeChat, dispatchServiceRequest, generateItinerary } from '../api';
import { config } from '../config';

export function AiConciergeModal({ onClose, defaultTab = 'chat' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'chat' | 'service' | 'tour'
  
  // Tab 1: Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Namaste! I am your 24/7 Satyam AI Concierge. Ask me anything about Wi-Fi passwords, breakfast timings, room amenities, or Maa Majhighariani Temple darshan."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLanguage, setChatLanguage] = useState('en');

  // Tab 2: Service Request State
  const [roomNumber, setRoomNumber] = useState('204');
  const [serviceText, setServiceText] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [activeTickets, setActiveTickets] = useState([]);
  const [serviceMessage, setServiceMessage] = useState(null);

  // Tab 3: AI Tour Generator State
  const [tourPurpose, setTourPurpose] = useState('pilgrimage');
  const [tourDuration, setTourDuration] = useState('1_day');
  const [tourLoading, setTourLoading] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  // Handle Chat Send
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await conciergeChat({
        query: userMsg,
        language: chatLanguage,
        roomNumber
      });

      if (res.success && res.reply) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: res.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: "I'm having trouble retrieving that right now. Please call Front Desk at +91 8984938388." }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: "Front desk staff is available 24/7. Call: " + config.hotel.receptionPhone }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Service Request
  const handleDispatchService = async (e) => {
    e.preventDefault();
    if (!serviceText.trim()) return;

    setServiceLoading(true);
    setServiceMessage(null);

    try {
      const res = await dispatchServiceRequest({
        requestText: serviceText,
        roomNumber: roomNumber || '204',
        guestName: 'Guest'
      });

      if (res.success) {
        setServiceMessage({
          type: 'success',
          text: res.message
        });

        const newTickets = (res.tickets || []).map(t => ({
          id: t.id,
          room: t.room_number || roomNumber,
          department: t.department,
          text: t.request_text,
          priority: t.priority,
          eta: t.etaMinutes,
          assignedTo: t.assigned_to,
          status: 'Dispatched to Staff',
          whatsappUrl: res.whatsappDispatchUrl
        }));

        if (newTickets.length > 0) {
          setActiveTickets((prev) => [...newTickets, ...prev]);
        } else {
          setActiveTickets((prev) => [
            {
              id: res.ticketId,
              room: roomNumber,
              department: res.department,
              text: serviceText,
              priority: res.priority,
              eta: res.eta,
              status: 'Dispatched to Staff'
            },
            ...prev
          ]);
        }
        setServiceText('');
      } else {
        setServiceMessage({
          type: 'error',
          text: res.error || 'Failed to dispatch request.'
        });
      }
    } catch {
      setServiceMessage({
        type: 'error',
        text: 'Error connecting to Staff Dispatch system.'
      });
    } finally {
      setServiceLoading(false);
    }
  };

  // Handle Tour Generator
  const handleGenerateTour = async () => {
    setTourLoading(true);
    try {
      const res = await generateItinerary({
        purpose: tourPurpose,
        duration: tourDuration
      });

      if (res.success && res.itinerary) {
        setGeneratedItinerary(res.itinerary);
      }
    } catch (err) {
      console.warn('Tour generator error:', err);
    } finally {
      setTourLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        {/* Header */}
        <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div className="flex-row gap-2">
            <span style={{ fontSize: '24px' }}>🛎️</span>
            <div>
              <h2 className="serif" style={{ fontSize: '22px', margin: 0 }}>Satyam 24/7 AI Concierge</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Instant FAQs • Autonomous Service Dispatch • Rayagada Tours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', color: '#fff', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex-row gap-2 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            💬 24/7 AI Chat &amp; FAQs
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            🛎️ Room Service &amp; Help
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'tour' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('tour');
              if (!generatedItinerary) handleGenerateTour();
            }}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            🗺️ AI Rayagada Tour
          </button>
        </div>

        {/* TAB 1: 24/7 AI Chat & FAQs */}
        {activeTab === 'chat' && (
          <div className="flex-column" style={{ flex: 1, overflow: 'hidden' }}>
            {/* Quick Language Toggle */}
            <div className="flex-row justify-between mb-2" style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary-color)' }}>Language:</span>
              <div className="flex-row gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'te', label: 'తెలుగు' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'or', label: 'ଓଡ଼ିଆ' }
                ].map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setChatLanguage(l.code)}
                    style={{
                      background: chatLanguage === l.code ? 'var(--primary-color)' : 'transparent',
                      color: chatLanguage === l.code ? '#000' : 'var(--text-secondary)',
                      border: 'none',
                      padding: '2px 6px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Message Thread */}
            <div
              style={{
                flex: 1,
                minHeight: '220px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    background: msg.sender === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                    color: msg.sender === 'user' ? '#000' : '#fff',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: 'var(--primary-color)', fontStyle: 'italic' }}>
                  AI Concierge is typing...
                </div>
              )}
            </div>

            {/* Suggested FAQ Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
              {[
                '📶 Wi-Fi Password?',
                '🍳 Breakfast Timings?',
                '🛕 Majhighariani Temple distance?',
                '🚗 Taxi to Railway Station?',
                '🕒 Check-out Policy?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatInput(chip);
                  }}
                  style={{
                    whiteSpace: 'nowrap',
                    background: 'rgba(201, 168, 76, 0.1)',
                    border: '1px solid rgba(201, 168, 76, 0.3)',
                    color: 'var(--primary-color)',
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Wi-Fi, food, temples, checkout..."
                className="input-field"
                style={{ flex: 1, fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={chatLoading || !chatInput.trim()}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Room Service & Housekeeping Auto-Dispatch */}
        {activeTab === 'service' && (
          <div className="flex-column gap-3">
            <div style={{ background: 'rgba(201, 168, 76, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(201, 168, 76, 0.2)', fontSize: '12px' }}>
              ⚡ <strong>Instant Staff Dispatch:</strong> Describe any requirement (water bottles, AC remote, towels, hot tea) and our AI dispatches it directly to the on-duty team.
            </div>

            {serviceMessage && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: serviceMessage.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(229, 57, 53, 0.15)',
                  border: serviceMessage.type === 'success' ? '1px solid #81c784' : '1px solid #e53935',
                  color: serviceMessage.type === 'success' ? '#a5d6a7' : '#ffcdd2'
                }}
              >
                {serviceMessage.text}
              </div>
            )}

            <form onSubmit={handleDispatchService} className="flex-column gap-2">
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    Room No.
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 204"
                    className="input-field"
                    style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    Request Details
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceText}
                    onChange={(e) => setServiceText(e.target.value)}
                    placeholder="e.g., Send 2 extra water bottles and fresh towels"
                    className="input-field"
                    style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Sample Service Quick Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
                {[
                  '💧 2 Packaged Water Bottles',
                  '❄️ AC Remote / Cooling Check',
                  '🧼 Fresh Towels & Dental Kit',
                  '☕ Hot Masala Tea (2 Cups)',
                  '🛏️ Extra Blanket'
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setServiceText(item)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={serviceLoading || !serviceText.trim()}
                style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold' }}
              >
                {serviceLoading ? '⚡ Dispatching to Staff...' : '🚀 Dispatch Request (Instant Staff Alert)'}
              </button>
            </form>

            {/* Active Tickets List */}
            {activeTickets.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--primary-color)', marginBottom: '6px' }}>
                  Live Active Service Tickets:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {activeTickets.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong>Room {t.room}</strong>: {t.text}
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          Dept: {t.department} • ETA: {t.eta}
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', background: 'rgba(76, 175, 80, 0.2)', color: '#81c784', padding: '2px 6px', borderRadius: '8px', border: '1px solid #81c784' }}>
                        ⚡ {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Personalized AI Rayagada Tour Planner */}
        {activeTab === 'tour' && (
          <div className="flex-column gap-2" style={{ overflowY: 'auto', maxHeight: '360px', paddingRight: '4px' }}>
            <div className="flex-row gap-2" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Trip Focus:
                </label>
                <select
                  value={tourPurpose}
                  onChange={(e) => setTourPurpose(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', background: '#1a1a1a', color: '#fff', padding: '6px' }}
                >
                  <option value="pilgrimage">🛕 Pilgrimage (Majhighariani Temple)</option>
                  <option value="nature">🌿 Nature &amp; Waterfalls (Hatipathar)</option>
                  <option value="business">💼 Executive Business &amp; Transit</option>
                </select>
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Duration:
                </label>
                <select
                  value={tourDuration}
                  onChange={(e) => setTourDuration(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '12px', background: '#1a1a1a', color: '#fff', padding: '6px' }}
                >
                  <option value="half_day">Half Day (4 hrs)</option>
                  <option value="1_day">1 Full Day</option>
                  <option value="2_days">2 Days</option>
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateTour}
                disabled={tourLoading}
                style={{ alignSelf: 'flex-end', padding: '8px 12px', fontSize: '12px' }}
              >
                {tourLoading ? 'Generating...' : '✨ Generate'}
              </button>
            </div>

            {/* Generated Tour Itinerary */}
            {generatedItinerary && (
              <div style={{ background: 'rgba(201, 168, 76, 0.05)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', marginBottom: '4px' }}>
                  {generatedItinerary.title}
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Best Season: {generatedItinerary.bestTimeToVisit}
                </p>

                {generatedItinerary.days?.map((d, dIdx) => (
                  <div key={dIdx} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {d.schedule.map((item, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            borderLeft: '3px solid var(--primary-color)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-color)', fontSize: '11px', fontWeight: 'bold' }}>
                            <span>{item.time}</span>
                            <span>{item.transport}</span>
                          </div>
                          <div style={{ color: '#fff', marginTop: '2px' }}>{item.activity}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>📍 {item.location}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', marginTop: '8px', fontSize: '11px' }}>
                  <strong style={{ color: 'var(--primary-color)' }}>💡 Local Rayagada Tips:</strong>
                  <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                    {generatedItinerary.travelTips?.map((tip, tIdx) => (
                      <li key={tIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
