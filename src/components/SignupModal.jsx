import React, { useState } from 'react';
import { config } from '../config';

export function SignupModal({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call for sign up
    setTimeout(() => {
      // Save user details to localStorage
      localStorage.setItem('satyam_user', JSON.stringify(formData));
      setLoading(false);
      onComplete(formData);
    }, 1000);
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

          <button type="submit" className="btn btn-primary" style={{ marginTop: '24px' }} disabled={loading}>
            {loading ? <div className="spinner"></div> : null}
            {loading ? 'Saving...' : 'Enter App'}
          </button>
        </form>
      </div>
    </div>
  );
}
