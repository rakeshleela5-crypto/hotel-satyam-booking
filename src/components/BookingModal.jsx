import React, { useState } from 'react';
import { Button } from './Button';
import {
  isPastDate,
  formatIndianDate,
  calculateNights,
  getLocalDateString
} from '../utils/dates';
import {
  bookRoom,
  joinWaitlist,
  createOrder,
  verifyPayment
} from '../api';
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

  const nights = calculateNights(checkIn, checkOut);

  const isDateValid =
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    new Date(checkIn) < new Date(checkOut) &&
    !isPastDate(checkIn);

  const handleContinueToDetails = () => {
    setDateError('');

    if (!checkIn) {
      setDateError('Please select a check-in date.');
      return;
    }

    if (!checkOut) {
      setDateError('Please select a check-out date.');
      return;
    }

    if (isPastDate(checkIn)) {
      setDateError('Check-in date cannot be in the past.');
      return;
    }

    const [inYear, inMonth, inDay] = checkIn
      .split('-')
      .map(Number);

    const [outYear, outMonth, outDay] = checkOut
      .split('-')
      .map(Number);

    const checkInDate = new Date(
      inYear,
      inMonth - 1,
      inDay
    );

    const checkOutDate = new Date(
      outYear,
      outMonth - 1,
      outDay
    );

    if (checkInDate >= checkOutDate) {
      setDateError(
        'Check-out date must be after check-in date.'
      );
      return;
    }

    setStep(2);
  };

  const handleGuestSubmit = (event) => {
    event.preventDefault();
    setStep(3);
  };

  const showError = (error, fallback) => {
    setResult({
      type: 'error',
      message: error?.message || fallback
    });
  };

  const handleBook = async (paymentMethod) => {
    setLoading(true);

    try {
      const bookingPayload = {
        roomType: room.id,
        checkIn,
        checkOut,
        name,
        phone,
        guests: Number(guests),
        paymentMethod
      };

      if (paymentMethod === 'razorpay') {
        const bookingResponse = await bookRoom(
          bookingPayload
        );

        if (!bookingResponse?.success) {
          throw new Error(
            bookingResponse?.error ||
            'Could not create booking.'
          );
        }

        const orderResponse = await createOrder({
          bookingId: bookingResponse.bookingId
        });

        if (!orderResponse?.success) {
          throw new Error(
            orderResponse?.error ||
            'Could not create payment order.'
          );
        }

        if (orderResponse.mock) {
          const verifyResponse = await verifyPayment({
            bookingId: bookingResponse.bookingId,
            razorpay_order_id: orderResponse.orderId,
            razorpay_payment_id: `mock_payment_${ Date.now() }`,
            razorpay_signature: 'mock_signature'
          });

        setResult({
          type: 'success',
          message: `Payment Successful (Demo)! Booking ID: ${
          verifyResponse.bookingId
        }`
          });

      return;
    }

        if (!window.Razorpay) {
      throw new Error(
        'Razorpay Checkout is not loaded.'
      );
    }

    const options = {
      key: orderResponse.keyId,
      amount: orderResponse.amount,
      currency: orderResponse.currency || 'INR',
      name: 'Hotel Satyam Residency',
      description: `Booking: ${ room.name } (${ nights } nights)`,
    order_id: orderResponse.orderId,
      handler: async (response) => {
        try {
          const verifyResponse = await verifyPayment({
            bookingId: bookingResponse.bookingId,
            razorpay_payment_id:
              response.razorpay_payment_id,
            razorpay_order_id:
              response.razorpay_order_id,
            razorpay_signature:
              response.razorpay_signature
          });

          setResult({
            type: 'success',
            message: `Payment Successful! Booking Confirmed! ID: ${
            verifyResponse.bookingId
          }`
              });
      } catch (error) {
        showError(
          error,
          'Payment verification failed.'
        );
      } finally {
      setLoading(false);
    }
  },

    prefill: {
      name,
      contact: phone
    },

    theme: {
      color: '#D4AF37'
    }
};

const razorpay = new window.Razorpay(options);

razorpay.on('payment.failed', (response) => {
  setResult({
    type: 'error',
    message:
      response?.error?.description ||
      'Payment failed.'
  });
  setLoading(false);
});

razorpay.open();
return;
      }

const response = await bookRoom(bookingPayload);

if (!response?.success) {
  throw new Error(
    response?.error || 'Booking failed.'
  );
}

setResult({
  type: 'success',
  message: `Booking Confirmed (Pay at Hotel)! ID: ${
  response.bookingId
}`
      });
    } catch (error) {
  showError(error, 'Failed to process booking.');
} finally {
  setLoading(false);
}
  };

