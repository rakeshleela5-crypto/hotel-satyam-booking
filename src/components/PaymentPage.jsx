import React, { useState } from 'react';
import { Button } from './Button';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentPage({ onBack, bookingId, bookingCode, bookingData, amount, loading: externalLoading = false, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const numAmount = Number(amount || 0);
  const baseSubtotal = Math.round(numAmount / 1.12);
  const gstTax = numAmount - baseSubtotal;

  const paymentMethods = [
    {
      id: 'razorpay',
      icon: '⚡️',
      title: 'Pay Online via Razorpay',
      desc: 'Instant confirmation with UPI (GPay, PhonePe, Paytm), Cards, NetBanking'
    },
    {
      id: 'pay-at-hotel',
      icon: '🏨',
      title: 'Pay at Hotel (Cash / UPI on Check-In)',
      desc: 'Lock in your reservation now and pay during check-in at the front desk'
    }
  ];

  const handleRazorpayPay = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!bookingId) {
        throw new Error('Booking ID is missing');
      }

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });

      const orderJson = await orderRes.json();
      if (!orderJson.success) {
        throw new Error(orderJson.error || 'Order creation failed');
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay checkout');
      }

      const options = {
        key: orderJson.keyId,
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: 'Satyam Residency',
        description: `Booking ${bookingCode || bookingId}`,
        order_id: orderJson.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyJson = await verifyRes.json();
            if (!verifyJson.success) {
              throw new Error(verifyJson.error || 'Payment verification failed');
            }

            setMessage(`Payment successful. Booking Code: ${verifyJson.bookingCode}`);
            if (onSuccess) onSuccess(verifyJson);
          } catch (err) {
            setMessage(err.message || 'Verification failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: bookingData?.name || '',
          email: bookingData?.email || '',
          contact: bookingData?.phone || ''
        },
        theme: { color: '#c9a84c' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setMessage('Payment window closed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        setLoading(false);
        setMessage(response?.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      setMessage(err.message || 'Something went wrong');
    }
  };

  const handlePayAtHotel = async () => {
    setMessage('Pay at hotel selected. Reservation confirmed.');
    if (onSuccess) onSuccess({ method: 'pay-at-hotel' });
  };

  return (
    <main className="container" style={{ padding: '30px 20px', maxWidth: '640px', margin: '0 auto' }}>
      <div className="flex-row" style={{ alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            marginRight: '14px',
            color: 'var(--primary-color)'
          }}
          aria-label="Go back"
        >
          ←
        </button>
        <h2 className="serif" style={{ margin: 0, fontSize: '26px' }}>Complete Your Reservation</h2>
      </div>

      {/* Tax & Pricing Transparency Summary Card */}
      <div
        style={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid rgba(201, 168, 76, 0.4)',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
              Booking Reference
            </span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {bookingCode || bookingId}
            </div>
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', border: '1px solid #4CAF50', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
            ✓ 100% Tax Transparency
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#ddd' }}>
          <span>Room Subtotal (Base Rate &amp; Guests):</span>
          <span>₹{baseSubtotal.toLocaleString('en-IN')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#ddd' }}>
          <span>Goods &amp; Services Tax (12% GST):</span>
          <span>+ ₹{gstTax.toLocaleString('en-IN')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(201, 168, 76, 0.3)', fontWeight: 'bold', fontSize: '16px', color: 'var(--primary-color)' }}>
          <span>Total Amount Payable (All-Inclusive):</span>
          <span>₹{numAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
        Select Payment Method:
      </p>

      <div className="flex-column gap-3">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="card"
            style={{
              cursor: 'pointer',
              border: selectedMethod === method.id ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.15)',
              background: selectedMethod === method.id ? 'rgba(201, 168, 76, 0.08)' : 'rgba(20, 20, 20, 0.9)',
              padding: '16px',
              borderRadius: '10px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="flex-row" style={{ alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>{method.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: selectedMethod === method.id ? 'var(--primary-color)' : '#fff' }}>
                  {method.title}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>{method.desc}</p>
              </div>
            </div>

            {selectedMethod === method.id && (
              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                {method.id === 'razorpay' ? (
                  <Button onClick={handleRazorpayPay} loading={loading || externalLoading}>
                    Pay ₹{numAmount.toLocaleString('en-IN')} All-Inclusive
                  </Button>
                ) : (
                  <Button onClick={handlePayAtHotel} loading={loading || externalLoading}>
                    Confirm Reservation (Pay ₹{numAmount.toLocaleString('en-IN')} at Hotel)
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {message && (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(201, 168, 76, 0.1)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontSize: '13px', textAlign: 'center' }}>
          {message}
        </div>
      )}
    </main>
  );
}