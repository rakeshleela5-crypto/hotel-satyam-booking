import React from 'react';
import { Button } from './Button';

export function RoomCard({ room, onBook }) {
  const formatCurrency = (amount) => `₹${Math.round(amount)}`;

  return (
    <div className="card">
      <div className="flex-row justify-between" style={{ marginBottom: 12 }}>
        <h3>{room.name}</h3>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-color)' }}>
          {formatCurrency(room.price)} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>/ night</span>
        </div>
      </div>
      
      <p style={{ marginBottom: 16 }}>{room.description}</p>
      
      <div style={{ marginBottom: 16 }}>
        {room.amenities.map(amenity => (
          <span key={amenity} className="chip">{amenity}</span>
        ))}
      </div>
      
      <Button onClick={() => onBook(room)}>Select Dates</Button>
    </div>
  );
}
