import React, { useState, useEffect } from 'react';
import { config } from './config';
import { RoomCard } from './components/RoomCard';
import { BookingModal } from './components/BookingModal';
import { SignupModal } from './components/SignupModal';
import { PaymentPage } from './components/PaymentPage';
import { Button } from './components/Button';
import './index.css';

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('satyam_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsInitializing(false);
  }, []);

  if (isInitializing) return null;

  return (
    <>
      {!user && <SignupModal onComplete={setUser} />}
      <header className="hero">
        <h1>{config.hotel.name}</h1>
        <p>{config.hotel.tagline}</p>
      </header>
      
      <main className="container">
        <div className="text-center mb-6">
          <p style={{ color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '8px' }}>
            Book Your Stay
          </p>
          <h2 className="serif">Our Accommodations</h2>
        </div>
        
        <div className="flex-column">
          {config.roomTypes.map(room => (
            <RoomCard 
              key={room.id} 
              room={room} 
              onBook={setSelectedRoom} 
            />
          ))}
        </div>

        <div className="testimonial">
          "{config.testimonial.text}"
          <span className="testimonial-author">{config.testimonial.author}</span>
        </div>
      </main>

      <footer className="footer">
        <h3 className="serif mb-4">{config.hotel.name}</h3>
        <p>Owner: {config.hotel.ownerName}</p>
        <p>Contact: {config.hotel.phone}</p>
        <p>{config.hotel.email}</p>
        <p className="mt-4" style={{ fontSize: '12px', opacity: 0.5 }}>
          © {new Date().getFullYear()} {config.hotel.name}. All rights reserved.
        </p>
      </footer>

      {selectedRoom && (
        <BookingModal 
          room={selectedRoom} 
          onClose={() => setSelectedRoom(null)} 
        />
      )}
    </>
  );
}

export default App;
