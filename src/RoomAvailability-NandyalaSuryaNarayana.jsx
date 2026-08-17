import { useEffect, useState } from "react";

export function RoomAvailability() {
    const [availability, setAvailability] = useState([]);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);

        async function load() {
            try {
                const res = await fetch(`/api/room-counts?date=${today}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailability(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to load availability", err);
            }
        }

        load();
        const timer = setInterval(load, 10000); // refresh every 10s
        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            {availability.map((r) => (
                <p key={r.room_type_id}>
                    {r.name} rooms remaining: <strong>{r.remaining_rooms}</strong>
                </p>
            ))}
        </div>
    );
}