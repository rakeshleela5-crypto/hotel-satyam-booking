import React, { useState } from 'react';
import { Button } from './Button';
import {
  isPastDate,
  formatIndianDate,
  getLocalDateString,
  getMinCheckOutDate,
  calculateStayPricing
} from '../utils/dates';
import {
  bookRoom,
  joinWaitlist
} from '../api';
import { PaymentPage } from './PaymentPage';

export function BookingModal({ room, onClose, initialDates, initialGuests, initialSpecialRequests }) {
  const [step, setStep] = useState(1);
  const todayStr = getLocalDateString();
  const defaultCheckOutStr = getLocalDateString(1);

  const [checkIn, setCheckIn] = useState(initialDates?.checkIn || todayStr);
  const [checkOut, setCheckOut] = useState(initialDates?.checkOut || defaultCheckOutStr);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(String(initialGuests || '2'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [dateError, setDateError] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialNotes, setSpecialNotes] = useState(initialSpecialRequests || '');

  // Addon Definitions
  const availableAddons = [
    { id: 'early_checkin', name: '🌅 Early Check-in Pass (from 8 AM)', price: 350, perNight: false },
    { id: 'station_pickup', name: '🚗 Rayagada Station Pickup Assistance', price: 450, perNight: false },
    { id: 'buffet_breakfast', name: '🍳 Odia & Continental Buffet Breakfast', price: 250, perGuest: true },
    { id: 'extra_mattress', name: '🛏️ Extra Soft Comfort Mattress & Blanket', price: 400, perNight: true }
  ];

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Determine extra guest rate based on room category
  const extraGuestRate = room.id === 'suite' ? 750 : (room.id === 'deluxe' ? 500 : 400);

  const basePricing = calculateStayPricing({
    basePrice: Number(room.price || 1499),
    checkIn,
    checkOut,
    guests: Number(guests) || 1,
    baseCapacity: 2,
    extraGuestRate
  });

  const nights = basePricing.nights;

  // Calculate Addon Totals
  const addonTotal = selectedAddons.reduce((sum, addonId) => {
    const item = availableAddons.find(a => a.id === addonId);
    if (!item) return sum;
    if (item.perGuest) return sum + (item.price * (Number(guests) || 1) * nights);
    if (item.perNight) return sum + (item.price * nights);
    return sum + item.price;
  }, 0);

  const combinedSubtotal = basePricing.roomTotal + basePricing.extraGuestTotal + addonTotal;
  const combinedTax = Math.round(combinedSubtotal * 0.12);
  const totalAmount = combinedSubtotal + combinedTax;

  const pricing = {
    ...basePricing,
    addonTotal,
    subtotal: combinedSubtotal,
    tax: combinedTax,
    total: totalAmount
  };

  const isDateValid =
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    new Date(checkIn) < new Date(checkOut) &&
    !isPastDate(checkIn) &&
    nights >= 1;

  // Handle dynamic check-in change
  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    setCheckIn(newCheckIn);
    setDateError('');

    // If check-out is before or equal to new check-in, auto advance check-out to checkIn + 1 day
    const minCheckOut = getMinCheckOutDate(newCheckIn);
    if (!checkOut || new Date(checkOut) <= new Date(newCheckIn)) {
      setCheckOut(minCheckOut);
    }
  };

  const handleCheckOutChange = (e) => {
    const newCheckOut = e.target.value;
    setCheckOut(newCheckOut);
    setDateError('');

    if (newCheckIn && new Date(newCheckOut) <= new Date(checkIn)) {
      setDateError('Check-out date must be strictly after Check-in date (minimum 1 night stay).');
    }
  };

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

    if (new Date(checkOut) <= new Date(checkIn)) {
      setDateError('Check-out date must be strictly after check-in date (minimum 1 night stay).');
      return;
    }

    setStep(2);
  };

  const handleGuestSubmit = async (event) => {
    event.preventDefault();
    if (createdBooking) {
      setStep(3);
      return;
    }

    setLoading(true);
    const addonNames = selectedAddons.map(id => availableAddons.find(a => a.id === id)?.name).filter(Boolean);
    const fullSpecialRequests = [
      addonNames.length ? `[Add-ons: ${addonNames.join(', ')}]` : '',
      specialNotes
    ].filter(Boolean).join(' ');

    try {
      const response = await bookRoom({
        roomType: room.name || room.id,
        checkIn,
        checkOut,
        name,
        phone,
        guests: Number(guests),
        specialRequests: fullSpecialRequests
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Booking failed.');
      }

      setCreatedBooking({ bookingId: response.bookingId, bookingCode: response.bookingCode, amount: pricing.total });
      setStep(3);
    } catch (error) {
      showError(error, 'Failed to process booking.');
    } finally {
      setLoading(false);
    }
  };

  const showError = (error, fallback) => {
    setResult({
      type: 'error',
      message: error?.message || fallback
    });
  };

  const handleWaitlist = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await joinWaitlist({
        roomType: room.name || room.id,
        preferredDates: `${checkIn} to ${checkOut}`,
        name,
        phone
      });

      setResult({
        type: 'success',
        message: 'Added to waitlist! Our front desk team will contact you shortly.'
      });
    } catch (error) {
      showError(error, 'Failed to join waitlist.');
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {result.type === 'success' ? '✅' : '❌'}
          </div>

          <h2>{result.message}</h2>

          <Button className="mt-4" onClick={onClose}>
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
            bookingId={createdBooking?.bookingId}
            bookingCode={createdBooking?.bookingCode}
            bookingData={{ name, phone, email: '', roomType: room.name || room.id, guests: Number(guests) }}
            amount={createdBooking?.amount || pricing.total}
            loading={loading}
            onBack={() => setStep(2)}
            onSuccess={(res) => {
              if (res.method === 'pay-at-hotel') {
                setResult({ type: 'success', message: `Booking Confirmed (Pay at Hotel)! ID: ${createdBooking?.bookingCode || createdBooking?.bookingId}` });
              } else {
                setResult({ type: 'success', message: `Payment Successful! ID: ${createdBooking?.bookingCode || createdBooking?.bookingId}` });
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex-row justify-between mb-4">
          <h2 className="serif">
            {step === 1 ? 'Select Stay Dates & Guests' : 'Guest Information'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#fff'
            }}
            aria-label="Close booking modal"
          >
            ×
          </button>
        </div>

        <div className="mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <div>
            <strong style={{ fontSize: '16px', color: 'var(--primary-color)' }}>{room.name}</strong>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🛏️ {room.bedType || 'Plush Bed'} &bull; Max Base Capacity: 2 Adults</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{Number(room.price || 1499).toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}> / night</span>
          </div>
        </div>

        {step === 1 && (
          <div className="flex-column gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Check-in Date Picker */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                  Check-in Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={checkIn}
                  onChange={handleCheckInChange}
                  min={todayStr}
                  required
                />
              </div>

              {/* Check-out Date Picker */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                  Check-out Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOut}
                  onChange={handleCheckOutChange}
                  min={getMinCheckOutDate(checkIn)}
                  required
                />
              </div>
            </div>

            {/* Guests Selector */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                Total Occupancy (Guests)
              </label>
              <select
                className="form-input"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="1">1 Adult (Base Rate)</option>
                <option value="2">2 Adults (Base Capacity Included)</option>
                <option value="3">3 Guests (+ ₹{extraGuestRate}/night extra bed)</option>
                <option value="4">4 Guests (+ ₹{extraGuestRate * 2}/night extra beds)</option>
                <option value="5">5 Guests (+ ₹{extraGuestRate * 3}/night extra beds)</option>
              </select>
            </div>

            {/* Smart Add-ons & AI Upselling */}
            <div style={{ background: 'rgba(201, 168, 76, 0.05)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-color)', marginBottom: '8px' }}>
                ✨ Recommended Stay Upgrades &amp; Add-ons:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableAddons.map(addon => {
                  const isChecked = selectedAddons.includes(addon.id);
                  const displayCost = addon.perGuest 
                    ? `+₹${addon.price * (Number(guests) || 1) * nights} (₹${addon.price}/guest/day)`
                    : (addon.perNight ? `+₹${addon.price * nights} (₹${addon.price}/nt)` : `+₹${addon.price}`);

                  return (
                    <label
                      key={addon.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: isChecked ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.06)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: isChecked ? '#fff' : 'var(--text-secondary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                          style={{ accentColor: 'var(--primary-color)' }}
                        />
                        <span>{addon.name}</span>
                      </div>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '11px' }}>{displayCost}</strong>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Itemized Price Breakdown */}
            {isDateValid && (
              <div
                style={{
                  background: 'rgba(20, 20, 20, 0.95)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              >
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                  📅 {formatIndianDate(checkIn)} → {formatIndianDate(checkOut)} ({nights} Night{nights > 1 ? 's' : ''})
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.9 }}>
                  <span>Room Base Rate ({nights} night{nights > 1 ? 's' : ''} × ₹{pricing.basePrice.toLocaleString('en-IN')}):</span>
                  <span>₹{pricing.roomTotal.toLocaleString('en-IN')}</span>
                </div>

                {pricing.extraGuests > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#ffb74d' }}>
                    <span>Extra Guest Surcharge ({pricing.extraGuests} × ₹{pricing.extraGuestRate}/nt × {nights}N):</span>
                    <span>+ ₹{pricing.extraGuestTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {addonTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#a5d6a7' }}>
                    <span>Selected Add-ons &amp; Upgrades ({selectedAddons.length}):</span>
                    <span>+ ₹{addonTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.8 }}>
                  <span>Taxes &amp; GST (12%):</span>
                  <span>+ ₹{pricing.tax.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(201, 168, 76, 0.3)', fontWeight: 'bold', fontSize: '15px', color: 'var(--primary-color)' }}>
                  <span>Total Amount Payable:</span>
                  <span>₹{pricing.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {dateError && (
              <div
                style={{
                  color: '#ff4d4d',
                  fontSize: '13px',
                  textAlign: 'center',
                  background: 'rgba(255, 77, 77, 0.1)',
                  padding: '8px',
                  borderRadius: '6px'
                }}
              >
                {dateError}
              </div>
            )}

            <Button onClick={handleContinueToDetails} disabled={!isDateValid}>
              Continue to Details ({nights} Night{nights > 1 ? 's' : ''} &bull; ₹{pricing.total.toLocaleString('en-IN')})
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleGuestSubmit} className="flex-column gap-4">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                required
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                required
                type="tel"
                className="form-input"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Special Requests (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Late check-in 11 PM, high floor quiet room, extra pillows"
                value={specialNotes}
                onChange={(event) => setSpecialNotes(event.target.value)}
              />
            </div>

            {/* Summary review box */}
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              <div><strong>Stay:</strong> {formatIndianDate(checkIn)} to {formatIndianDate(checkOut)} ({nights} Night{nights > 1 ? 's' : ''})</div>
              <div><strong>Occupancy:</strong> {guests} Guests {pricing.extraGuests > 0 ? `(${pricing.extraGuests} extra guest surcharge included)` : ''}</div>
              {selectedAddons.length > 0 && (
                <div style={{ fontSize: '12px', color: '#a5d6a7', marginTop: '2px' }}>
                  <strong>Add-ons Included:</strong> {selectedAddons.map(id => availableAddons.find(a => a.id === id)?.name).join(', ')}
                </div>
              )}
              <div style={{ marginTop: '6px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                Total: ₹{pricing.total.toLocaleString('en-IN')} (incl. GST)
              </div>
            </div>

            <div className="flex-column gap-2 mt-2">
              <Button type="submit">
                Proceed to Payment (₹{pricing.total.toLocaleString('en-IN')})
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
                style={{ background: 'transparent' }}
              >
                Back to Date Selection
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}