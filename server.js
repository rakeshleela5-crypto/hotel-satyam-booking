import { Hono } from 'hono';

const app = new Hono();

// Utility to create or find a user
async function getOrCreateUser(db, { name, phone }) {
  const existing = await db.prepare('SELECT user_id FROM users WHERE phone = ?').bind(phone).first();
  if (existing) return existing.user_id;
  
  const userId = `U-${Math.floor(1000 + Math.random() * 9000)}`;
  // Note: Since email is unique and required in schema, we'll generate a dummy one if none provided
  const dummyEmail = `user${userId}@hotelsatyam.local`;
  
  await db.prepare('INSERT INTO users (user_id, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, name, dummyEmail, phone, 'guest').run();
  
  return userId;
}

app.post('/api/bookRoom', async (c) => {
  const db = c.env.DB;
  const payload = await c.req.json();
  const { roomType, checkIn, checkOut, name, phone, guests } = payload;
  const bookingId = `B-${Math.floor(10000 + Math.random() * 90000)}`;
  
  if (!db) {
    console.warn("D1 database not bound. Using mock response.");
    return c.json({ success: true, bookingId, mock: true });
  }
  
  try {
    const userId = await getOrCreateUser(db, { name, phone });
    
    // Map frontend roomType (like 'standard', 'deluxe') to room_type_id if necessary
    // For now we assume roomType is passed properly or we fallback to RT-STD
    let mappedRoomTypeId = 'RT-STD';
    if (roomType.toLowerCase().includes('deluxe')) mappedRoomTypeId = 'RT-DLX';
    else if (roomType.toLowerCase().includes('suite')) mappedRoomTypeId = 'RT-FAM';
    
    // Find an available room
    const room = await db.prepare(`SELECT room_id, base_price FROM rooms JOIN room_types USING (room_type_id) WHERE room_type_id = ? AND room_status = 'available' LIMIT 1`).bind(mappedRoomTypeId).first();
    
    const roomId = room ? room.room_id : 'RM-101'; // fallback if no available rooms in demo
    const basePrice = room ? room.base_price : 2000.00;
    
    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalAmount = nights * basePrice;

    await db.prepare(`
      INSERT INTO bookings (booking_id, user_id, hotel_id, room_id, check_in, check_out, nights, adults, children, total_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(bookingId, userId, 'H-001', roomId, checkIn, checkOut, nights, parseInt(guests) || 1, 0, totalAmount).run();
    
    return c.json({ success: true, bookingId });
  } catch (error) {
    console.error("Booking error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/joinWaitlist', async (c) => {
  const db = c.env.DB;
  const payload = await c.req.json();
  const { roomType, preferredDates, name, phone } = payload;

  if (!db) {
    console.warn("D1 database not bound. Using mock response.");
    return c.json({ success: true, mock: true });
  }
  
  try {
    const userId = await getOrCreateUser(db, { name, phone });
    const waitlistId = `W-${Math.floor(1000 + Math.random() * 9000)}`;
    
    await db.prepare(`
      INSERT INTO waitlist (waitlist_id, user_id, hotel_id, room_type_id, preferred_dates) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(waitlistId, userId, 'H-001', roomType, preferredDates).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
