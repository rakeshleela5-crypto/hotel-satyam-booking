import React, { useState } from 'react';
import { config } from '../config';

export function SignupModal({
  onComplete,
  onOpenLegal
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!name || !email || !phone) {
      setError('Please complete all fields.');
      return;
    }

    if (!consent) {
      setError(
        'Please accept the Privacy Policy and Terms & Conditions to continue.'
      );
      return;
    }

    setLoading(true);

    try {
      const user = {
        userId: `local-${ Date.now() }`,
    name,
      email,
      phone,
      consentTimestamp: new Date().toISOString()
  };

  localStorage.setItem(
    'satyam_user',
    JSON.stringify(user)
  );

  localStorage.setItem(
    'satyam_consent_timestamp',
    user.consentTimestamp
  );

  onComplete(user);
} catch (submitError) {
  console.error('Could not save user details:', submitError);
  setError('Could not save your details. Please try again.');
} finally {
  setLoading(false);
}
  };

return (
  <div
    className="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="signup-title"
  >
    <div className="modal-content">
      <h2
        id="signup-title"
        className="serif text-center mb-4"
      >
        Welcome to {config.hotel.name}
      </h2>

      <p
        className="text-center mb-6"
        style={{ fontSize: '14px' }}
      >
        Please enter your details to continue to our
        booking application.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label
            className="form-label"
            htmlFor="signup-name"
          >
            Full Name
          </label>

          <input
            id="signup-name"
            type="text"
            name="name"
            className="form-input"
            placeholder="e.g. A. Sharma"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label
            className="form-label"
            htmlFor="signup-email"
          >
            Email Address
          </label>

          <input
            id="signup-email"
            type="email"
            name="email"
            className="form-input"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label
            className="form-label"
            htmlFor="signup-phone"
          >
            Phone Number
          </label>

          <input
            id="signup-phone"
            type="tel"
            name="phone"
            className="form-input"
            placeholder="+91 00000 00000"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
            required
            disabled={loading}
          />
        </div>
        <div className="consent-group">
          <input
            type="checkbox"
            id="dpdp-consent"
            className="consent-checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);

              if (event.target.checked) {
                setError('');
              }
            }}
            disabled={loading}
          />

          <label
            htmlFor="dpdp-consent"
            className="consent-label"
          >
            I agree to the{' '}

            <button
              type="button"
              className="consent-link"
              onClick={() => {
                if (onOpenLegal) {
                  onOpenLegal('privacy');
                }
              }}
              disabled={loading}
            >
              Privacy Policy
            </button>

            {' '}and{' '}

            <button
              type="button"
              className="consent-link"
              onClick={() => {
                if (onOpenLegal) {
                  onOpenLegal('terms');
                }
              }}
              disabled={loading}
            >
              Terms &amp; Conditions
            </button>

            . I consent to the collection and processing
            of my personal data as described therein, in
            accordance with the Digital Personal Data
            Protection Act, 2023.
          </label>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              color: '#ff6b6b',
              fontSize: '13px',
              marginTop: '12px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: '24px' }}
          disabled={loading}
        >
          {loading && (
            <span
              className="spinner"
              aria-hidden="true"
            />
          )}

          {loading ? 'Saving...' : 'Enter App'}
        </button>
      </form>
    </div>
  </div>
);
}