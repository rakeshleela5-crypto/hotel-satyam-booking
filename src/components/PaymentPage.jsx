import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { assessBookingRisk } from '../api';

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

export function PaymentPage({ onBack, onClose, bookingId, bookingCode, bookingData, amount, loading: externalLoading = false, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [riskData, setRiskData] = useState(null);
  const [evaluatingRisk, setEvaluatingRisk] = useState(true);

  const numAmount = Number(amount || 0);
  const baseSubtotal = Math.round(numAmount / 1.12);
  const gstTax = numAmount - baseSubtotal;

  useEffect(() => {
    runRiskAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runRiskAssessment = async () => {
    try {
      setEvaluatingRisk(true);
      const res = await assessBookingRisk({
        bookingCode: bookingCode || bookingId,
        guestName: bookingData?.name || 'Guest',
        guestEmail: bookingData?.email || '',
        guestPhone: bookingData?.phone || '',
        checkIn: bookingData?.checkIn || '',
        guests: bookingData?.guests || 2,
        totalAmount: numAmount,
        roomType: bookingData?.roomType || 'Standard'
      });
      if (res.success) {
        setRiskData(res);
        if (res.requiresDeposit) {
          setSelectedMethod('razorpay_deposit');
        }
      }
    } catch (err) {
      console.warn('AI Risk Assessment non-blocking notice:', err);
    } finally {
      setEvaluatingRisk(false);
    }
  };

  const depositAmount = riskData?.depositAmount || Math.round(numAmount * 0.15);

  const handleRazorpayPay = async (isDepositOnly = false) => {
    setLoading(true);
    setMessage('');

    try {
      if (!bookingId) {
        throw new Error('Booking ID is missing');
      }

      const payAmount = isDepositOnly ? depositAmount : numAmount;

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, customAmount: payAmount })
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
        description: isDepositOnly 
          ? `Advance Guarantee Deposit (${bookingCode || bookingId})` 
          : `Full Payment (${bookingCode || bookingId})`,
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
      <div className="flex-row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div className="flex-row" style={{ alignItems: 'center' }}>
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
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#fff',
              padding: '4px 8px'
            }}
            aria-label="Close reservation"
          >
            ×
          </button>
        )}
      </div>

      {/* AI Risk & Fraud Assessment Status Bar */}
      {riskData && (
        <div
          style={{
            background: riskData.requiresDeposit ? 'rgba(255, 152, 0, 0.12)' : 'rgba(76, 175, 80, 0.12)',
            border: `1px solid ${riskData.requiresDeposit ? '#ff9800' : '#4CAF50'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: riskData.requiresDeposit ? '#ffb74d' : '#81c784' }}>
              {riskData.requiresDeposit ? '⚠️ AI Predictive Risk Scoring: Deposit Recommended' : '🛡️ AI Verified Guest: Instant Confirmation Active'}
            </span>
            <span style={{ fontSize: '11px', background: riskData.requiresDeposit ? '#ff9800' : '#4CAF50', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
              Risk: {riskData.riskScore}% ({riskData.riskLevel})
            </span>
          </div>
          <div style={{ color: '#ccc', fontSize: '12px' }}>
            {riskData.requiresDeposit
              ? `Due to high demand or same-day unverified booking signals, an advance guarantee deposit of ₹${depositAmount} (${riskData.depositPercentage}%) is required to hold your room.`
              : 'Your booking signals are verified. You can complete full payment online or opt for Pay at Hotel.'}
          </div>
        </div>
      )}

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
        Select Payment Option:
      </p>

      <div className="flex-column gap-3">
        {/* Option 1: 100% Full Payment via Razorpay */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            border: selectedMethod === 'razorpay' ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.15)',
            background: selectedMethod === 'razorpay' ? 'rgba(201, 168, 76, 0.08)' : 'rgba(20, 20, 20, 0.9)',
            padding: '16px',
            borderRadius: '10px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setSelectedMethod('razorpay')}
        >
          <div className="flex-row" style={{ alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>⚡️</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: selectedMethod === 'razorpay' ? 'var(--primary-color)' : '#fff' }}>
                Pay 100% Online via Razorpay / UPI
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                Instant confirmed voucher via UPI (GPay, PhonePe, Paytm), Cards, NetBanking
              </p>
            </div>
          </div>

          {selectedMethod === 'razorpay' && (
            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <Button onClick={() => handleRazorpayPay(false)} loading={loading || externalLoading}>
                Pay ₹{numAmount.toLocaleString('en-IN')} All-Inclusive
              </Button>
            </div>
          )}
        </div>

        {/* Option 2: 15% Advance Guarantee Deposit (High-Risk Trigger / Flexibility) */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            border: selectedMethod === 'razorpay_deposit' ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.15)',
            background: selectedMethod === 'razorpay_deposit' ? 'rgba(201, 168, 76, 0.08)' : 'rgba(20, 20, 20, 0.9)',
            padding: '16px',
            borderRadius: '10px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setSelectedMethod('razorpay_deposit')}
        >
          <div className="flex-row" style={{ alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>🛡️</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: selectedMethod === 'razorpay_deposit' ? 'var(--primary-color)' : '#fff' }}>
                  Pay Advance Guarantee Token (₹{depositAmount})
                </h3>
                <span style={{ fontSize: '10px', background: '#ff9800', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  RECOMMENDED
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                Pay small ₹{depositAmount} advance now to lock the room; pay balance ₹{(numAmount - depositAmount).toLocaleString('en-IN')} on check-in.
              </p>
            </div>
          </div>

          {selectedMethod === 'razorpay_deposit' && (
            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <Button onClick={() => handleRazorpayPay(true)} loading={loading || externalLoading}>
                Pay Token ₹{depositAmount} &amp; Lock Reservation
              </Button>
            </div>
          )}
        </div>

        {/* Option 3: Pay 100% at Hotel */}
        <div
          className="card"
          style={{
            cursor: 'pointer',
            border: selectedMethod === 'pay-at-hotel' ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.15)',
            background: selectedMethod === 'pay-at-hotel' ? 'rgba(201, 168, 76, 0.08)' : 'rgba(20, 20, 20, 0.9)',
            padding: '16px',
            borderRadius: '10px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setSelectedMethod('pay-at-hotel')}
        >
          <div className="flex-row" style={{ alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>🏨</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: selectedMethod === 'pay-at-hotel' ? 'var(--primary-color)' : '#fff' }}>
                Pay at Hotel (Cash / UPI on Check-In)
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                {riskData?.requiresDeposit
                  ? 'Subject to WhatsApp verification 4h before check-in to avoid auto-release.'
                  : 'Instant reservation confirmed. Pay total at the front desk upon arrival.'}
              </p>
            </div>
          </div>

          {selectedMethod === 'pay-at-hotel' && (
            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <Button onClick={handlePayAtHotel} loading={loading || externalLoading}>
                Confirm Reservation (Pay ₹{numAmount.toLocaleString('en-IN')} at Desk)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4-Hour Auto-Release Policy Disclosure */}
      <div style={{ marginTop: '18px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        🔒 <strong>Satyam AI Auto-Release Policy:</strong> To protect hotel inventory for genuine travelers, unconfirmed Pay-at-Hotel reservations receive an automated WhatsApp confirmation link 4 hours before check-in. Unverified bookings will be released back to live inventory.
      </div>

      {message && (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(201, 168, 76, 0.1)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontSize: '13px', textAlign: 'center' }}>
          {message}
        </div>
      )}
    </main>
  );
}