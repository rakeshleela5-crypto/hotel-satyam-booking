import { useEffect, useState } from "react";

export function RoomAvailability() {
    const [availability, setAvailability] = useState([]);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);

        async function load() {
            const res = await fetch(`/api/availability?date=${today}`);
            const data = await res.json();
            setAvailability(data);
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