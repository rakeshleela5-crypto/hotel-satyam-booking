import React, { useState, useEffect } from 'react';
import { config } from '../config';

export function StickyMobileBookBar({ onSelectDates }) {
  const [isVisible, setIsVisible] = useState(true);

  // Compute minimum room starting price
  const minPrice = config.roomTypes?.reduce((min, room) => {
    return room.price < min ? room.price : min;
  }, config.roomTypes[0]?.price || 1499) || 1499;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Keep visible on mobile, hide if near footer
      if (documentHeight - (currentScrollY + windowHeight) < 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookClick = () => {
    if (onSelectDates) {
      onSelectDates();
      return;
    }

    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="sticky-mobile-book-bar" role="region" aria-label="Quick Booking Navigation">
      <div className="sticky-mobile-inner">
        <div className="sticky-mobile-pricing">
          <span className="sticky-price-label">Starting From</span>
          <div className="sticky-price-value">
            ₹{minPrice.toLocaleString('en-IN')}
            <span className="sticky-price-unit"> / night</span>
          </div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>
            + 12% GST (₹{Math.round(minPrice * 0.12)}) = ₹{minPrice + Math.round(minPrice * 0.12)}
          </span>
        </div>

        <button
          type="button"
          className="sticky-book-btn"
          onClick={handleBookClick}
          id="mobile-sticky-book-now-btn"
        >
          <span className="sticky-btn-pulse" />
          <span>Select Dates &amp; Book Now</span>
          <span className="sticky-btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