const handleWaitlist = async (event) => {
  event.preventDefault();
  setLoading(true);

  try {
    await joinWaitlist({
      roomType: room.id,
      preferredDates: `${ checkIn } to ${ checkOut }`,
      name,
      phone
      });

  setResult({
    type: 'success',
    message:
      'Added to waitlist! We will contact you soon.'
  });
} catch (error) {
  showError(
    error,
    'Failed to join waitlist.'
  );
} finally {
  setLoading(false);
}
  };

if (result) {
  return (
    <div className="modal-overlay">
      <div
        className="modal-content flex-column"
        style={{
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 16
          }}
        >
          {result.type === 'success' ? '✅' : '❌'}
        </div>

        <h2>{result.message}</h2>

        <Button
          className="mt-4"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

if (step === 3) {
  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1000,
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          background: '#fff',
          minHeight: '100vh',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <PaymentPage
          amount={Number(room.price || 0) * nights}
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
        <h2>
          {step === 1
            ? 'Select Dates'
            : 'Guest Details'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer'
          }}
          aria-label="Close booking modal"
        >
          ×
        </button>
      </div>

      <div className="mb-4">
        <strong>{room.name}</strong> - ₹
        {Number(room.price || 0)}/night
      </div>

      {step === 1 && (
        <div className="flex-column gap-4">
          <div className="form-group">
            <label className="form-label">
              Check-in Date
            </label>

            <input
              type="date"
              className="form-input"
              value={checkIn}
              onChange={(event) =>
                setCheckIn(event.target.value)
              }
              min={getLocalDateString()}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Check-out Date
            </label>

            <input
              type="date"
              className="form-input"
              value={checkOut}
              onChange={(event) =>
                setCheckOut(event.target.value)
              }
              min={
                checkIn || getLocalDateString()
              }
            />
          </div>

          {isDateValid && (
            <div
              style={{
                background:
                  'var(--secondary-color)',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center'
              }}
            >
              {formatIndianDate(checkIn)} to{' '}
              {formatIndianDate(checkOut)}
              <br />
              <strong>
                {nights} Night
                {nights > 1 ? 's' : ''}
              </strong>{' '}
              | Total:{' '}
              <strong>
                ₹{Number(room.price || 0) * nights}
              </strong>
            </div>
          )}

          {dateError && (
            <div
              style={{
                color: 'red',
                fontSize: '14px',
                textAlign: 'center'
              }}
            >
              {dateError}
            </div>
          )}

          <Button
            onClick={handleContinueToDetails}
          >
            Continue to Details
          </Button>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={handleGuestSubmit}
          className="flex-column gap-4"
        >
          <div className="form-group">
            <label className="form-label">
              Full Name
            </label>

            <input
              required
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone Number
            </label>

            <input
              required
              type="tel"
              className="form-input"
              placeholder="Enter your phone"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Number of Guests
            </label>
            <select
              className="form-input"
              value={guests}
              onChange={(event) =>
                setGuests(event.target.value)
              }
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
            </select>
          </div>

          <div className="flex-column gap-2 mt-4">
            <Button type="submit">
              Proceed to Payment
            </Button>

            <Button
              type="button"
              variant="secondary"
              loading={loading}
              onClick={handleWaitlist}
            >
              Join Waitlist Instead
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
              style={{
                background: 'transparent'
              }}
            >
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  </div>
);
}