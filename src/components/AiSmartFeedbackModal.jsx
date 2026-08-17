import React, { useState } from 'react';
import { submitGuestFeedback } from '../api';

export function AiSmartFeedbackModal({ onClose, initialBookingCode = '' }) {
  const [rating, setRating] = useState(5);
  const [guestName, setGuestName] = useState('');
  const [bookingCode, setBookingCode] = useState(initialBookingCode || '');
  const [category, setCategory] = useState('Room Cleanliness & Hospitality');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await submitGuestFeedback({
        bookingCode: bookingCode.trim() || 'SR-GUEST',
        guestName: guestName.trim() || 'Guest',
        rating,
        category,
        comments
      });

      if (res.success) {
        setResult(res);
      } else {
        alert(res.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      alert(err?.message || 'Error sending feedback.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    if (result?.googleReviewPrompt) {
      navigator.clipboard.writeText(result.googleReviewPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }}>
        {/* Header */}
        <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div className="flex-row gap-2">
            <span style={{ fontSize: '24px' }}>🌟</span>
            <div>
              <h2 className="serif" style={{ fontSize: '22px', margin: 0 }}>Guest Stay Experience</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Smart AI Feedback &amp; Review Booster
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

        {!result ? (
          <form onSubmit={handleSubmit} className="flex-column gap-3">
            {/* Star Rating Selector */}
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                How was your stay at Satyam Residency?
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '32px',
                      cursor: 'pointer',
                      color: star <= rating ? '#ffc107' : 'rgba(255,255,255,0.2)',
                      transition: 'transform 0.1s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: rating >= 4 ? '#81c784' : (rating === 3 ? '#ffb74d' : '#e57373'), marginTop: '4px', fontWeight: 'bold' }}>
                {rating === 5 && '🌟 Exceptional Experience'}
                {rating === 4 && '👍 Great & Comfortable Stay'}
                {rating === 3 && '😐 Average Experience'}
                {rating <= 2 && '⚠️ Needs Attention / Improvements'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Sneha Mohanty"
                  className="input-field"
                  style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Booking ID (Optional)
                </label>
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SR-8902"
                  className="input-field"
                  style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                Primary Aspect
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '13px', background: '#1a1a1a', color: '#fff' }}
              >
                <option value="Room Cleanliness & Hospitality">Room Cleanliness &amp; Bed Comfort</option>
                <option value="Staff Courtesy & Service">Staff Courtesy &amp; Quick Service</option>
                <option value="Food & Breakfast">Food &amp; Dining Quality</option>
                <option value="Location & Temple Proximity">Location &amp; Proximity to Gajapati Junction</option>
                <option value="AC & Hot Water Amenities">AC, Geyser &amp; Wi-Fi Amenities</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                Comments / Suggestions
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us what you loved or how we can improve..."
                className="input-field"
                style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold' }}
            >
              {loading ? 'Submitting...' : '✨ Submit Guest Review'}
            </button>
          </form>
        ) : (
          <div className="flex-column gap-3">
            {rating >= 4 ? (
              <div style={{ background: 'rgba(76, 175, 80, 0.12)', border: '1px solid #81c784', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '16px', color: '#a5d6a7', marginBottom: '6px' }}>
                  🎉 Thank you for the glowing {rating}-Star rating!
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Our AI crafted this ready-to-post review snippet for you. Tap below to copy and share it on Google Maps:
                </p>

                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#fff', fontStyle: 'italic', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  &quot;{result.googleReviewPrompt}&quot;
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCopyPrompt}
                    style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                  >
                    {copied ? '✓ Copied to Clipboard!' : '📋 Copy Review Text'}
                  </button>
                  <a
                    href="https://maps.google.com/?q=Satyam+Residency+Rayagada"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '13px', textAlign: 'center', textDecoration: 'none' }}
                  >
                    📍 Open Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(255, 152, 0, 0.12)', border: '1px solid #ffb74d', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '16px', color: '#ffb74d', marginBottom: '6px' }}>
                  🤝 Direct Management Escalation
                </h3>
                <p style={{ fontSize: '13px', color: '#fff', marginBottom: '10px' }}>
                  Thank you for your candid feedback. Your comments have been privately routed to the General Manager of Satyam Residency for immediate review and corrective action.
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Our Guest Relations Manager will contact you if requested. You can also reach our manager directly at: <strong>+91 8984938388</strong>.
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ width: '100%', padding: '10px' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
