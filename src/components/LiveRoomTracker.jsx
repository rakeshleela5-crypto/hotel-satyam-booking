import React, { useState, useEffect } from 'react';

export function LiveRoomTracker() {
  const [roomData, setRoomData] = useState({ total: '--', booked: '--', available: '--' });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Timer for live time
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // SSE connection for live rooms
    const liveRoomsSource = new EventSource('/api/live-rooms');

    liveRoomsSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setRoomData(data);
      } catch (error) {
        console.error("Error parsing live stream data:", error);
      }
    };

    liveRoomsSource.onerror = (err) => {
      console.error("SSE Connection failed.", err);
    };

    return () => {
      clearInterval(timerId);
      liveRoomsSource.close();
    };
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="live-ticker-bar">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          <span className="live-indicator-small"></span>
          <span className="ticker-title">LIVE STATUS &bull; {timeString}</span>
          <span className="ticker-divider">|</span>
          <span className="ticker-item">Total Rooms: <strong>{roomData.total}</strong></span>
          <span className="ticker-divider">|</span>
          <span className="ticker-item booked">Booked: <strong>{roomData.booked}</strong></span>
          <span className="ticker-divider">|</span>
          <span className="ticker-item available">Available: <strong>{roomData.available}</strong></span>
          
          {/* Duplicate content for seamless scrolling */}
          <span style={{ marginLeft: '50px' }} className="live-indicator-small"></span>
          <span className="ticker-title">LIVE STATUS &bull; {timeString}</span>
          <span className="ticker-divider">|</span>
          <span className="ticker-item">Total Rooms: <strong>{roomData.total}</strong></span>
          <span className="ticker-divider">|</span>
          <span className="ticker-item booked">Booked: <strong>{roomData.booked}</strong></span>
          <span className="ticker-divider">|</span>
          <span className="ticker-item available">Available: <strong>{roomData.available}</strong></span>
        </div>
      </div>
    </div>
  );
}
