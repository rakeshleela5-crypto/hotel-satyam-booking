import React, { useState } from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  className = '',
  ...props 
}) {
  return (
    <button 
      className={`btn btn-${variant} ${className}`} 
      disabled={loading || disabled}
      {...props}
    >
      {loading && <div className="spinner"></div>}
      {children}
    </button>
  );
}
