import { Hono } from 'hono';

const app = new Hono();

// Admin Authentication Middleware
app.use('/api/admin/*', async (c, next) => {
  // Skip auth for login
  if (c.req.path === '/api/admin/login') {
    return next();
  }

  const token = c.req.query('token');
  const correctPassword = c.env.ADMIN_PASSWORD;

  if (!correctPassword || token !== correctPassword) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return next();
});

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
    
    // Map frontend roomType (like 'standard', 'deluxe') to room_type_id
    let mappedRoomTypeId = 'RT-STD';
    if (roomType.toLowerCase().includes('deluxe')) mappedRoomTypeId = 'RT-DLX';
    else if (roomType.toLowerCase().includes('suite')) mappedRoomTypeId = 'RT-BSN'; // Business/Executive Suite
    
    // Find an available room
    const room = await db.prepare(`SELECT room_id, base_price FROM rooms JOIN room_types USING (room_type_id) WHERE room_type_id = ? AND room_status = 'available' LIMIT 1`).bind(mappedRoomTypeId).first();
    
    if (!room) {
      throw new Error(`No available rooms found for the selected category. Please join the waitlist.`);
    }
    
    const roomId = room.room_id;
    const basePrice = room.base_price || 2000.00;
    
    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalAmount = nights * basePrice;

    await db.prepare(`
      INSERT INTO bookings (booking_id, user_id, hotel_id, room_id, check_in, check_out, nights, adults, children, total_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(bookingId, userId, 'H-001', roomId, checkIn, checkOut, nights, parseInt(guests) || 1, 0, totalAmount).run();
    
    // Trigger AI Fraud Check
    c.executionCtx.waitUntil(runFraudCheck(c.env, bookingId, {
      name, phone, roomType, checkIn, checkOut, guests, nights, totalAmount, paymentMethod: 'pay-at-hotel'
    }));

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
    
    // Map frontend roomType to database room_type_id
    let mappedRoomTypeId = 'RT-STD';
    if (roomType.toLowerCase().includes('deluxe')) mappedRoomTypeId = 'RT-DLX';
    else if (roomType.toLowerCase().includes('suite')) mappedRoomTypeId = 'RT-BSN';
    
    await db.prepare(`
      INSERT INTO waitlist (waitlist_id, user_id, hotel_id, room_type_id, preferred_dates) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(waitlistId, userId, 'H-001', mappedRoomTypeId, preferredDates).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/signup', async (c) => {
  const db = c.env.DB;
  const payload = await c.req.json();
  const { name, email, phone } = payload;

  if (!db) {
    console.warn("D1 database not bound. Using mock response.");
    return c.json({ success: true, mock: true });
  }

  try {
    const existingUser = await db.prepare('SELECT user_id FROM users WHERE email = ? OR phone = ?').bind(email, phone).first();
    if (existingUser) {
      return c.json({ success: true, userId: existingUser.user_id, message: "User already exists, logged in!" });
    }

    const userId = `U-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.prepare('INSERT INTO users (user_id, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, name, email, phone, 'guest').run();

    return c.json({ success: true, userId });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/live-rooms', (c) => {
  const db = c.env.DB;
  
  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  };

  const { writable, readable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendAvailabilityUpdates = async () => {
    try {
      let total = 200;
      let booked = 0;
      if (db) {
        const metrics = await db.prepare(`
          SELECT 
            (SELECT COUNT(*) FROM rooms) as total_rooms,
            (SELECT COUNT(*) FROM bookings WHERE booking_status = 'confirmed') as booked_rooms
        `).first();
        if (metrics) {
          total = metrics.total_rooms || 200;
          booked = metrics.booked_rooms || 0;
        }
      }
      const available = total - booked;
      const payload = { total, booked, available };
      
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    } catch (err) {
      console.error("D1 Streaming Error:", err);
    }
  };

  // Send initial data immediately upon connecting
  sendAvailabilityUpdates();

  // Poll the database every 10 seconds to push updates down the stream
  const intervalId = setInterval(sendAvailabilityUpdates, 10000);

  // Clean up database interval if client closes the tab / drops connection
  c.req.raw.signal.addEventListener("abort", () => {
    clearInterval(intervalId);
    writer.close().catch(() => {});
  });

  return new Response(readable, { headers: responseHeaders });
});

// Add Crypto helper for Node / Cloudflare Workers to verify Razorpay signature
async function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify', 'sign']
  );
  
  const data = encoder.encode(orderId + "|" + paymentId);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return expectedSignature === signature;
}

// Background AI Fraud Detection
async function runFraudCheck(env, bookingId, bookingData) {
  const prompt = `You are an AI-powered fraud detection agent for Satyam Residency.
Your job is to analyze incoming online room reservations and determine whether they are legitimate or suspicious. 

PARAMETERS TO CHECK:
1. RESERVATION SCOPE: Flag >7 consecutive nights, or guests exceeding room capacity (max 3 for Standard/Deluxe, 4 for Suite).
2. PAYMENT METHOD: Flag if "pay-at-hotel" AND value > ₹10,000. Flag if "pay-at-hotel" is used for same-day check-in at unusual hours. Note: razorpay is lower risk.
3. CONTACT DETAILS: Flag phone not exactly 10 digits or repeated sequences (e.g. 9999999999). Flag test names (e.g. "test", "asdf").

RESPONSE FORMAT:
STATUS: ✅ SAFE or 🚨 FLAGGED
RISK LEVEL: Low / Medium / High
REASON: [Clear specific explanation]
RECOMMENDATION: [Action to take]

IMPORTANT RULES:
- Always be decisive. No "maybe".
- If even one parameter is highly suspicious, flag it.
- Keep response under 6 lines.

BOOKING DETAILS TO ANALYZE:
Name: ${bookingData.name}
Phone: ${bookingData.phone}
Room Type: ${bookingData.roomType}
Check In: ${bookingData.checkIn}
Check Out: ${bookingData.checkOut}
Guests: ${bookingData.guests}
Nights: ${bookingData.nights}
Total Amount: ₹${bookingData.totalAmount}
Payment Method: ${bookingData.paymentMethod}`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a precise fraud detection AI.' },
        { role: 'user', content: prompt }
      ]
    });

    const aiOutput = response.response;
    let status = 'SAFE';
    if (aiOutput.includes('🚨 FLAGGED') || aiOutput.includes('FLAGGED') || aiOutput.includes('High')) {
      status = 'FLAGGED';
    }

    await env.DB.prepare(`UPDATE bookings SET fraud_status = ?, fraud_reason = ? WHERE booking_id = ?`)
      .bind(status, aiOutput, bookingId).run();
      
  } catch (err) {
    console.error("Fraud Check Failed:", err);
  }
}

app.post('/api/createOrder', async (c) => {
  const db = c.env.DB;
  const payload = await c.req.json();
  const { roomType, checkIn, checkOut, name, phone, guests } = payload;
  const bookingId = `B-${Math.floor(10000 + Math.random() * 90000)}`;
  
  try {
    const userId = await getOrCreateUser(db, { name, phone });
    let mappedRoomTypeId = 'RT-STD';
    if (roomType.toLowerCase().includes('deluxe')) mappedRoomTypeId = 'RT-DLX';
    else if (roomType.toLowerCase().includes('suite')) mappedRoomTypeId = 'RT-BSN';
    
    const room = await db.prepare(`SELECT room_id, base_price FROM rooms JOIN room_types USING (room_type_id) WHERE room_type_id = ? AND room_status = 'available' LIMIT 1`).bind(mappedRoomTypeId).first();
    
    if (!room) throw new Error(`No available rooms found for the selected category. Please join the waitlist.`);
    
    const roomId = room.room_id;
    const basePrice = room.base_price || 2000.00;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalAmount = nights * basePrice;
    
    // Create Pending Booking in D1
    await db.prepare(`
      INSERT INTO bookings (booking_id, user_id, hotel_id, room_id, check_in, check_out, nights, adults, children, total_amount, booking_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(bookingId, userId, 'H-001', roomId, checkIn, checkOut, nights, parseInt(guests) || 1, 0, totalAmount).run();

    // Trigger AI Fraud Check
    c.executionCtx.waitUntil(runFraudCheck(c.env, bookingId, {
      name, phone, roomType, checkIn, checkOut, guests, nights, totalAmount, paymentMethod: 'razorpay'
    }));

    // Call Razorpay API to create an order
    const keyId = c.env.RAZORPAY_KEY_ID;
    const keySecret = c.env.RAZORPAY_KEY_SECRET;
    
    const amountInPaise = totalAmount * 100;
    
    if (!keyId || !keySecret) {
      // Mock order if keys are missing (for local testing before user sets keys)
      return c.json({ 
        success: true, 
        bookingId, 
        orderId: `mock_order_${Date.now()}`,
        amount: amountInPaise 
      });
    }

    const rzpAuth = btoa(`${keyId}:${keySecret}`);
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${rzpAuth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: bookingId
      })
    });

    if (!rzpResponse.ok) {
      const errorText = await rzpResponse.text();
      console.error("Razorpay Error:", errorText);
      throw new Error('Failed to create Razorpay Order');
    }

    const orderData = await rzpResponse.json();
    return c.json({ success: true, bookingId, orderId: orderData.id, amount: amountInPaise, keyId: keyId });
    
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/verifyPayment', async (c) => {
  const db = c.env.DB;
  const payload = await c.req.json();
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = payload;
  const keySecret = c.env.RAZORPAY_KEY_SECRET;
  
  try {
    // If no secret is configured, we bypass strict verification (Mock Mode)
    if (keySecret && !razorpay_order_id.startsWith('mock_')) {
      const isValid = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
      if (!isValid) {
        throw new Error('Invalid Payment Signature');
      }
    }

    // Mark Booking as Confirmed
    await db.prepare(`UPDATE bookings SET booking_status = 'confirmed' WHERE booking_id = ?`).bind(bookingId).run();
    
    // Insert Payment Record
    const paymentRecordId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Fetch total_amount to record in payments
    const booking = await db.prepare(`SELECT total_amount, user_id FROM bookings WHERE booking_id = ?`).bind(bookingId).first();
    
    if (booking) {
      await db.prepare(`
        INSERT INTO payments (payment_id, booking_id, amount, payment_method, payment_status, transaction_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(paymentRecordId, bookingId, booking.total_amount, 'razorpay', 'completed', razorpay_payment_id || 'mock_txn').run();
    }
    
    return c.json({ success: true, bookingId });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/admin/bookings', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "DB not found" }, 500);
  
  try {
    const { results } = await db.prepare(`
      SELECT b.booking_id, b.check_in, b.check_out, b.nights, b.total_amount, b.booking_status, b.fraud_status, b.fraud_reason, u.full_name, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      ORDER BY b.booking_id DESC
      LIMIT 50
    `).all();
    
    return c.json({ success: true, bookings: results });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/admin/walkins', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "DB not found" }, 500);
  
  const url = new URL(c.req.url);
  const dateStr = url.searchParams.get('date');
  
  try {
    let query = `
      SELECT b.booking_id, b.check_in, b.check_out, b.nights, b.total_amount, b.booking_status, u.full_name, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.source = 'walkin'
    `;
    let params = [];
    
    if (dateStr) {
      query += ` AND date(b.check_in) = date(?)`;
      params.push(dateStr);
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT 50`;
    
    const stmt = db.prepare(query).bind(...params);
    const { results } = await stmt.all();
    
    return c.json({ success: true, walkins: results || [] });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/admin/online-bookings', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "DB not found" }, 500);
  
  const url = new URL(c.req.url);
  const dateStr = url.searchParams.get('date');
  
  try {
    let query = `
      SELECT b.booking_id, b.check_in, b.check_out, b.nights, b.total_amount, b.booking_status, u.full_name, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.source != 'walkin' OR b.source IS NULL
    `;
    let params = [];
    
    if (dateStr) {
      query += ` AND date(b.check_in) = date(?)`;
      params.push(dateStr);
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT 50`;
    
    const stmt = db.prepare(query).bind(...params);
    const { results } = await stmt.all();
    
    return c.json({ success: true, bookings: results || [] });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/admin/revenue-trend', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: "DB not found" }, 500);

  const url = new URL(c.req.url);
  const daysParam = url.searchParams.get('days') || '7';
  const days = Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 90);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  const startDateStr = startDate.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  try {
    const { results } = await db.prepare(`
      SELECT date(check_in) as date, total_amount, source
      FROM bookings
      WHERE date(check_in) >= ? AND date(check_in) <= ?
    `).bind(startDateStr, todayStr).all();

    const map = new Map();
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        map.set(dateStr, { date: dateStr, walkin_revenue: 0, online_revenue: 0 });
    }

    for (const row of (results || [])) {
        const date = row.date;
        if (!map.has(date)) continue;

        const amount = parseFloat(row.total_amount) || 0;
        const source = (row.source || '').toLowerCase();

        const entry = map.get(date);
        if (source === 'walkin') {
            entry.walkin_revenue += amount;
        } else {
            entry.online_revenue += amount;
        }
    }

    const data = Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));

    return c.json({ success: true, data });
  } catch (err) {
    console.error('Error in /api/admin/revenue-trend:', err);
    return c.json({ success: false, error: 'Failed to fetch revenue trend' }, 500);
  }
});

app.get('/api/availability', handleAvailability);

// NEW: Walk-in booking endpoint for reception / offline guests
app.post('/api/book-walkin', handleBookWalkin);

// NEW: Password check endpoint for reception access
app.post('/api/check-reception-password', handleCheckReceptionPassword);

app.post('/api/admin/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { password } = body;
    const correctPassword = c.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return c.json({ success: false, error: 'Server configuration error' }, 500);
    }

    if (password === correctPassword) {
      return c.json({ success: true });
    } else {
      return c.json({ success: false, error: 'Invalid password' }, 401);
    }
  } catch (err) {
    console.error('Error in /api/admin/login:', err);
    return c.json({ success: false, error: 'Invalid request' }, 400);
  }
});

export default app;

// ----------------- Handlers -----------------

async function handleAvailability(c) {
  const env = c.env;
  if (!env.DB) return c.json({ error: "DB not found" }, 500);

  const url = new URL(c.req.url);
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const roomTypeIdParam = url.searchParams.get('room_type_id');

  let sql = `
    SELECT 
      rt.room_type_id,
      rt.room_type_name as name,
      COUNT(DISTINCT r.room_id) as total_rooms,
      COUNT(DISTINCT CASE 
        WHEN b.booking_status IN ('pending', 'confirmed', 'checked_in') 
        AND date(b.check_in) <= date(?1) 
        AND date(b.check_out) > date(?1) 
        THEN b.room_id 
      END) as booked_rooms
    FROM room_types rt
    LEFT JOIN rooms r ON rt.room_type_id = r.room_type_id
    LEFT JOIN bookings b ON r.room_id = b.room_id
  `;

  const params = [date];

  if (roomTypeIdParam) {
    sql += " WHERE rt.room_type_id = ?2 ";
    params.push(roomTypeIdParam);
  }

  sql += " GROUP BY rt.room_type_id, rt.room_type_name";

  try {
    const stmt = env.DB.prepare(sql).bind(...params);
    const { results } = await stmt.all();

    const rows = (results || []).map((r) => ({
      room_type_id: r.room_type_id,
      name: r.name,
      total_rooms: r.total_rooms,
      booked_rooms: r.booked_rooms,
      remaining_rooms: r.total_rooms - r.booked_rooms,
      date,
    }));

    return c.json(rows);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
}

// NEW: Handle walk-in / offline bookings (reception use)
async function handleBookWalkin(c) {
  const db = c.env.DB;
  if (!db) {
    console.warn("D1 database not bound. Using mock response.");
    return c.json({ success: true, bookingId: `WALKIN-${Date.now()}`, mock: true });
  }

  try {
    const payload = await c.req.json();
    const {
      roomType,      // e.g. "Standard", "Deluxe", "Suite"
      checkIn,       // "2026-08-20"
      checkOut,      // "2026-08-22"
      name,
      phone,
      guests,
      notes          // optional, e.g. "walk-in", "offline"
    } = payload;

    if (!roomType || !checkIn || !checkOut || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const userId = await getOrCreateUser(db, { name, phone });

    // Map frontend roomType to room_type_id
    let mappedRoomTypeId = 'RT-STD';
    if (roomType.toLowerCase().includes('deluxe')) mappedRoomTypeId = 'RT-DLX';
    else if (roomType.toLowerCase().includes('suite')) mappedRoomTypeId = 'RT-BSN';

    // Find an available room
    const room = await db.prepare("SELECT room_id, base_price FROM rooms JOIN room_types USING(room_type_id) WHERE room_type_id = ? AND room_status = 'available' LIMIT 1").bind(mappedRoomTypeId).first();

    if (!room) {
      throw new Error('No available rooms found for the selected category.');
    }

    const roomId = room.room_id;
    const basePrice = room.base_price || 2000.00;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalAmount = nights * basePrice;

    const bookingId = `W-${Math.floor(10000 + Math.random() * 90000)}`;

    // Insert booking marked as walk-in
    await db.prepare(
      "INSERT INTO bookings (booking_id, user_id, hotel_id, room_id, check_in, check_out, nights, adults, children, total_amount, booking_status, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'walkin')"
    ).bind(
      bookingId,
      userId,
      'H-001',
      roomId,
      checkIn,
      checkOut,
      nights,
      parseInt(guests) || 1,
      0,
      totalAmount
    ).run();

    // Optional: you can also store notes in a separate table or extend schema later

    return c.json({ success: true, bookingId });
  } catch (error) {
    console.error("Walk-in booking error:", error);
    return c.json({ error: error.message }, 500);
  }
}

// NEW: Handle reception password check
async function handleCheckReceptionPassword(c) {
  const env = c.env;
  const body = await c.req.json();
  const { password } = body;

  const correctPassword = env.RECEPTION_PASSWORD;

  // If not configured, allow access (for dev) or you can block by returning { allowed: false }
  if (!correctPassword) {
    return c.json({ allowed: true });
  }

  if (password === correctPassword) {
    return c.json({ allowed: true });
  }

  return c.json({ allowed: false });
}
