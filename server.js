import { Hono } from 'hono';

const app = new Hono();

// Utility to create or find a user
async function getOrCreateUser(db, { name, phone }) {
  const existing = await db.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
  if (existing) return existing.id;
  
  const result = await db.prepare('INSERT INTO users (name, phone) VALUES (?, ?) RETURNING id')
    .bind(name, phone).first();
  return result.id;
}

app.post('/api/bookRoom', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database binding 'DB' not found" }, 500);
  }
  
  const payload = await c.req.json();
  const { roomType, checkIn, checkOut, name, phone, guests } = payload;
  
  try {
    const userId = await getOrCreateUser(db, { name, phone });
    const bookingId = `HS-${Math.floor(10000 + Math.random() * 90000)}`;
    
    await db.prepare(`
      INSERT INTO bookings (id, user_id, room_type, check_in, check_out, guests) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(bookingId, userId, roomType, checkIn, checkOut, guests).run();
    
    return c.json({ success: true, bookingId });
  } catch (error) {
    console.error("Booking error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/joinWaitlist', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database binding 'DB' not found" }, 500);
  }
  
  const payload = await c.req.json();
  const { roomType, preferredDates, name, phone } = payload;
  
  try {
    const userId = await getOrCreateUser(db, { name, phone });
    
    await db.prepare(`
      INSERT INTO waitlist (user_id, room_type, preferred_dates) 
      VALUES (?, ?, ?)
    `).bind(userId, roomType, preferredDates).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
