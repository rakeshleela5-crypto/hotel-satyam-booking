import { Hono } from 'hono';

const app = new Hono();

app.use('*', async (c, next) => {
  const origin = c.req.header('origin') || '*';
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

function bookingCode() {
  return `SR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function uuid() {
  return crypto.randomUUID();
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.ceil((b - a) / 86400000);
  return Math.max(1, diff);
}

function expandDates(checkIn, checkOut) {
  const dates = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const d = new Date(start);
  while (d < end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function roomToTypeId(roomType = '') {
  const s = roomType.toLowerCase();
  if (s.includes('deluxe')) return 'RT-DLX';
  if (s.includes('suite') || s.includes('executive')) return 'RT-BSN';
  return 'RT-STD';
}

async function hmacSha256(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const expected = await hmacSha256(`${orderId}|${paymentId}`, secret);
  return expected === signature;
}

async function ensureUser(db, { name, email, phone }) {
  let existing = null;
  if (email) {
    existing = await db.prepare('SELECT user_id FROM users WHERE email = ? LIMIT 1').bind(email).first();
  }
  if (!existing && phone) {
    existing = await db.prepare('SELECT user_id FROM users WHERE phone = ? LIMIT 1').bind(phone).first();
  }
  if (existing) return existing.user_id;

  const userId = `U-${Math.floor(1000 + Math.random() * 9000)}`;
  const safeEmail = email && email.trim() ? email : `${userId.toLowerCase()}@hotelsatyam.local`;

  await db.prepare(`
    INSERT INTO users (user_id, full_name, email, phone, role)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, name || 'Guest', safeEmail, phone || '', 'guest').run();

  return userId;
}

async function checkAvailability(db, roomTypeId, checkIn, checkOut) {
  const dates = expandDates(checkIn, checkOut);
  if (!dates.length) return { available: false, room: null };

  const room = await db.prepare(`
    SELECT r.room_id, r.room_type_id, rt.room_type_name, rt.base_price, rt.capacity, rt.description
    FROM rooms r
    JOIN room_types rt ON rt.room_type_id = r.room_type_id
    WHERE r.room_type_id = ? 
      AND r.room_status = 'available'
      AND r.room_id NOT IN (
        SELECT room_id
        FROM bookings
        WHERE booking_status IN ('pending', 'confirmed', 'checked_in')
          AND date(check_in) < date(?) 
          AND date(check_out) > date(?)
      )
    LIMIT 1
  `).bind(roomTypeId, checkOut, checkIn).first();

  if (!room) return { available: false, room: null };

  return { available: true, room };
}

app.get('/api/rooms', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT rt.room_type_id, rt.room_type_name, rt.base_price, rt.capacity, rt.description
    FROM room_types rt
    ORDER BY rt.base_price ASC
  `).all();

  return c.json({ success: true, rooms: results });
});

app.get('/api/availability', async (c) => {
  const db = c.env.DB;
  const checkIn = c.req.query('checkIn');
  const checkOut = c.req.query('checkOut');
  const roomType = c.req.query('roomType') || 'Standard';
  const roomTypeId = roomToTypeId(roomType);

  if (!checkIn || !checkOut) {
    return c.json({ success: false, error: 'checkIn and checkOut are required' }, 400);
  }

  const result = await checkAvailability(db, roomTypeId, checkIn, checkOut);
  const room = result.room;

  if (!room) {
    return c.json({ success: true, available: false, room: null });
  }

  const nights = nightsBetween(checkIn, checkOut);
  const basePrice = Number(room.base_price || 0);
  const subtotal = nights * basePrice;
  const tax = Math.round(subtotal * 0.12);
  const total_amount = subtotal + tax;

  return c.json({
    success: true,
    available: result.available,
    room: {
      room_type_id: room.room_type_id,
      room_type_name: room.room_type_name,
      base_price: basePrice,
      capacity: room.capacity,
      description: room.description
    },
    nights,
    subtotal,
    tax,
    total_amount
  });
});

app.post('/api/bookings/create', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  const {
    name,
    email,
    phone,
    roomType,
    checkIn,
    checkOut,
    guests = 1,
    specialRequests = ''
  } = body;

  if (!name || !phone || !roomType || !checkIn || !checkOut) {
    return c.json({ success: false, error: 'Missing required fields' }, 400);
  }

  const roomTypeId = roomToTypeId(roomType);
  const availability = await checkAvailability(db, roomTypeId, checkIn, checkOut);

  if (!availability.available || !availability.room) {
    return c.json({ success: false, error: 'Selected room type is not available' }, 409);
  }

  const userId = await ensureUser(db, { name, email, phone });
  const nights = nightsBetween(checkIn, checkOut);
  const basePrice = Number(availability.room.base_price || 0);
  const subtotal = nights * basePrice;
  const tax = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + tax;

  const bookingId = uuid();
  const code = bookingCode();

  await db.prepare(`
    INSERT INTO bookings (
      id, booking_code, user_id, room_type_id, room_id,
      guest_name, guest_email, guest_phone,
      check_in, check_out, nights, guests,
      subtotal, tax, total_amount, status, payment_status, booking_status, special_requests
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'pending', ?)
  `).bind(
    bookingId,
    code,
    userId,
    roomTypeId,
    availability.room.room_id,
    name,
    email || null,
    phone,
    checkIn,
    checkOut,
    nights,
    Number(guests) || 1,
    subtotal,
    tax,
    totalAmount,
    specialRequests || null
  ).run();

  return c.json({
    success: true,
    bookingId,
    bookingCode: code,
    amount: totalAmount,
    currency: 'INR'
  });
});

app.post('/api/payments/create-order', async (c) => {
  const body = await c.req.json();
  const { bookingId } = body;

  if (!bookingId) {
    return c.json({ success: false, error: 'bookingId is required' }, 400);
  }

  const db = c.env.DB;
  const booking = await db.prepare(`
    SELECT id, booking_code, total_amount, guest_name, guest_email, guest_phone
    FROM bookings WHERE id = ? LIMIT 1
  `).bind(bookingId).first();

  if (!booking) {
    return c.json({ success: false, error: 'Booking not found' }, 404);
  }

  const keyId = c.env.RAZORPAY_KEY_ID;
  const keySecret = c.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return c.json({
      success: true,
      mock: true,
      orderId: `mock_${Date.now()}`,
      amount: booking.total_amount * 100,
      currency: 'INR',
      keyId: 'mock_key'
    });
  }

  const auth = btoa(`${keyId}:${keySecret}`);
  const resp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      amount: booking.total_amount * 100,
      currency: 'INR',
      receipt: booking.booking_code,
      notes: {
        bookingId: booking.id,
        bookingCode: booking.booking_code
      }
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    return c.json({ success: false, error: `Razorpay order failed: ${text}` }, 500);
  }

  const order = await resp.json();

  await db.prepare(`
    UPDATE bookings SET razorpay_order_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(order.id, bookingId).run();

  return c.json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId
  });
});

