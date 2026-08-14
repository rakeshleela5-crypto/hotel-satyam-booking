import React, { useState } from 'react';
import { config } from '../config';
import { signupUser } from '../api';

export function SignupModal({ onComplete, onOpenLegal }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!consent) {
      setError('Please accept the Privacy Policy and Terms & Conditions to continue.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await signupUser(formData);
      // Save user details and consent timestamp to localStorage
      localStorage.setItem('satyam_user', JSON.stringify({ ...formData, userId: res.userId }));
      localStorage.setItem('satyam_consent_timestamp', new Date().toISOString());
      onComplete({ ...formData, userId: res.userId });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="serif text-center mb-4">Welcome to {config.hotel.name}</h2>
        <p className="text-center mb-6" style={{ fontSize: '14px' }}>
          Please enter your details to continue to our booking application.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              name="name"
              className="form-input" 
              placeholder="e.g. A. Sharma"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              name="email"
              className="form-input" 
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              className="form-input" 
              placeholder="+91 00000 00000"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* DPDP Act 2023 – Consent Checkbox */}
          <div className="consent-group">
            <input
              type="checkbox"
              id="dpdp-consent"
              className="consent-checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setError(''); }}
            />
            <label htmlFor="dpdp-consent" className="consent-label">
              I agree to the{' '}
              <button type="button" className="consent-link" onClick={() => onOpenLegal && onOpenLegal('privacy')}>
                Privacy Policy
              </button>{' '}
              and{' '}
              <button type="button" className="consent-link" onClick={() => onOpenLegal && onOpenLegal('terms')}>
                Terms & Conditions
              </button>
              . I consent to the collection and processing of my personal data as described therein, in accordance with the Digital Personal Data Protection Act, 2023.
            </label>
          </div>

          {error && <div style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '24px' }} disabled={loading}>
            {loading ? <div className="spinner"></div> : null}
            {loading ? 'Saving...' : 'Enter App'}
          </button>
        </form>
      </div>
    </div>
  );
}
