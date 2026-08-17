import React, { useState, useEffect, useRef } from 'react';
import { parseBookingIntent } from '../api';
import { config } from '../config';

export function AiBookingAgent({ onSelectBooking }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const samplePrompts = [
    {
      label: '🛏️ Weekend Deluxe + Late Check-in',
      query: 'I need an AC Deluxe room for 2 nights starting this Friday, with late check-in around 11 PM.'
    },
    {
      label: '👑 Executive Suite for 3 Guests',
      query: 'Executive suite for 3 adults starting tomorrow for 1 night with complimentary breakfast.'
    },
    {
      label: '🛕 Majhighariani Temple Family Stay',
      query: 'Standard room for family with extra mattress for 2 nights next week.'
    },
    {
      label: '🚗 Business Trip + Station Pickup',
      query: 'Deluxe AC room for 1 person starting this Saturday for 2 days with station pickup.'
    }
  ];

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const langMap = {
        en: 'en-IN',
        te: 'te-IN',
        hi: 'hi-IN',
        or: 'hi-IN' // fallback if odia is unsupported in browser speech engine
      };
      recognition.lang = langMap[language] || 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        handleParse(transcript);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        const langMap = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', or: 'hi-IN' };
        recognitionRef.current.lang = langMap[language] || 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
        setError('');
      } catch (err) {
        console.warn('Mic start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleParse = async (textToParse) => {
    const message = textToParse || query;
    if (!message.trim()) {
      setError('Please enter or speak your booking request.');
      return;
    }

    setLoading(true);
    setError('');
    setParsedResult(null);

    try {
      const res = await parseBookingIntent(message);
      if (res.success && res.intent) {
        setParsedResult(res.intent);
      } else {
        setError(res.error || 'Could not parse booking request. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'AI assistant is currently offline. Please try manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToBooking = () => {
    if (!parsedResult) return;
    
    // Find matching room configuration
    let targetRoom = config.roomTypes[0];
    const typeLower = (parsedResult.roomTypeName || '').toLowerCase();
    if (typeLower.includes('suite') || typeLower.includes('executive')) {
      targetRoom = config.roomTypes.find(r => r.id === 'suite') || config.roomTypes[2];
    } else if (typeLower.includes('deluxe')) {
      targetRoom = config.roomTypes.find(r => r.id === 'deluxe') || config.roomTypes[1];
    }

    onSelectBooking({
      room: targetRoom,
      checkIn: parsedResult.checkIn,
      checkOut: parsedResult.checkOut,
      guests: parsedResult.guests || 2,
      specialRequests: parsedResult.specialRequests || ''
    });

    setIsOpen(false);
  };

  return (
    <>
      {/* Floating AI Booking Assistant Launcher */}
      <div
        className="ai-floating-badge"
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        title="Open AI Natural Language Booking Agent"
      >
        <div className="ai-badge-pulse" />
        <span className="ai-badge-icon">✨</span>
        <div className="ai-badge-text">
          <strong>AI Booking Assistant</strong>
          <small>Speak or type to book instantly</small>
        </div>
      </div>

      {/* AI Booking Modal */}
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content ai-agent-modal" style={{ maxWidth: '580px', padding: '24px' }}>
            <div className="flex-row justify-between mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div className="flex-row gap-2">
                <span style={{ fontSize: '24px' }}>✨</span>
                <div>
                  <h2 className="serif" style={{ fontSize: '22px', margin: 0 }}>Satyam AI Booking Agent</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Powered by Cloudflare Edge AI • Natural Language &amp; Voice
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', color: '#fff', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex-row justify-between mb-3" style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--primary-color)' }}>Select Language:</span>
              <div className="flex-row gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'te', label: 'తెలుగు' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'or', label: 'ଓଡ଼ିଆ' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      border: language === lang.code ? '1px solid var(--primary-color)' : '1px solid transparent',
                      background: language === lang.code ? 'var(--primary-color)' : 'transparent',
                      color: language === lang.code ? '#000' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: language === lang.code ? '600' : 'normal'
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form with Voice Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleParse();
              }}
              className="flex-column gap-2 mb-3"
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    language === 'te'
                      ? "ఉదా: శుక్రవారం నుండి 2 రాత్రులకు AC డబుల్ రూమ్ కావాలి..."
                      : language === 'hi'
                      ? "उदा: शुक्रवार से 2 रातों के लिए AC डबल रूम चाहिए..."
                      : language === 'or'
                      ? "ଉଦା: ଶୁକ୍ରବାର ଠାରୁ ୨ ରାତି ପାଇଁ AC ଡବଲ୍ ରୁମ୍ ଦରକାର..."
                      : "e.g., AC room for 2 nights starting this Friday with extra bed..."
                  }
                  className="input-field"
                  style={{
                    width: '100%',
                    paddingRight: '48px',
                    fontSize: '14px',
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'var(--border-color)',
                    color: '#fff'
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Listening... Click to stop" : "Speak your query"}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: isListening ? '#e53935' : 'rgba(201, 168, 76, 0.2)',
                    border: '1px solid var(--primary-color)',
                    color: isListening ? '#fff' : 'var(--primary-color)',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    animation: isListening ? 'pulse-mic 1s infinite' : 'none'
                  }}
                >
                  {isListening ? '⏹️' : '🎙️'}
                </button>
              </div>

              {isListening && (
                <div style={{ fontSize: '12px', color: '#ffb74d', textAlign: 'center' }}>
                  🎙️ Listening in {language.toUpperCase()}... Please speak now.
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !query.trim()}
                style={{ padding: '10px 16px', fontSize: '14px', marginTop: '4px' }}
              >
                {loading ? '⚡ Extracting Parameters...' : '✨ Find & Configure Room'}
              </button>
            </form>

            {/* Quick Sample Prompts */}
            <div className="mb-3">
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                💡 Or try these one-click examples:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p.query);
                      handleParse(p.query);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      padding: '5px 10px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(229, 57, 53, 0.15)', border: '1px solid #e53935', borderRadius: '8px', color: '#ffcdd2', fontSize: '13px', marginBottom: '12px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Parsed Result & 1-Click Checkout */}
            {parsedResult && (
              <div
                style={{
                  background: 'rgba(201, 168, 76, 0.08)',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '10px'
                }}
              >
                <div className="flex-row justify-between mb-2">
                  <strong style={{ color: 'var(--primary-color)', fontSize: '15px' }}>
                    🎯 Extracted Stay Configuration
                  </strong>
                  <span style={{ fontSize: '11px', background: 'rgba(76, 175, 80, 0.2)', color: '#81c784', padding: '2px 8px', borderRadius: '10px', border: '1px solid #81c784' }}>
                    ✓ Available
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Room Type:</span>
                    <div><strong>{parsedResult.roomTypeName}</strong></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Stay Duration:</span>
                    <div><strong>{parsedResult.nights} Night{parsedResult.nights > 1 ? 's' : ''}</strong></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Check-in:</span>
                    <div><strong>{parsedResult.checkIn}</strong></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Check-out:</span>
                    <div><strong>{parsedResult.checkOut}</strong></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Guests:</span>
                    <div><strong>{parsedResult.guests} Guest(s)</strong></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Est. Total:</span>
                    <div style={{ color: 'var(--primary-color)' }}>
                      <strong>₹{parsedResult.financials?.totalAmount || 1499} (incl. taxes)</strong>
                    </div>
                  </div>
                </div>

                {parsedResult.specialRequests && (
                  <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--primary-color)' }}>Special Requests:</span> {parsedResult.specialRequests}
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyToBooking}
                  style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold' }}
                >
                  🚀 Proceed with This Booking (1-Click)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