app.post('/api/payments/verify', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = body;

  if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return c.json({ success: false, error: 'Missing payment fields' }, 400);
  }

  const booking = await db.prepare(`
    SELECT id, total_amount, booking_code FROM bookings WHERE id = ? LIMIT 1
  `).bind(bookingId).first();

  if (!booking) {
    return c.json({ success: false, error: 'Booking not found' }, 404);
  }

  const secret = c.env.RAZORPAY_KEY_SECRET;

  if (secret) {
    const valid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!valid) {
      return c.json({ success: false, error: 'Invalid payment signature' }, 401);
    }
  }

  await db.prepare(`
    UPDATE bookings
    SET payment_status = 'paid',
        status = 'confirmed',
        booking_status = 'confirmed',
        razorpay_order_id = ?,
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId
  ).run();

  return c.json({
    success: true,
    bookingId,
    bookingCode: booking.booking_code
  });
});

app.post('/api/webhooks/razorpay', async (c) => {
  const db = c.env.DB;
  const webhookSecret = c.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = c.req.header('X-Razorpay-Signature');
  const rawBody = await c.req.text();

  if (!webhookSecret) {
    return c.text('Webhook secret not configured', 500);
  }

  const expected = await hmacSha256(rawBody, webhookSecret);
  if (signature !== expected) {
    return c.text('Invalid webhook signature', 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.text('Invalid JSON', 400);
  }

  const eventType = event.event || 'unknown';
  const payment = event.payload?.payment?.entity;
  const notes = payment?.notes || {};
  const bookingId = notes.bookingId || null;

  if (bookingId) {
    await db.prepare(`
      INSERT INTO payment_events (booking_id, event_type, payload)
      VALUES (?, ?, ?)
    `).bind(bookingId, eventType, rawBody).run();

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      await db.prepare(`
        UPDATE bookings
        SET payment_status = 'paid',
            status = 'confirmed',
            booking_status = 'confirmed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(bookingId).run();
    }

    if (eventType === 'payment.failed') {
      await db.prepare(`
        UPDATE bookings
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(bookingId).run();
    }
  }

  return c.json({ success: true });
});

app.post('/api/bookings/:id/cancel', async (c) => {
  const db = c.env.DB;
  const bookingId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const reason = body.reason || 'Cancelled by guest';
  const issueRefund = Boolean(body.issueRefund);

  const booking = await db.prepare(`
    SELECT id, payment_status, total_amount FROM bookings WHERE id = ? LIMIT 1
  `).bind(bookingId).first();

  if (!booking) {
    return c.json({ success: false, error: 'Booking not found' }, 404);
  }

  await db.prepare(`
    UPDATE bookings
    SET status = 'cancelled',
        booking_status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(bookingId).run();

  if (issueRefund && booking.payment_status === 'paid') {
    await db.prepare(`
      UPDATE bookings
      SET refund_status = 'pending',
          refund_amount = total_amount
      WHERE id = ?
    `).bind(bookingId).run();
  }

  return c.json({
    success: true,
    bookingId,
    reason,
    refundRequested: issueRefund && booking.payment_status === 'paid'
  });
});

app.post('/api/admin/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { password } = body;
    const correctPassword = c.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      return c.json({ success: false, error: 'Server configuration error' }, 500);
    }

    if (password === correctPassword) {
      return c.json({ success: true });
    } else {
      return c.json({ success: false, error: 'Invalid password' }, 401);
    }
  } catch (err) {
    return c.json({ success: false, error: 'Invalid request' }, 400);
  }
});

app.get('/api/admin/bookings', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT booking_code, guest_name, guest_email, guest_phone,
           check_in, check_out, nights, guests,
           total_amount, status, payment_status, refund_status
    FROM bookings
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  return c.json({ success: true, bookings: results });
});

export default app;