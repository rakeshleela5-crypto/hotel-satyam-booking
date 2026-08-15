import React, {
  useEffect,
  useState,
  Suspense,
  lazy
} from 'react';

import { config } from './config';
import { RoomCard } from './components/RoomCard';
import { BookingModal } from './components/BookingModal';
import { SignupModal } from './components/SignupModal';

import {
  LegalPageViewer,
  CookieConsentBanner,
  FooterLegalLinks
} from './components/LegalPages';

import { LiveRoomTracker } from './components/LiveRoomTracker';
import './index.css';

const AdminRoute = lazy(() =>
  import('./components/AdminRoute').then((module) => ({
    default: module.AdminRoute
  }))
);

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeLegalPage, setActiveLegalPage] = useState(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('satyam_user');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Could not load saved user:', error);
      localStorage.removeItem('satyam_user');
    }

    if (window.location.pathname === '/admin') {
      setShowAdmin(true);
    }

    setIsInitializing(false);
  }, []);

  const openLegal = (pageKey) => {
    setActiveLegalPage(pageKey);
  };

  const closeLegal = () => {
    setActiveLegalPage(null);
  };

  const handleSignOut = () => {
    localStorage.removeItem('satyam_user');
    setUser(null);
    setSelectedRoom(null);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleRoomBooking = (room) => {
    setSelectedRoom(room);

    if (!user) {
      setShowSignupModal(true);
    }
  };

  const handleSignupComplete = (newUser) => {
    localStorage.setItem(
      'satyam_user',
      JSON.stringify(newUser)
    );

    setUser(newUser);
    setShowSignupModal(false);
  };

  const handleAdminBack = () => {
    setShowAdmin(false);
    window.history.replaceState(null, '', '/');
  };

  if (isInitializing) {
    return null;
  }

  if (showAdmin) {
    return (
      <Suspense
        fallback={
          <div
            className="section container"
            style={{
              padding: '40px 20px',
              minHeight: '100vh',
              background: 'var(--background-color)',
              textAlign: 'center'
            }}
          >
            <p>Loading Secure Dashboard...</p>
          </div>
        }
      >
        <AdminRoute onBack={handleAdminBack} />
      </Suspense>
    );
  }

  return (
    <>
      <nav
        className="navbar"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="navbar-container">
          <a
            href="#home"
            className="nav-brand serif"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('home');
            }}
          >
            Satyam Residency
          </a>

          <div className="nav-links">
            <a
              href="#home"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('home');
              }}
            >
              Home
            </a>

            <a
              href="#about"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('about');
              }}
            >
              About
            </a>

            <a
              href="#gallery"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('gallery');
              }}
            >
              Gallery
            </a>
            <a
              href="#booking"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('booking');
              }}
            >
              Rooms
            </a>

            <a
              href="#reviews"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('reviews');
              }}
            >
              Reviews
            </a>

            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                scrollToSection('contact');
              }}
            >
              Contact
            </a>
          </div>

          <div className="nav-user">
            {user ? (
              <div className="user-badge flex-row gap-2">
                <span className="user-name">
                  Hello, {user.name}
                </span>

                <button
                  type="button"
                  className="btn-small-secondary"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-small-primary"
                onClick={() => {
                  setSelectedRoom(null);
                  setShowSignupModal(true);
                }}
              >
                Sign Up
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="app-wrapper">
        <header id="home" className="hero-section">
          <div className="hero-overlay">
            <p className="hero-subhead">
              Welcome to Rayagada&apos;s Finest
            </p>

            <h1 className="hero-title serif">
              {config.hotel.name}
            </h1>

            <p className="hero-tagline">
              {config.hotel.subtitle}
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn btn-primary hero-btn"
                onClick={() => scrollToSection('booking')}
              >
                Book Your Stay
              </button>

              <button
                type="button"
                className="btn btn-secondary hero-btn"
                onClick={() => scrollToSection('gallery')}
              >
                View Hotel Gallery
              </button>
            </div>
          </div>
        </header>

        <section id="about" className="section container">
          <div className="section-header text-center">
            <p className="section-category">
              About Satyam Residency
            </p>

            <h2 className="serif">
              Experience Luxury &amp; Comfort
            </h2>
          </div>

          <div className="about-card">
            <p className="about-text">
              {config.hotel.aboutText}
            </p>

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
                  <p>
                    Seamless connectivity for work &amp; leisure
                  </p>
                </div>
              </div>

              <div className="highlight-item">
                <span className="highlight-icon">🛎</span>

                <div>
                  <strong>24/7 Service</strong>
                  <p>
                    Dedicated reception &amp; hospitality staff
                  </p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🛏</span>

                <div>
                  <strong>Refined Comfort</strong>
                  <p>
                    Pristine, spacious &amp; air-conditioned rooms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">Hotel Showcase</p>

            <h2 className="serif">Photo Gallery</h2>

            <p
              style={{
                fontSize: '13px',
                marginTop: '4px'
              }}
            >
              Explore our accommodations &amp; hotel spaces. Tap any
              image to expand.
            </p>
          </div>

          <div className="gallery-grid">
            {config.gallery.map((image) => (
              <div
                key={image.id}
                className="gallery-card"
                onClick={() => setActiveImage(image)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    setActiveImage(image);
                  }
                }}
              >
                <div className="gallery-img-wrapper">
                  <img
                    src={image.url}
                    alt={image.title}
                    loading="lazy"
                    className="gallery-img"
                  />

                  <span className="gallery-badge">
                    {image.category}
                  </span>
                </div>

                <div className="gallery-info">
                  <h3 className="gallery-title">
                    {image.title}
                  </h3>

                  <p className="gallery-caption">
                    {image.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="booking" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">
              Reserve Your Stay
            </p>

            <h2 className="serif">Our Accommodations</h2>

            <p
              style={{
                fontSize: '14px',
                marginTop: '4px'
              }}
            >
              Choose your ideal room and book instantly with secure
              online options.
            </p>
          </div>

          <div className="flex-column">
            {config.roomTypes.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onBook={handleRoomBooking}
              />
            ))}
          </div>
        </section>

        <section id="reviews" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">
              Guest Testimonials
            </p>

            <h2 className="serif">What Our Guests Say</h2>
          </div>

          <div className="reviews-grid">
            {config.reviews.map((review, index) => (
              <div
                key={index}
                className="review-card"
              >
                <div className="stars">★★★★★</div>

                <p className="review-quote">
                  &quot;{review.text}&quot;
                </p>

                <p className="review-author">
                  — {review.author}
                </p>
              </div>
            ))}
          </div>

          <div className="testimonial mt-4">
            &quot;{config.testimonial.text}&quot;

            <span className="testimonial-author">
              {config.testimonial.author}
            </span>
          </div>
        </section>
        <section id="contact" className="section container">
          <div className="section-header text-center mb-6">
            <p className="section-category">
              Get In Touch
            </p>

            <h2 className="serif">Contact Us</h2>
          </div>

          <div className="contact-card">
            <div className="contact-info-block">
              <h3>📍 Location &amp; Address</h3>
              <p>{config.hotel.address}</p>
            </div>

            <div className="contact-info-block">
              <h3>📞 Reception &amp; Reservations</h3>

              <p>
                Phone:{' '}
                <a href={`tel:${config.hotel.receptionPhone}`}>
                  {config.hotel.receptionPhone}
                </a>
              </p>

              <p>
                Email:{' '}
                <a href={`mailto:${config.hotel.email}`}>
                  {config.hotel.email}
                </a>
              </p>
            </div>

            <div className="contact-info-block">
              <h3>👔 Hotel Management</h3>

              {config.hotel.owners.map((owner, index) => (
                <p key={index}>
                  {owner.name}:{' '}
                  <a href={`tel:${owner.phone.replace(/\s+/g, '')}`}>
                    {owner.phone}
                  </a>
                </p>
              ))}
            </div >
          </div >
        </section >

        <footer
          className="footer"
          role="contentinfo"
        >
          <h3 className="serif mb-4">
            {config.hotel.name}
          </h3>

          <p>{config.hotel.address}</p>

          <p>
            Email: {config.hotel.email} | Reception:{' '}
            {config.hotel.receptionPhone}
          </p>

          <p
            className="mt-4"
            style={{
              fontSize: '12px',
              opacity: 0.5
            }}
          >
            © {new Date().getFullYear()}{' '}
            {config.hotel.name}. All Rights Reserved.

            <span
              style={{
                cursor: 'pointer',
                marginLeft: '10px'
              }}
              onClick={() => setShowAdmin(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setShowAdmin(true);
                }
              }}
            >
              🛡
            </span>

            <span
              style={{
                cursor: 'pointer',
                marginLeft: '10px',
                opacity: 0.4
              }}
              onClick={() => {
                window.location.href = '/reception';
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  window.location.href = '/reception';
                }
              }}
            >
              Reception
            </span>
          </p>

          <FooterLegalLinks
            onOpenLegal={openLegal}
          />
        </footer>
      </div >

      {activeImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setActiveImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
        >
          <div
            className="lightbox-content"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setActiveImage(null)}
              aria-label="Close image preview"
            >
              ×
            </button>

            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="lightbox-img"
            />
            <div className="lightbox-caption">
              <h3>{activeImage.title}</h3>
              <p>{activeImage.caption}</p>
            </div>
          </div>
        </div>
      )
      }

      {
        selectedRoom && user && (
          <BookingModal
            room={selectedRoom}
            user={user}
            onClose={() => setSelectedRoom(null)}
          />
        )
      }

      {
        showSignupModal && (
          <SignupModal
            onComplete={handleSignupComplete}
            onOpenLegal={openLegal}
          />
        )
      }

      <CookieConsentBanner
        onOpenLegal={openLegal}
      />

      {
        activeLegalPage && (
          <LegalPageViewer
            pageKey={activeLegalPage}
            onClose={closeLegal}
          />
        )
      }

      <LiveRoomTracker />
    </>
  );
}

export default App;