import React, { useState, useEffect } from 'react';
import { config } from './config';
import { RoomCard } from './components/RoomCard';
import { BookingModal } from './components/BookingModal';
import { SignupModal } from './components/SignupModal';
import { LegalPageViewer, CookieConsentBanner, FooterLegalLinks } from './components/LegalPages';
import { LiveRoomTracker } from './components/LiveRoomTracker';
import { AdminRoute } from './components/AdminRoute';
import './index.css';

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeLegalPage, setActiveLegalPage] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('satyam_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsInitializing(false);
  }, []);

  const openLegal = (pageKey) => setActiveLegalPage(pageKey);
  const closeLegal = () => setActiveLegalPage(null);

  const handleSignOut = () => {
    localStorage.removeItem('satyam_user');
    setUser(null);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isInitializing) return null;

  if (showAdmin) {
    // Use AdminRoute instead of AdminDashboard directly
    return <AdminRoute onBack={() => setShowAdmin(false)} />;
  }

  return (
    <>
      {/* Sticky Top-Class Navigation Bar */}
      <nav className="navbar" role="navigation" aria-label="Main Navigation">
        <div className="navbar-container">
          <a href="#home" className="nav-brand serif" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>
            Satyam Residency
          </a>
          <div className="nav-links">
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
            <a href="#gallery" onClick={(e) => { e.preventDefault(); scrollToSection('gallery'); }}>Gallery</a>
            <a href="#booking" onClick={(e) => { e.preventDefault(); scrollToSection('booking'); }}>Rooms</a>
            <a href="#reviews" onClick={(e) => { e.preventDefault(); scrollToSection('reviews'); }}>Reviews</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a>
          </div>
          <div className="nav-user">
            {user ? (
              <div className="user-badge flex-row gap-2">
                <span className="user-name">Hello, {user.name}</span>
                <button className="btn-small-secondary" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <button className="btn-small-primary" onClick={() => setShowSignupModal(true)}>Sign Up</button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="app-wrapper">
        {/* Section 1: Hero Banner */}
        <header id="home" className="hero-section">
          <div className="hero-overlay">
            <p className="hero-subhead">Welcome to Rayagada's Finest</p>
            <h1 className="hero-title serif">{config.hotel.name}</h1>
            <p className="hero-tagline">{config.hotel.subtitle}</p>

            <div className="hero-cta-group">
              <button className="btn btn-primary hero-btn" onClick={() => scrollToSection('booking')}>
                Book Your Stay
              </button>
              <button className="btn btn-secondary hero-btn" onClick={() => scrollToSection('gallery')}>
                View Hotel Gallery
              </button>
            </div>
          </div>
        </header>

        {/* Section 2: About Us */}
        <section id="about" className="section container">
          <div className="section-header text-center">
            <p className="section-category">About Satyam Residency</p>
            <h2 className="serif">Experience Luxury & Comfort</h2>
          </div>
          <div className="about-card">
            <p className="about-text">{config.hotel.aboutText}</p>

            <div className="highlights-grid mt-4">
              <div className="highlight-item">
                <span className="highlight-icon">📍</span>
                <div>
                  <strong>Prime Location</strong>
                  <p>Gajapati Junction, heart of Rayagada</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📶</span>
                <div>
                  <strong>High-Speed Wi-Fi</strong>
                  <p>Seamless connectivity for work & leisure</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🛎</span>
                <div>
                  <strong>24/7 Service</strong>
                  <p>Dedicated reception & hospitality staff</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🛏</span>
                <div>
                  <strong>Refined Comfort</strong>
                  <p>Pristine, spacious & air-conditioned rooms</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Hotel Photo Gallery (Upload Ready) */}
        <section id="gallery" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">Hotel Showcase</p>
            <h2 className="serif">Photo Gallery</h2>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Explore our accommodations & hotel spaces. Tap any image to expand.</p>
          </div>

          <div className="gallery-grid">
            {config.gallery.map((img) => (
              <div
                key={img.id}
                className="gallery-card"
                onClick={() => setActiveImage(img)}
              >
                <div className="gallery-img-wrapper">
                  <img src={img.url} alt={img.title} loading="lazy" className="gallery-img" />
                  <span className="gallery-badge">{img.category}</span>
                </div>
                <div className="gallery-info">
                  <h3 className="gallery-title">{img.title}</h3>
                  <p className="gallery-caption">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Booking & Rooms */}
        <section id="booking" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">Reserve Your Stay</p>
            <h2 className="serif">Our Accommodations</h2>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Choose your ideal room and book instantly with secure online options.</p>
          </div>

          <div className="flex-column">
            {config.roomTypes.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onBook={(selected) => {
                  if (!user) {
                    setSelectedRoom(selected);
                    setShowSignupModal(true);
                  } else {
                    setSelectedRoom(selected);
                  }
                }}
              />
            ))}
          </div>
        </section>

        {/* Section 5: Reviews */}
        <section id="reviews" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">Guest Testimonials</p>
            <h2 className="serif">What Our Guests Say</h2>
          </div>

          <div className="reviews-grid">
            {config.reviews.map((rev, index) => (
              <div key={index} className="review-card">
                <div className="stars">★★★★★</div>
                <p className="review-quote">"{rev.text}"</p>
                <p className="review-author">— {rev.author}</p>
              </div>
            ))}
          </div>

          <div className="testimonial mt-4">
            "{config.testimonial.text}"
            <span className="testimonial-author">{config.testimonial.author}</span>
          </div>
        </section>

        {/* Section 6: Contact & Management */}
        <section id="contact" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">Get In Touch</p>
            <h2 className="serif">Contact Us</h2>
          </div>

          <div className="contact-card">
            <div className="contact-info-block">
              <h3>📍 Location & Address</h3>
              <p>{config.hotel.address}</p>
            </div>

            <div className="contact-info-block">
              <h3>📞 Reception & Reservations</h3>
              <p>Phone: <a href={`tel:${config.hotel.receptionPhone}`}>{config.hotel.receptionPhone}</a></p>
              <p>Email: <a href={`mailto:${config.hotel.email}`}>{config.hotel.email}</a></p>
            </div>

            <div className="contact-info-block">
              <h3>👔 Hotel Management</h3>
              {config.hotel.owners.map((owner, idx) => (
                <p key={idx}>{owner.name}: <a href={`tel:${owner.phone.replace(/\s+/g, '')}`}>{owner.phone}</a></p>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer" role="contentinfo">
          <h3 className="serif mb-4">{config.hotel.name}</h3>
          <p>{config.hotel.address}</p>
          <p>Email: {config.hotel.email} | Reception: {config.hotel.receptionPhone}</p>
          <p className="mt-4" style={{ fontSize: '12px', opacity: 0.5 }}>
            © {new Date().getFullYear()} {config.hotel.name}. All Rights Reserved. 
            <span style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={() => setShowAdmin(true)}>🛡</span>
            <span style={{ cursor: 'pointer', marginLeft: '10px', opacity: 0.4 }} onClick={() => (window.location.href = '/reception')}>Reception</span>
          </p>
          <FooterLegalLinks onOpenLegal={openLegal} />
        </footer>
      </div>

      {/* Lightbox Image Preview Modal */}
      {activeImage && (
        <div className="lightbox-overlay" onClick={() => setActiveImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActiveImage(null)}>×</button>
            <img src={activeImage.url} alt={activeImage.title} className="lightbox-img" />
            <div className="lightbox-caption">
              <h3>{activeImage.title}</h3>
              <p>{activeImage.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedRoom && user && (
        <BookingModal 
          room={selectedRoom} 
          onClose={() => setSelectedRoom(null)} 
        />
      )}

      {/* Sign Up Modal */}
      {showSignupModal && (
        <SignupModal 
          onComplete={(newUser) => {
            setUser(newUser);
            setShowSignupModal(false);
          }} 
          onOpenLegal={openLegal}
        />
      )}

      {/* Cookie Banner */}
      <CookieConsentBanner onOpenLegal={openLegal} />

      {/* Legal Page Viewer */}
      {activeLegalPage && (
        <LegalPageViewer pageKey={activeLegalPage} onClose={closeLegal} />
      )}

      {/* Global Fixed Live Ticker */}
      <LiveRoomTracker />
    </>
  );
}

export default App;