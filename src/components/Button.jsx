import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  loading = false,
  type = 'button',
  style = {} 
}) {
  return (
    <button 
      type={type}
      className={`btn btn-${variant}`} 
      onClick={onClick} 
      disabled={disabled || loading}
      style={style}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}
