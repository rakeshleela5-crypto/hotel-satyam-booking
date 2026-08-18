import React, { useState } from 'react';
import { submitGuestFeedback } from '../api';

export function AiSmartFeedbackModal({ onClose, initialBookingCode = '' }) {
  const [rating, setRating] = useState(5);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bookingCode, setBookingCode] = useState(initialBookingCode || '');
  const [category, setCategory] = useState('Room Cleanliness & Hospitality');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const combinedComments = [
        selectedTags.length ? `[Tags: ${selectedTags.join(', ')}]` : '',
        comments
      ].filter(Boolean).join(' ');

      const res = await submitGuestFeedback({
        bookingCode: bookingCode.trim() || 'SR-GUEST',
        guestName: guestName.trim() || 'Guest',
        guestPhone: guestPhone.trim() || '+91 8984938388',
        rating,
        category,
        comments: combinedComments
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

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '540px', padding: '24px' }}>
        {/* Header */}
        <div className="flex-row justify-between mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div className="flex-row gap-2">
            <span style={{ fontSize: '24px' }}>🌟</span>
            <div>
              <h2 className="serif" style={{ fontSize: '22px', margin: 0 }}>Guest Stay Experience</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Smart AI Feedback &amp; Reputation Guard (T-2h Pre-Checkout)
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
                How was your stay at Satyam Residency, Rayagada?
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
                      fontSize: '34px',
                      cursor: 'pointer',
                      color: star <= rating ? '#ffc107' : 'rgba(255,255,255,0.2)',
                      transform: star <= rating ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: rating >= 4 ? '#81c784' : (rating === 3 ? '#ffb74d' : '#e57373'), marginTop: '6px', fontWeight: 'bold' }}>
                {rating === 5 && '🌟 Exceptional Experience (5/5)'}
                {rating === 4 && '👍 Great & Comfortable Stay (4/5)'}
                {rating === 3 && '😐 Average Experience (3/5)'}
                {rating <= 2 && '⚠️ Needs Attention / Immediate Resolution (1-2/5)'}
              </div>
            </div>

            {/* Quick Positive Tags for 4-5 Stars */}
            {rating >= 4 && (
              <div style={{ background: 'rgba(76, 175, 80, 0.06)', border: '1px solid rgba(76, 175, 80, 0.2)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#81c784', fontWeight: 'bold', marginBottom: '6px' }}>
                  ✨ Tap what you loved the most:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Clean & Spotless Rooms',
                    'Near Gajapati Junction',
                    'Majhighariani Temple Proximity',
                    'Super Fast Wi-Fi',
                    'Delicious Odia Breakfast',
                    'Courteous Staff'
                  ].map((tag, idx) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          background: isSelected ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.04)',
                          border: isSelected ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)',
                          color: isSelected ? '#fff' : '#ccc',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  Your Name *
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
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
                Comments / Feedback
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={rating >= 4 ? "Tell others about your great stay experience..." : "Please describe the issue so our manager can immediately rectify it..."}
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
              {loading ? 'Processing Feedback...' : '✨ Submit Stay Review'}
            </button>
          </form>
        ) : (
          <div className="flex-column gap-3">
            {result.isPositive ? (
              /* 4-5 Stars: Google Review Booster */
              <div style={{ background: 'rgba(76, 175, 80, 0.12)', border: '1px solid #81c784', borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '16px', color: '#a5d6a7', marginBottom: '6px' }}>
                  🎉 Thank you for the wonderful {rating}-Star rating!
                </h3>
                <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '12px' }}>
                  Our AI generated this SEO-optimized review snippet for you. Tap below to copy and share it on Google Maps:
                </p>

                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#fff', fontStyle: 'italic', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                    href={result.googleBusinessProfileUrl || 'https://maps.google.com/?q=Satyam+Residency+Rayagada'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px', fontSize: '13px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    📍 Open Google Maps
                  </a>
                </div>
              </div>
            ) : (
              /* 1-3 Stars: Negative Review Interception & GM Hotline */
              <div style={{ background: 'rgba(255, 152, 0, 0.12)', border: '1px solid #ffb74d', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🛡️</span>
                  <h3 style={{ fontSize: '16px', color: '#ffb74d', margin: 0 }}>
                    Negative Review Intercepted &amp; Escalated
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#fff', marginBottom: '12px', lineHeight: 1.4 }}>
                  We are sincerely sorry that your stay fell short of expectations. This feedback has been <strong>held privately inside our management system</strong> and immediately dispatched to our General Manager and Duty Manager for rapid service recovery.
                </p>

                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.3)', marginBottom: '14px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '4px' }}>
                    🎁 Service Recovery Compensation:
                  </div>
                  <div>• Apology Token: <strong>{result.apologyToken}</strong></div>
                  <div>• Perk: <strong>{result.discountVoucher}</strong></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href={result.gmDirectWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', textAlign: 'center', padding: '10px', fontSize: '13px' }}
                  >
                    💬 Connect Directly with General Manager on WhatsApp
                  </a>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
