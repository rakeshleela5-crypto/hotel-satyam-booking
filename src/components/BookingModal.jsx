import React, { useState } from 'react';
import { Button } from './Button';
import { isPastDate, formatIndianDate, calculateNights, getLocalDateString } from '../utils/dates';
import { bookRoom, joinWaitlist, createOrder, verifyPayment } from '../api';
import { PaymentPage } from './PaymentPage';

export function BookingModal({ room, onClose }) {
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dateError, setDateError] = useState('');

  // Validate dates
  const nights = calculateNights(checkIn, checkOut);
  const isDateValid = checkIn && checkOut && new Date(checkIn) < new Date(checkOut) && !isPastDate(checkIn);
  
  const handleContinueToDetails = () => {
    setDateError('');
    if (!checkIn) return setDateError('Please select a check-in date.');
    if (!checkOut) return setDateError('Please select a check-out date.');
    if (isPastDate(checkIn)) return setDateError('Check-in date cannot be in the past.');
    
    // Parse the local strings manually so comparing works correctly in local time
    const checkInDate = new Date(checkIn.split('-')[0], checkIn.split('-')[1] - 1, checkIn.split('-')[2]);
    const checkOutDate = new Date(checkOut.split('-')[0], checkOut.split('-')[1] - 1, checkOut.split('-')[2]);
    
    if (checkInDate >= checkOutDate) return setDateError('Check-out date must be after check-in date.');
    setStep(2);
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleBook = async (paymentMethod) => {
    setLoading(true);
    try {
      if (paymentMethod === 'razorpay') {
        // Step 1: Create Order on Backend
        const orderRes = await createOrder({ roomType: room.id, checkIn, checkOut, name, phone, guests });
        
        if (orderRes.orderId.startsWith('mock_')) {
          // Simulate Razorpay Payment Success for Demo Mode
          setTimeout(async () => {
            try {
              const verifyRes = await verifyPayment({
                razorpay_payment_id: `mock_payment_${Date.now()}`,
                razorpay_order_id: orderRes.orderId,
                razorpay_signature: 'mock_signature',
                bookingId: orderRes.bookingId
              });
              setResult({ type: 'success', message: `Payment Successful (Demo)! Booking ID: ${verifyRes.bookingId}` });
            } catch (err) {
              setResult({ type: 'error', message: err.message || 'Payment verification failed.' });
            }
          }, 1500); // Fake a 1.5s delay
          return;
        }

        // Initialize Real Razorpay Checkout
        const options = {
          key: orderRes.keyId, // Fetched securely from the backend worker
          amount: orderRes.amount, 
          currency: "INR",
          name: "Hotel Satyam Residency",
          description: `Booking: ${room.name} (${nights} Nights)`,
          order_id: orderRes.orderId,
          handler: async function (response) {
            try {
              // Step 3: Verify Payment on Backend
              const verifyRes = await verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: orderRes.bookingId
              });
              setResult({ type: 'success', message: `Payment Successful! Booking Confirmed! ID: ${verifyRes.bookingId}` });
            } catch (err) {
              setResult({ type: 'error', message: err.message || 'Payment verification failed.' });
            }
          },
          prefill: {
            name: name,
            contact: phone,
          },
          theme: {
            color: "#D4AF37"
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
           setResult({ type: 'error', message: `Payment failed: ${response.error.description}` });
        });
        rzp.open();
      } else {
        // Fallback for Pay at Hotel
        const res = await bookRoom({ roomType: room.id, checkIn, checkOut, name, phone, guests, paymentMethod });
        setResult({ type: 'success', message: `Booking Confirmed (Pay at Hotel)! ID: ${res.bookingId}` });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Failed to process booking.' });
    }
    setLoading(false);
  };

  const handleWaitlist = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await joinWaitlist({ roomType: room.id, preferredDates: `${checkIn} to ${checkOut}`, name, phone });
      setResult({ type: 'success', message: 'Added to waitlist! We will contact you soon.' });
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Failed to join waitlist.' });
    }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="modal-overlay">
        <div className="modal-content flex-column" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{result.type === 'success' ? '✅' : '❌'}</div>
          <h2>{result.message}</h2>
          <Button className="mt-4" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="modal-overlay" style={{ zIndex: 1000, overflowY: 'auto' }}>
        <div style={{ background: '#fff', minHeight: '100vh', width: '100%', position: 'absolute', top: 0, left: 0 }}>
          <PaymentPage 
            amount={room.price * nights} 
            loading={loading} 
            onBack={() => setStep(2)} 
            onPay={handleBook} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex-row justify-between mb-4">
          <h2>{step === 1 ? 'Select Dates' : 'Guest Details'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        
        <div className="mb-4">
          <strong>{room.name}</strong> - ₹{room.price}/night
        </div>

        {step === 1 && (
          <div className="flex-column gap-4">
            <div className="form-group">
              <label className="form-label">Check-in Date</label>
              <input type="date" className="form-input" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={getLocalDateString()} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Check-out Date</label>
              <input type="date" className="form-input" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || getLocalDateString()} />
            </div>
            
            {isDateValid && (
              <div style={{ background: 'var(--secondary-color)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                {formatIndianDate(checkIn)} to {formatIndianDate(checkOut)}<br/>
                <strong>{nights} Night{nights > 1 ? 's' : ''}</strong> | Total: <strong>₹{room.price * nights}</strong>
              </div>
            )}
            
            {dateError && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{dateError}</div>}
            
            <Button onClick={handleContinueToDetails}>Continue to Details</Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleGuestSubmit} className="flex-column gap-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" className="form-input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input required type="tel" className="form-input" placeholder="Enter your phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Number of Guests</label>
              <select className="form-input" value={guests} onChange={e => setGuests(e.target.value)}>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>
            
            <div className="flex-column gap-2 mt-4">
              <Button type="submit">Proceed to Payment</Button>
              <Button type="button" variant="secondary" loading={loading} onClick={handleWaitlist}>Join Waitlist Instead</Button>
              <Button type="button" variant="secondary" onClick={() => setStep(1)} style={{ background: 'transparent' }}>Back</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
