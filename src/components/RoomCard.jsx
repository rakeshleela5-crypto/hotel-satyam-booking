import React, { useState } from 'react';
import { Button } from './Button';

export function RoomCard({ room, onBook }) {
  const formatCurrency = (amount) => `₹${Math.round(amount).toLocaleString('en-IN')}`;
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = room.photos && room.photos.length > 0
    ? room.photos
    : [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
      ];

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="room-card-premium">
      {/* Photo Carousel */}
      <div className="room-carousel-container">
        <img
          src={photos[activePhotoIndex]}
          alt={`${room.name} view ${activePhotoIndex + 1}`}
          className="room-carousel-img"
          loading="lazy"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="carousel-arrow carousel-prev"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="carousel-arrow carousel-next"
              onClick={handleNextPhoto}
              aria-label="Next photo"
            >
              ›
            </button>

            <div className="carousel-dots">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot ${idx === activePhotoIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <span className="room-badge-category">{room.name}</span>
        {photos.length > 1 && (
          <span className="room-photo-counter">
            📸 {activePhotoIndex + 1}/{photos.length}
          </span>
        )}
      </div>

      <div className="room-card-body">
        {/* Header & Pricing */}
        <div className="room-header-row">
          <div>
            <h3 className="serif room-card-title">{room.name}</h3>
            <p className="room-bed-type">
              <span>🛏️ {room.bedType || 'Comfortable Bed'}</span>
              <span className="dot-separator">•</span>
              <span>👥 {room.occupancy?.text || '2 Adults, 1 Child'}</span>
            </p>
          </div>

          <div className="room-price-box">
            <div className="room-price-main">
              {formatCurrency(room.price)}
              <span className="room-price-period"> / night</span>
            </div>
            <span className="room-tax-note">
              ₹{room.price} base + 12% GST (₹{Math.round(room.price * 0.12)}) = ₹{room.price + Math.round(room.price * 0.12)} all-inclusive
            </span>
          </div>
        </div>

        {/* Cancellation Policy Tag & Direct Booking Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
          <div className="cancellation-policy-tag">
            <span className="cancellation-icon">✓</span>
            <span>{room.cancellationPolicy || 'Free cancellation up to 24 hrs before check-in'}</span>
          </div>
          <div style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#81c784', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🛡️ <strong>Direct Book Perk:</strong> Free Daily Breakfast + ₹200 Dining Credit</span>
            <strong style={{ color: '#4CAF50' }}>SAVE ₹350+</strong>
          </div>
        </div>

        {/* Description */}
        <p className="room-card-desc">{room.description}</p>

        {/* Key Amenities */}
        <div className="room-amenities-section">
          <div className="room-amenities-grid">
            {(room.keyAmenities || []).map((amenity, idx) => (
              <div key={idx} className="amenity-chip-item">
                <span className="amenity-icon">{amenity.icon}</span>
                <span className="amenity-label">{amenity.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="room-card-action">
          <Button onClick={() => onBook(room)}>
            Select Dates &amp; Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}