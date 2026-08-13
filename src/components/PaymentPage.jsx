import React, { useState } from 'react';
import { Button } from './Button';

export function PaymentPage({ onBack, onPay, loading, amount }) {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const paymentMethods = [
    {
      id: 'upi',
      icon: '📱',
      title: 'UPI & Instant Pay',
      desc: 'Google Pay, PhonePe, Paytm, or BHIM UPI (Most popular for Indian users)'
    },
    {
      id: 'card',
      icon: '💳',
      title: 'Credit / Debit Card',
      desc: 'Visa, Mastercard, RuPay, Maestro'
    },
    {
      id: 'netbanking',
      icon: '🪪',
      title: 'Net Banking',
      desc: 'Support for major local and national banks (SBI, HDFC, ICICI, Axis)'
    },
    {
      id: 'wallet',
      icon: '💰',
      title: 'Digital Wallets',
      desc: 'Mobikwik, Freecharge, Amazon Pay balance'
    },
    {
      id: 'pay-at-hotel',
      icon: '🏨',
      title: 'Pay at Hotel',
      desc: 'Option to reserve without upfront online payment (requires verified card guarantee)'
    }
  ];

  return (
    <main className="container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex-row" style={{ alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', marginRight: '16px', color: 'var(--text-color)' }}
        >
          ←
        </button>
        <h2 className="serif" style={{ margin: 0 }}>Payment Details</h2>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Please select your preferred payment method to complete the reservation.
      </p>

      <div className="flex-column gap-4">
        {paymentMethods.map(method => (
          <div 
            key={method.id}
            className="card"
            style={{ 
              cursor: 'pointer', 
              border: selectedMethod === method.id ? '2px solid var(--primary-color)' : '1px solid #e0e0e0',
              padding: '20px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="flex-row" style={{ alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>{method.icon}</span>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{method.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{method.desc}</p>
              </div>
            </div>

            {selectedMethod === 'card' && method.id === 'card' && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }} className="flex-column gap-4">
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="flex-row gap-4">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Expiry Date</label>
                    <input type="text" className="form-input" placeholder="MM/YY" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">CVV</label>
                    <input type="password" className="form-input" placeholder="123" />
                  </div>
                </div>
              </div>
            )}
            
            {selectedMethod === method.id && (
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <Button onClick={() => onPay(method.id)} loading={loading}>
                  Pay ₹{amount} & Confirm
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
