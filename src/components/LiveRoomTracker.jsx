import React, { useEffect, useState } from 'react';

export function LiveRoomTracker() {
  const [roomData, setRoomData] = useState({
    total: '-76-',
    booked: '--',
    available: '--'
  });

  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    let isMounted = true;

    const updateTime = () => {
      if (isMounted) {
        setCurrentTime(new Date());
      }
    };

    const loadRoomStatus = async () => {
      try {
        const response = await fetch('/api/rooms');

        if (!response.ok) {
          throw new Error(
            `Room request failed with status ${response.status}`
          );
        }

        const data = await response.json();
        const rooms = Array.isArray(data.rooms)
          ? data.rooms
          : [];

        const total = rooms.reduce((sum, roomType) => {
          const roomCount = Number(
            roomType.room_count ||
            roomType.total_rooms ||
            roomType.total ||
            0
          );

          return sum + roomCount;
        }, 0);

        if (isMounted) {
          setRoomData({
            total: total || rooms.length,
            booked: '--',
            available: rooms.length
              ? rooms.length
              : '--'
          });
        }
      } catch (error) {
        console.error(
          'Could not load room status:',
          error
        );

        if (isMounted) {
          setRoomData({
            total: '--',
            booked: '--',
            available: '--'
          });
        }
      }
    };

    updateTime();
    loadRoomStatus();

    const timerId = setInterval(updateTime, 1000);
    const roomRefreshId = setInterval(
      loadRoomStatus,
      60000
    );

    return () => {
      isMounted = false;
      clearInterval(timerId);
      clearInterval(roomRefreshId);
    };
  }, []);

  const timeString = currentTime.toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  );

  return (
    <div className="live-ticker-bar">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          <span className="live-indicator-small" />

          <span className="ticker-title">
            LIVE STATUS &bull; {timeString}
          </span>

          <span className="ticker-divider">|</span>

          <span className="ticker-item">
            Total Rooms:{' '}
            <strong>{roomData.total}</strong>
          </span>

          <span className="ticker-divider">|</span>

          <span className="ticker-item booked">
            Booked:{' '}
            <strong>{roomData.booked}</strong>
          </span>

          <span className="ticker-divider">|</span>

          <span className="ticker-item available">
            Available:{' '}
            <strong>{roomData.available}</strong>
          </span>

          <span
            style={{ marginLeft: '50px' }}
            className="live-indicator-small"
          />

          <span className="ticker-title">
            LIVE STATUS &bull; {timeString}
          </span>

          <span className="ticker-divider">|</span>

          <span className="ticker-item">
            Total Rooms:{' '}
            <strong>{roomData.total}</strong>
          </span>

          <span className="ticker-divider">|</span>

          <span className="ticker-item booked">
            Booked:{' '}
            <strong>{roomData.booked}</strong>
          </span>

          <span className="ticker-divider">|</span>

          <span className="ticker-item available">
            Available:{' '}
            <strong>{roomData.available}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}