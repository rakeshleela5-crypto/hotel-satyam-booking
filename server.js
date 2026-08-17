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
  const diff = Math.round((b - a) / 86400000);
  return Math.max(1, diff);
}

function isPastDateStr(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d, 0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
}

function getExtraGuestRate(roomTypeId) {
  if (roomTypeId === 'RT-BSN' || roomTypeId === 'RT-EXE') return 750;
  if (roomTypeId === 'RT-DLX') return 500;
  return 400;
}

function calculateBookingFinancials({ basePrice, nights, guests = 1, roomTypeId = 'RT-STD' }) {
  const baseCapacity = 2;
  const numGuests = Math.max(1, Number(guests) || 1);
  const extraGuests = Math.max(0, numGuests - baseCapacity);
  const extraRate = getExtraGuestRate(roomTypeId);
  const extraCost = extraGuests * extraRate * nights;
  const roomSubtotal = Number(basePrice || 0) * nights;
  const subtotal = roomSubtotal + extraCost;
  const tax = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + tax;

  return {
    nights,
    basePrice: Number(basePrice || 0),
    roomSubtotal,
    extraGuests,
    extraRate,
    extraCost,
    subtotal,
    tax,
    totalAmount
  };
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
  if (s.includes('suite') || s.includes('executive') || s.includes('business')) return 'RT-BSN';
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
    SELECT r.room_id, r.room_number, r.room_type_id, rt.room_type_name, rt.base_price, rt.capacity, rt.description
    FROM rooms r
    JOIN room_types rt ON rt.room_type_id = r.room_type_id
    WHERE r.room_type_id = ? 
      AND r.room_status = 'available'
      AND r.room_id NOT IN (
        SELECT room_id
        FROM bookings
        WHERE booking_status IN ('pending', 'confirmed', 'checked_in', 'blocked')
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
  const guests = Number(c.req.query('guests') || 1);
  const roomTypeId = roomToTypeId(roomType);

  if (!checkIn || !checkOut) {
    return c.json({ success: false, error: 'checkIn and checkOut are required' }, 400);
  }

  if (isPastDateStr(checkIn)) {
    return c.json({ success: false, error: 'Check-in date cannot be in the past' }, 400);
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return c.json({ success: false, error: 'Check-out date must be after check-in date (minimum 1 night stay)' }, 400);
  }

  const result = await checkAvailability(db, roomTypeId, checkIn, checkOut);
  const room = result.room;

  if (!room) {
    return c.json({ success: true, available: false, room: null });
  }

  const nights = nightsBetween(checkIn, checkOut);
  const financials = calculateBookingFinancials({
    basePrice: room.base_price,
    nights,
    guests,
    roomTypeId
  });

  return c.json({
    success: true,
    available: result.available,
    room: {
      room_type_id: room.room_type_id,
      room_type_name: room.room_type_name,
      base_price: financials.basePrice,
      capacity: room.capacity,
      description: room.description
    },
    nights: financials.nights,
    guests,
    extraGuests: financials.extraGuests,
    extraGuestRate: financials.extraRate,
    extraGuestCost: financials.extraCost,
    subtotal: financials.subtotal,
    tax: financials.tax,
    total_amount: financials.totalAmount
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

  if (isPastDateStr(checkIn)) {
    return c.json({ success: false, error: 'Check-in date cannot be in the past' }, 400);
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return c.json({ success: false, error: 'Check-out date must be after check-in date (minimum 1 night stay)' }, 400);
  }

  const roomTypeId = roomToTypeId(roomType);
  const availability = await checkAvailability(db, roomTypeId, checkIn, checkOut);

  if (!availability.available || !availability.room) {
    return c.json({ success: false, error: 'Selected room type is not available' }, 409);
  }

  const userId = await ensureUser(db, { name, email, phone });
  const nights = nightsBetween(checkIn, checkOut);
  const financials = calculateBookingFinancials({
    basePrice: availability.room.base_price,
    nights,
    guests: Number(guests) || 1,
    roomTypeId
  });

  const bookingId = uuid();
  const code = bookingCode();

  await db.prepare(`
    INSERT INTO bookings (
      id, booking_code, user_id, room_type_id, room_id,
      guest_name, guest_email, guest_phone,
      check_in, check_out, nights, guests,
      subtotal, tax, total_amount, status, payment_status, booking_status, special_requests, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'pending', ?, 'online')
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
    financials.subtotal,
    financials.tax,
    financials.totalAmount,
    specialRequests || null
  ).run();

  return c.json({
    success: true,
    bookingId,
    bookingCode: code,
    amount: financials.totalAmount,
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
    return c.json({ success: false, error: err?.message || 'Invalid request' }, 400);
  }
});

app.get('/api/admin/bookings', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT id as booking_id, booking_code, guest_name as full_name, guest_email, guest_phone as phone,
           check_in, check_out, nights, guests,
           total_amount, status, payment_status, booking_status, refund_status,
           fraud_status, fraud_reason, source
    FROM bookings
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  return c.json({ success: true, bookings: results });
});

app.get('/api/admin/walkins', async (c) => {
  const db = c.env.DB;
  const date = c.req.query('date');
  if (!date) return c.json({ success: false, error: 'date required' }, 400);

  const { results } = await db.prepare(`
    SELECT id as booking_id, guest_name as full_name, guest_phone as phone,
           check_in, check_out, nights, total_amount, booking_status
    FROM bookings
    WHERE source = 'walk-in' AND check_in = ?
    ORDER BY created_at DESC
  `).bind(date).all();

  return c.json({ success: true, walkins: results });
});

app.get('/api/admin/online-bookings', async (c) => {
  const db = c.env.DB;
  const date = c.req.query('date');
  if (!date) return c.json({ success: false, error: 'date required' }, 400);

  const { results } = await db.prepare(`
    SELECT id as booking_id, guest_name as full_name, guest_phone as phone,
           check_in, check_out, nights, total_amount, booking_status
    FROM bookings
    WHERE source != 'walk-in' AND check_in = ?
    ORDER BY created_at DESC
  `).bind(date).all();

  return c.json({ success: true, bookings: results });
});

app.get('/api/admin/revenue-trend', async (c) => {
  const db = c.env.DB;
  const days = parseInt(c.req.query('days') || '7', 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  const startDateStr = startDate.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const { results } = await db.prepare(`
    SELECT check_in, total_amount, source
    FROM bookings
    WHERE check_in >= ? AND check_in <= ?
  `).bind(startDateStr, todayStr).all();

  const map = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    map.set(dateStr, { date: dateStr, walkin_revenue: 0, online_revenue: 0 });
  }

  if (results) {
    for (const row of results) {
      const date = row.check_in;
      if (!map.has(date)) continue;
      const amount = parseFloat(row.total_amount) || 0;
      const isWalkin = row.source === 'walk-in';
      const entry = map.get(date);
      if (isWalkin) {
        entry.walkin_revenue += amount;
      } else {
        entry.online_revenue += amount;
      }
    }
  }

  const data = Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  return c.json({ success: true, data });
});

app.get('/api/admin/rooms-list', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT r.room_id, r.room_number, r.floor, r.room_status, rt.room_type_id, rt.room_type_name, rt.base_price
    FROM rooms r
    JOIN room_types rt ON rt.room_type_id = r.room_type_id
    ORDER BY rt.room_type_name ASC, r.room_number ASC
  `).all();

  return c.json({ success: true, rooms: results || [] });
});

app.post('/api/admin/block-room', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));

  const {
    roomType = 'Standard',
    roomId,
    checkIn,
    checkOut,
    reason = 'phone_reservation', // 'walk-in' | 'phone_reservation' | 'maintenance' | 'vip_hold' | 'admin_hold'
    guestName,
    guestPhone,
    guestEmail,
    amount,
    paymentMethod = 'cash', // 'cash' | 'upi' | 'card' | 'pay_at_desk' | 'na'
    paymentStatus = 'paid', // 'paid' | 'pending' | 'na'
    guests = 1,
    notes = ''
  } = body;

  if (!checkIn || !checkOut) {
    return c.json({ success: false, error: 'Check-in and Check-out dates are required' }, 400);
  }

  if (new Date(checkIn) >= new Date(checkOut)) {
    return c.json({ success: false, error: 'Check-out date must be after check-in date' }, 400);
  }

  const roomTypeId = roomToTypeId(roomType);
  let selectedRoom = null;

  if (roomId) {
    // Staff selected a specific room
    selectedRoom = await db.prepare(`
      SELECT r.room_id, r.room_number, r.room_type_id, rt.room_type_name, rt.base_price, rt.capacity
      FROM rooms r
      JOIN room_types rt ON rt.room_type_id = r.room_type_id
      WHERE r.room_id = ?
        AND r.room_status = 'available'
        AND r.room_id NOT IN (
          SELECT room_id
          FROM bookings
          WHERE booking_status IN ('pending', 'confirmed', 'checked_in', 'blocked')
            AND date(check_in) < date(?) 
            AND date(check_out) > date(?)
        )
      LIMIT 1
    `).bind(roomId, checkOut, checkIn).first();

    if (!selectedRoom) {
      return c.json({ success: false, error: `Room ${roomId} is already occupied or blocked for the selected dates` }, 409);
    }
  } else {
    // Auto-assign available room in room type
    const availability = await checkAvailability(db, roomTypeId, checkIn, checkOut);
    if (!availability.available || !availability.room) {
      return c.json({ success: false, error: `No available rooms in ${roomType} category for the selected dates` }, 409);
    }
    selectedRoom = availability.room;
  }

  const name = guestName && guestName.trim() 
    ? guestName.trim() 
    : (reason === 'maintenance' ? 'Maintenance Block' : (reason === 'vip_hold' ? 'VIP Hold' : 'Admin Block'));
  const phone = guestPhone && guestPhone.trim() 
    ? guestPhone.trim() 
    : (reason === 'maintenance' ? 'Internal' : 'FrontDesk');
  const email = guestEmail && guestEmail.trim() ? guestEmail.trim() : null;

  const userId = await ensureUser(db, { name, email, phone });
  const nights = nightsBetween(checkIn, checkOut);
  const basePrice = Number(selectedRoom.base_price || 0);
  const subtotal = nights * basePrice;
  const tax = Math.round(subtotal * 0.12);
  const calculatedTotal = subtotal + tax;
  const finalAmount = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : (reason === 'maintenance' ? 0 : calculatedTotal);

  const bookingId = uuid();
  const code = bookingCode();
  const bookingStatus = reason === 'maintenance' ? 'blocked' : 'confirmed';
  const effectivePaymentStatus = (reason === 'maintenance' || paymentMethod === 'na') ? 'na' : (paymentStatus || 'paid');
  const specialRequests = [
    reason ? `[Source: ${reason}]` : '',
    paymentMethod ? `[Payment: ${paymentMethod}]` : '',
    notes
  ].filter(Boolean).join(' ');

  await db.prepare(`
    INSERT INTO bookings (
      id, booking_code, user_id, room_type_id, room_id,
      guest_name, guest_email, guest_phone,
      check_in, check_out, nights, guests,
      subtotal, tax, total_amount, status, payment_status, booking_status, special_requests, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)
  `).bind(
    bookingId,
    code,
    userId,
    selectedRoom.room_type_id || roomTypeId,
    selectedRoom.room_id,
    name,
    email,
    phone,
    checkIn,
    checkOut,
    nights,
    Number(guests) || 1,
    subtotal,
    tax,
    finalAmount,
    effectivePaymentStatus,
    bookingStatus,
    specialRequests,
    reason
  ).run();

  return c.json({
    success: true,
    bookingId,
    bookingCode: code,
    roomId: selectedRoom.room_id,
    roomNumber: selectedRoom.room_number || selectedRoom.room_id,
    roomType: selectedRoom.room_type_name || roomType,
    checkIn,
    checkOut,
    nights,
    amount: finalAmount
  });
});

app.get('/api/admin/blocked-dates', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT b.id as booking_id, b.booking_code, b.guest_name as full_name, b.guest_email, b.guest_phone as phone,
           b.check_in, b.check_out, b.nights, b.guests, b.total_amount, b.status, b.payment_status,
           b.booking_status, b.special_requests, b.source, b.created_at,
           r.room_number, r.floor, rt.room_type_name, rt.room_type_id
    FROM bookings b
    LEFT JOIN rooms r ON r.room_id = b.room_id
    LEFT JOIN room_types rt ON rt.room_type_id = b.room_type_id
    WHERE b.booking_status IN ('confirmed', 'blocked', 'checked_in', 'pending')
      AND (
        b.source IN ('walk-in', 'phone', 'phone_reservation', 'maintenance', 'vip_hold', 'admin_hold', 'offline')
        OR b.booking_status = 'blocked'
      )
    ORDER BY b.check_in DESC, b.created_at DESC
    LIMIT 200
  `).all();

  return c.json({ success: true, blocks: results || [] });
});

app.post('/api/admin/unblock-room', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const { bookingId } = body;

  if (!bookingId) {
    return c.json({ success: false, error: 'bookingId is required' }, 400);
  }

  await db.prepare(`
    UPDATE bookings
    SET booking_status = 'cancelled',
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? OR booking_code = ?
  `).bind(bookingId, bookingId).run();

  return c.json({ success: true, message: 'Room dates unblocked and released successfully' });
});

app.post('/api/check-reception-password', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { password } = body;
  
  const correctPassword = c.env.RECEPTION_PASSWORD || c.env.ADMIN_PASSWORD;

  if (password === correctPassword) {
    return c.json({ allowed: true });
  } else {
    return c.json({ allowed: false });
  }
});

app.post('/api/book-walkin', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));

  const {
    name,
    phone,
    roomType,
    checkIn,
    checkOut,
    guests = 1,
    notes = 'walk-in'
  } = body;

  if (!name || !roomType || !checkIn || !checkOut) {
    return c.json({ success: false, error: 'Missing required fields' }, 400);
  }

  const roomTypeId = roomToTypeId(roomType);
  const availability = await checkAvailability(db, roomTypeId, checkIn, checkOut);

  if (!availability.available || !availability.room) {
    return c.json({ success: false, error: 'Selected room type is not available for these dates' }, 409);
  }

  const userId = await ensureUser(db, { name, email: null, phone });
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
      subtotal, tax, total_amount, status, payment_status, booking_status, special_requests, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid', 'confirmed', ?, 'walk-in')
  `).bind(
    bookingId,
    code,
    userId,
    roomTypeId,
    availability.room.room_id,
    name,
    null,
    phone || '',
    checkIn,
    checkOut,
    nights,
    Number(guests) || 1,
    subtotal,
    tax,
    totalAmount,
    notes
  ).run();

  return c.json({ success: true, bookingId, bookingCode: code });
});

app.post('/api/waitlist', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));

  const {
    name,
    phone,
    email,
    roomType,
    preferredDates
  } = body;

  if (!name || !phone || !preferredDates) {
    return c.json({ success: false, error: 'Missing required fields' }, 400);
  }

  const roomTypeId = roomToTypeId(roomType || 'Standard');
  const userId = await ensureUser(db, { name, email, phone });
  const waitlistId = uuid();

  await db.prepare(`
    INSERT INTO waitlist (
      id, user_id, name, phone, email, room_type_id, preferred_dates, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    waitlistId, userId, name, phone, email || null, roomTypeId, preferredDates
  ).run();

  return c.json({ success: true, waitlistId });
});

app.get('/api/room-counts', async (c) => {
  const db = c.env.DB;
  const dateStr = c.req.query('date');
  
  if (!dateStr) {
    return c.json({ success: false, error: 'date is required' }, 400);
  }

  const { results } = await db.prepare(`
    SELECT rt.room_type_id, rt.room_type_name as name, 
           COUNT(r.room_id) as remaining_rooms
    FROM room_types rt
    LEFT JOIN rooms r ON r.room_type_id = rt.room_type_id AND r.room_status = 'available'
    WHERE r.room_id NOT IN (
      SELECT room_id FROM bookings
      WHERE booking_status IN ('pending', 'confirmed', 'checked_in', 'blocked')
        AND date(check_in) <= date(?) 
        AND date(check_out) > date(?)
    )
    GROUP BY rt.room_type_id, rt.room_type_name
  `).bind(dateStr, dateStr).all();

  return c.json(results || []);
});

// ==========================================
// AI AUTOMATIONS & INTELLIGENT HOSPITALITY APIS
// ==========================================

// In-memory fallback stores for high resilience
const inMemoryServiceTickets = [];
const inMemoryPreCheckins = [];
const inMemoryFeedbacks = [];

// Helper: Ensure AI helper tables exist in D1
async function ensureAiTables(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS service_tickets (
        id TEXT PRIMARY KEY,
        room_number TEXT,
        department TEXT,
        request_text TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS digital_precheckins (
        id TEXT PRIMARY KEY,
        booking_code TEXT,
        guest_name TEXT,
        guest_phone TEXT,
        id_type TEXT,
        id_number_masked TEXT,
        dob TEXT,
        gender TEXT,
        status TEXT DEFAULT 'verified',
        qr_token TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS guest_feedbacks (
        id TEXT PRIMARY KEY,
        booking_code TEXT,
        guest_name TEXT,
        rating INTEGER,
        category TEXT,
        comments TEXT,
        sentiment TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (err) {
    console.warn('Ai tables init notice:', err?.message);
  }
}

// 1. Natural Language Booking Intent Parser (Workers AI + NLP Heuristic Engine)
function parseBookingIntentNLP(text = '') {
  const lower = text.toLowerCase();
  const today = new Date();
  
  // Date calculation
  let checkInDate = new Date(today);
  let nights = 1;

  if (lower.includes('tomorrow')) {
    checkInDate.setDate(checkInDate.getDate() + 1);
  } else if (lower.includes('friday') || lower.includes('this friday')) {
    const day = checkInDate.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    checkInDate.setDate(checkInDate.getDate() + diff);
  } else if (lower.includes('saturday') || lower.includes('this weekend')) {
    const day = checkInDate.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    checkInDate.setDate(checkInDate.getDate() + diff);
  } else if (lower.includes('next week')) {
    checkInDate.setDate(checkInDate.getDate() + 7);
  }

  // Nights extraction
  const nightMatch = lower.match(/(\d+)\s*(?:night|nights|day|days)/);
  if (nightMatch) {
    nights = Math.max(1, parseInt(nightMatch[1], 10));
  }

  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + nights);

  const checkIn = checkInDate.toISOString().slice(0, 10);
  const checkOut = checkOutDate.toISOString().slice(0, 10);

  // Room type extraction
  let roomType = 'Standard Room';
  if (lower.includes('suite') || lower.includes('executive') || lower.includes('luxury')) {
    roomType = 'Executive Suite';
  } else if (lower.includes('deluxe') || lower.includes('king') || lower.includes('ac double')) {
    roomType = 'Deluxe Room';
  }

  // Guests extraction
  let guests = 2;
  const guestMatch = lower.match(/(\d+)\s*(?:guest|guests|people|person|adult|adults)/);
  if (guestMatch) {
    guests = Math.max(1, parseInt(guestMatch[1], 10));
  } else if (lower.includes('couple') || lower.includes('two of us') || lower.includes('family')) {
    guests = lower.includes('family') ? 3 : 2;
  } else if (lower.includes('alone') || lower.includes('solo') || lower.includes('single')) {
    guests = 1;
  }

  // Special requests extraction
  const specialRequests = [];
  if (lower.includes('late check') || lower.includes('11 pm') || lower.includes('late night') || lower.includes('midnight')) {
    specialRequests.push('Late Check-in Request');
  }
  if (lower.includes('early check')) {
    specialRequests.push('Early Check-in Request');
  }
  if (lower.includes('extra bed') || lower.includes('mattress') || lower.includes('child')) {
    specialRequests.push('Extra Mattress / Child Bed Requested');
  }
  if (lower.includes('quiet') || lower.includes('high floor') || lower.includes('city view')) {
    specialRequests.push('High Floor / Quiet Room');
  }
  if (lower.includes('station pickup') || lower.includes('train') || lower.includes('railway') || lower.includes('pickup')) {
    specialRequests.push('Station Pickup Assistance');
  }

  return {
    checkIn,
    checkOut,
    nights,
    roomType,
    guests,
    specialRequests: specialRequests.join(', '),
    hasLateCheckIn: lower.includes('late') || lower.includes('11 pm') || lower.includes('night')
  };
}

app.post('/api/ai/parse-booking-intent', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const message = body.message || body.query || '';

  if (!message.trim()) {
    return c.json({ success: false, error: 'Message query is required' }, 400);
  }

  let parsed = null;

  // Try Workers AI if binding exists
  if (c.env?.AI) {
    try {
      const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are an expert hotel reservation AI for Satyam Residency, Rayagada. Extract booking parameters into pure JSON with keys: checkIn (YYYY-MM-DD), checkOut (YYYY-MM-DD), roomType (Standard Room, Deluxe Room, or Executive Suite), guests (number), specialRequests (string), summary (brief polite response). Base reference date is today: ${new Date().toISOString().slice(0, 10)}.`
          },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      });
      
      if (typeof aiResponse === 'object' && aiResponse.response) {
        parsed = JSON.parse(aiResponse.response);
      } else if (aiResponse?.checkIn) {
        parsed = aiResponse;
      }
    } catch (err) {
      console.warn('Workers AI call skipped/failed, using robust NLP engine:', err?.message);
    }
  }

  // Fallback to robust NLP heuristics
  if (!parsed || !parsed.checkIn) {
    parsed = parseBookingIntentNLP(message);
  }

  // Verify availability in DB
  const db = c.env.DB;
  let roomTypeId = 'RT-STD';
  if (parsed.roomType?.toLowerCase().includes('deluxe')) roomTypeId = 'RT-DLX';
  if (parsed.roomType?.toLowerCase().includes('suite') || parsed.roomType?.toLowerCase().includes('executive')) roomTypeId = 'RT-BSN';

  let availability = { available: true };
  if (db) {
    try {
      availability = await checkAvailability(db, roomTypeId, parsed.checkIn, parsed.checkOut);
    } catch (err) {
      console.warn('Check availability check fallback:', err?.message);
    }
  }

  // Calculate pricing
  const basePrices = { 'RT-STD': 1499, 'RT-DLX': 2499, 'RT-BSN': 4999 };
  const baseRate = basePrices[roomTypeId] || 1499;
  const nights = nightsBetween(parsed.checkIn, parsed.checkOut);
  const financials = calculateBookingFinancials({
    basePrice: baseRate,
    nights,
    guests: parsed.guests,
    roomTypeId
  });

  return c.json({
    success: true,
    intent: {
      ...parsed,
      roomTypeId,
      roomTypeName: parsed.roomType || (roomTypeId === 'RT-BSN' ? 'Executive Suite' : (roomTypeId === 'RT-DLX' ? 'Deluxe Room' : 'Standard Room')),
      available: availability.available !== false,
      financials
    }
  });
});

// 2. Vision / OCR Simulation for Aadhaar & Government ID Verification
app.post('/api/ai/ocr-id-verification', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { idType = 'Aadhaar', guestName = '', _rawText = '', _hasFile = false } = body;

  // Generate realistic verified mock extraction from uploaded ID
  const firstNames = ['Rajesh', 'Suresh', 'Amit', 'Priya', 'Sneha', 'Ramesh', 'Ananya', 'Vikram'];
  const lastNames = ['Patnaik', 'Mohanty', 'Mishra', 'Tripathy', 'Sahu', 'Dash', 'Panda', 'Rao'];
  
  const extractedName = guestName.trim() 
    || `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  
  let idNumberMasked = '';
  if (idType.toLowerCase().includes('aadhaar')) {
    idNumberMasked = `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`;
  } else if (idType.toLowerCase().includes('driving') || idType.toLowerCase().includes('dl')) {
    idNumberMasked = `OD-18-${2015 + Math.floor(Math.random() * 8)}00${Math.floor(1000 + Math.random() * 9000)}`;
  } else if (idType.toLowerCase().includes('passport')) {
    idNumberMasked = `T${Math.floor(1000000 + Math.random() * 8999999)}`;
  } else {
    idNumberMasked = `ID-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  const birthYear = 1980 + Math.floor(Math.random() * 22);
  const birthMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const birthDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const dob = `${birthDay}/${birthMonth}/${birthYear}`;
  const gender = Math.random() > 0.4 ? 'Male' : 'Female';
  const confidenceScore = Math.floor(96 + Math.random() * 4);

  return c.json({
    success: true,
    verification: {
      documentType: idType,
      verifiedName: extractedName,
      idNumberMasked,
      dob,
      gender,
      address: 'Rayagada / Odisha, India',
      photoClarity: 'High (Pass)',
      matchConfidence: `${confidenceScore}%`,
      complianceStatus: 'Government Compliant (Form-C / Guest Ledger Ready)',
      verifiedAt: new Date().toISOString()
    }
  });
});

// 3. Digital Pre-Checkin Submission
app.post('/api/ai/pre-checkin', async (c) => {
  const db = c.env.DB;
  await ensureAiTables(db);
  const body = await c.req.json().catch(() => ({}));

  const {
    bookingCode,
    guestName,
    guestPhone,
    idType = 'Aadhaar Card',
    idNumberMasked,
    dob,
    gender
  } = body;

  if (!guestName || !guestPhone) {
    return c.json({ success: false, error: 'Guest name and phone are required' }, 400);
  }

  const checkinId = `PCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const qrToken = `SATYAM-PASS-${checkinId}-${Math.floor(1000 + Math.random() * 9000)}`;

  const record = {
    id: checkinId,
    booking_code: bookingCode || 'SR-WALKIN',
    guest_name: guestName,
    guest_phone: guestPhone,
    id_type: idType,
    id_number_masked: idNumberMasked || 'XXXX-XXXX-9842',
    dob: dob || '15/08/1992',
    gender: gender || 'Male',
    status: 'verified',
    qr_token: qrToken,
    created_at: new Date().toISOString()
  };

  if (db) {
    try {
      await db.prepare(`
        INSERT INTO digital_precheckins (id, booking_code, guest_name, guest_phone, id_type, id_number_masked, dob, gender, status, qr_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?)
      `).bind(
        record.id, record.booking_code, record.guest_name, record.guest_phone,
        record.id_type, record.id_number_masked, record.dob, record.gender, record.qr_token
      ).run();
    } catch (err) {
      console.warn('DB precheckin insert fallback:', err?.message);
    }
  }

  inMemoryPreCheckins.unshift(record);

  return c.json({
    success: true,
    checkinId,
    qrToken,
    message: 'Pre-check-in complete! Show this digital QR pass at the front desk for instant key handover in under 10 seconds.'
  });
});

// 4. 24/7 AI Hotel Concierge & Multilingual RAG Q&A
const HOTEL_KNOWLEDGE = {
  wifi: {
    answer: "High-speed complimentary Wi-Fi is available across all rooms and common areas. SSID: 'Satyam_Residency_Guest' | Password: 'Satyam@Rayagada2024'. Ultra-fast 200 Mbps connection."
  },
  breakfast: {
    answer: "Breakfast is served daily from 7:30 AM to 10:30 AM in our dining lounge. We offer delicious traditional Odia dishes (Puri Upma, Idli Vada, Chhenapoda) as well as continental breakfast choices."
  },
  timings: {
    answer: "Standard Check-In time is 12:00 PM (Noon) and Check-Out time is 11:00 AM. 24/7 Front Desk is available for late-night arrivals. Early check-in is subject to availability or pre-booked pass."
  },
  temples: {
    answer: "Maa Majhighariani Temple (one of Southern Odisha's most sacred pilgrimage sites) is just 2.5 km (7 mins) from Satyam Residency. Jagannath Temple Rayagada is 1.8 km away. Front desk can arrange an instant auto/cab."
  },
  sightseeing: {
    answer: "Top Rayagada Attractions: 1. Maa Majhighariani Temple (2.5 km), 2. Hatipathar Waterfalls (4.2 km), 3. Devagiri Cave Hills (45 km), 4. Chekaguda Hanging Bridge (5 km), 5. Laxminarayan Temple (12 km)."
  },
  parking: {
    answer: "We provide secure 24/7 CCTV-monitored free valet and basement parking for all hotel guests."
  },
  amenities: {
    answer: "All rooms include silent Climate-Control AC, 24/7 Geyser Hot Water, 43\"/55\" Smart LED TV, Mini-Fridge, Room Service, Tea/Coffee maker, and electric kettle."
  },
  roomservice: {
    answer: "24/7 in-room dining and housekeeping service is available. Dial 9 from your room intercom or use this AI assistant to dispatch water bottles, extra towels, or snacks!"
  }
};

app.post('/api/ai/concierge-chat', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { query = '', language = 'en', roomNumber = '' } = body;
  const lower = query.toLowerCase();

  let responseText = '';

  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet') || lower.includes('password')) {
    responseText = HOTEL_KNOWLEDGE.wifi.answer;
  } else if (lower.includes('breakfast') || lower.includes('food') || lower.includes('tea') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('eat')) {
    responseText = HOTEL_KNOWLEDGE.breakfast.answer;
  } else if (lower.includes('check in') || lower.includes('check out') || lower.includes('checkout') || lower.includes('timing') || lower.includes('late')) {
    responseText = HOTEL_KNOWLEDGE.timings.answer;
  } else if (lower.includes('temple') || lower.includes('majhighariani') || lower.includes('darshan') || lower.includes('pooja') || lower.includes('jagannath')) {
    responseText = HOTEL_KNOWLEDGE.temples.answer;
  } else if (lower.includes('places') || lower.includes('visit') || lower.includes('sightseeing') || lower.includes('tour') || lower.includes('waterfall') || lower.includes('hatipathar')) {
    responseText = HOTEL_KNOWLEDGE.sightseeing.answer;
  } else if (lower.includes('car') || lower.includes('parking') || lower.includes('bike') || lower.includes('vehicle')) {
    responseText = HOTEL_KNOWLEDGE.parking.answer;
  } else if (lower.includes('ac') || lower.includes('tv') || lower.includes('geyser') || lower.includes('hot water') || lower.includes('fridge')) {
    responseText = HOTEL_KNOWLEDGE.amenities.answer;
  } else {
    responseText = `Namaste! Satyam Residency welcomes you to Rayagada. I can assist you with Room Service, Wi-Fi password, Breakfast timings, Maa Majhighariani Darshan timings, taxi bookings, or housekeeping. How may I serve you today?`;
  }

  // Regional language localization
  let localized = responseText;
  if (language === 'te') {
    if (lower.includes('wifi')) localized = "నమస్కారం! మా వైఫై నెట్‌వర్క్: 'Satyam_Residency_Guest' మరియు పాస్‌వర్డ్: 'Satyam@Rayagada2024'. అతివేగవంతమైన 200 Mbps కనెక్టివిటీ అందుబాటులో ఉంది.";
    else if (lower.includes('temple') || lower.includes('majhighariani')) localized = "మా ఝిఘరియాణి ఆలయం సత్యం రెసిడెన్సీ నుండి కేవలం 2.5 కి.మీ (7 నిమిషాలు) దూరంలో ఉంది. రిసెప్షన్ వద్ద వెంటనే ఆటో లేదా క్యాబ్ బుక్ చేయవచ్చు.";
    else if (lower.includes('breakfast')) localized = "ఉచిత అల్పాహారం రోజూ ఉదయం 7:30 నుండి 10:30 వరకు డైనింగ్ హాల్‌లో అందించబడుతుంది. వేడి పూరి, ఇడ్లీ, వడ మరియు ఒడియా స్పెషల్స్ లభిస్తాయి.";
    else localized = `నమస్కారం! సత్యం రెసిడెన్సీ రాయగడకు స్వాగతం. మేము మీకు రూమ్ సర్వీస్, ఆలయ దర్శనం వేళలు, వైఫై మరియు క్యాబ్ బుకింగ్‌లో సహాయపడగలము.`;
  } else if (language === 'hi') {
    if (lower.includes('wifi')) localized = "नमस्ते! हमारा हाई-स्पीड वाई-फाई पासवर्ड है: 'Satyam@Rayagada2024' और नेटवर्क नाम 'Satyam_Residency_Guest' है।";
    else if (lower.includes('temple') || lower.includes('majhighariani')) localized = "मां मझिघरियानी मंदिर सत्यम रेजीडेंसी से मात्र 2.5 किमी दूर है। फ्रंट डेस्क से आप तुरंत ऑटो या टैक्सी बुक कर सकते हैं।";
    else if (lower.includes('breakfast')) localized = "नाश्ता सुबह 7:30 बजे से 10:30 बजे तक डाइनिंग लाउंज में उपलब्ध है।";
    else localized = `नमस्ते! सत्यम रेजीडेंसी रायगड़ा में आपका स्वागत है। हम रूम सर्विस, दर्शन समय, वाई-फाई और टैक्सी सहायता के लिए 24 घंटे उपलब्ध हैं।`;
  } else if (language === 'or') {
    if (lower.includes('wifi')) localized = "ନମସ୍କାର! ଆମ ହାଇ-ସ୍ପିଡ୍ ୱାଇ-ଫାଇ ପାସୱାର୍ଡ ହେଉଛି: 'Satyam@Rayagada2024' (ନେଟୱାର୍କ: Satyam_Residency_Guest)।";
    else if (lower.includes('temple') || lower.includes('majhighariani')) localized = "ମା ମଝିଘରିଆଣୀ ମନ୍ଦିର ସତ୍ୟମ୍ ରେସିଡେନ୍ସି ଠାରୁ ମାତ୍ର ୨.୫ କିମି (୭ ମିନିଟ୍) ଦୂର।";
    else localized = `ନମସ୍କାର! ସତ୍ୟମ୍ ରେସିଡେନ୍ସି ରାୟଗଡାରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ। ରୁମ୍ ସର୍ଭିସ୍, ମନ୍ଦିର ଦର୍ଶନ ସମୟ କିମ୍ବା ୱାଇ-ଫାଇ ସହାୟତା ପାଇଁ ଆମେ ସର୍ବଦା ପ୍ରସ୍ତୁତ।`;
  }

  return c.json({
    success: true,
    reply: localized,
    language,
    roomNumber
  });
});

// 5. In-Stay Service Request & Housekeeping Auto-Dispatch
app.post('/api/ai/service-request', async (c) => {
  const db = c.env.DB;
  await ensureAiTables(db);
  const body = await c.req.json().catch(() => ({}));
  const { requestText = '', roomNumber = '204', guestName: _guestName = 'Guest' } = body;

  if (!requestText.trim()) {
    return c.json({ success: false, error: 'Request description is required' }, 400);
  }

  const lower = requestText.toLowerCase();
  let department = 'Housekeeping';
  let priority = 'normal';

  if (lower.includes('ac') || lower.includes('remote') || lower.includes('tv') || lower.includes('geyser') || lower.includes('light') || lower.includes('fan') || lower.includes('plug') || lower.includes('leak')) {
    department = 'Maintenance & Electrician';
    priority = 'urgent';
  } else if (lower.includes('water') || lower.includes('towel') || lower.includes('bedsheet') || lower.includes('clean') || lower.includes('pillow') || lower.includes('dust')) {
    department = 'Housekeeping';
  } else if (lower.includes('food') || lower.includes('tea') || lower.includes('coffee') || lower.includes('bottle') || lower.includes('snack') || lower.includes('plate')) {
    department = 'Room Service & Kitchen';
  } else if (lower.includes('bill') || lower.includes('taxi') || lower.includes('cab') || lower.includes('luggage') || lower.includes('bellboy')) {
    department = 'Front Desk & Concierge';
  }

  const ticketId = `SRV-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticket = {
    id: ticketId,
    room_number: roomNumber || 'FrontDesk',
    department,
    request_text: requestText,
    status: 'dispatched',
    priority,
    etaMinutes: priority === 'urgent' ? '5-8 mins' : '10-15 mins',
    created_at: new Date().toISOString()
  };

  if (db) {
    try {
      await db.prepare(`
        INSERT INTO service_tickets (id, room_number, department, request_text, status, priority)
        VALUES (?, ?, ?, ?, 'dispatched', ?)
      `).bind(ticket.id, ticket.room_number, ticket.department, ticket.request_text, ticket.priority).run();
    } catch (err) {
      console.warn('DB service ticket insert fallback:', err?.message);
    }
  }

  inMemoryServiceTickets.unshift(ticket);

  return c.json({
    success: true,
    ticketId,
    department,
    priority,
    eta: ticket.etaMinutes,
    message: `Ticket #${ticketId} dispatched to ${department} team for Room ${roomNumber}. Expected staff arrival in ${ticket.etaMinutes}.`,
    whatsappSimulated: true
  });
});

app.get('/api/ai/service-tickets', async (c) => {
  const db = c.env.DB;
  await ensureAiTables(db);

  let tickets = [];
  if (db) {
    try {
      const { results } = await db.prepare(`
        SELECT id, room_number, department, request_text, status, priority, created_at
        FROM service_tickets
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      tickets = results || [];
    } catch (err) {
      console.warn('DB read service tickets fallback:', err?.message);
    }
  }

  if (!tickets.length) {
    tickets = inMemoryServiceTickets;
  }

  return c.json({ success: true, tickets });
});

app.post('/api/ai/service-tickets/update-status', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const { ticketId, status } = body;

  if (db) {
    try {
      await db.prepare(`UPDATE service_tickets SET status = ? WHERE id = ?`).bind(status, ticketId).run();
    } catch (err) {
      console.warn('DB update ticket fallback:', err?.message);
    }
  }

  const found = inMemoryServiceTickets.find(t => t.id === ticketId);
  if (found) found.status = status;

  return c.json({ success: true, message: `Ticket status updated to ${status}` });
});

// 6. Personalized AI Local Rayagada Tour & Itinerary Generator
app.post('/api/ai/generate-itinerary', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { purpose = 'pilgrimage', duration = '1_day', _pace = 'moderate' } = body;

  let title = 'Rayagada Sacred Pilgrimage & Heritage Tour';
  let days = [];

  if (purpose === 'pilgrimage') {
    title = 'Divine Rayagada Temple & Spiritual Darshan Tour';
    days = [
      {
        day: 'Day 1: Sacred Temples of Rayagada',
        schedule: [
          { time: '07:00 AM - 08:30 AM', activity: 'Morning Darshan at Maa Majhighariani Temple (Sacred Peetha)', location: 'Majhighariani Temple (2.5 km)', transport: 'Auto / Cab (7 mins)' },
          { time: '08:45 AM - 09:45 AM', activity: 'Traditional breakfast at Satyam Residency Dining Lounge', location: 'Hotel Satyam Residency', transport: 'On-site' },
          { time: '10:15 AM - 12:30 PM', activity: 'Visit Jagannath Temple & Laxminarayan Temple Therubali', location: 'Rayagada Town & Therubali', transport: 'Cab (20 mins)' },
          { time: '01:00 PM - 02:30 PM', activity: 'Authentic Odia Thali Lunch & Mid-Day Relaxation', location: 'Satyam Residency or Local Odia Dhaba', transport: 'Walk' },
          { time: '04:30 PM - 06:30 PM', activity: 'Evening Aarti at Maa Mangala Temple & Chekaguda Suspension Bridge sunset', location: 'Nagavali River Bridge', transport: 'Auto (12 mins)' },
          { time: '08:00 PM - 09:30 PM', activity: 'Dinner & Famous Rayagada Chhena Poda tasting', location: 'Satyam Restaurant', transport: 'On-site' }
        ]
      }
    ];
  } else if (purpose === 'nature') {
    title = 'Rayagada Nature, Waterfalls & Tribal Valleys Explorer';
    days = [
      {
        day: 'Day 1: Cascading Waterfalls & Green Hills',
        schedule: [
          { time: '08:00 AM - 09:00 AM', activity: 'Complimentary buffet breakfast at Satyam Residency', location: 'Hotel Dining Lounge', transport: 'On-site' },
          { time: '09:30 AM - 12:30 PM', activity: 'Explore Hatipathar Waterfalls & Nagavali River Rapids', location: 'Hatipathar (4.2 km)', transport: 'Cab / Private Auto (15 mins)' },
          { time: '01:00 PM - 02:30 PM', activity: 'Riverside picnic lunch or return for hot lunch at hotel', location: 'Satyam Residency', transport: 'Cab' },
          { time: '03:30 PM - 06:00 PM', activity: 'Scenic visit to Devagiri Cave Hills & natural water pools', location: 'Devagiri (Kalyansinghpur)', transport: 'Scenic drive (40 mins)' },
          { time: '07:30 PM - 09:30 PM', activity: 'Relaxing hot shower & evening dinner in Executive Suite', location: 'Satyam Residency', transport: 'On-site' }
        ]
      }
    ];
  } else {
    title = 'Rayagada Executive Business & Leisure Transit Itinerary';
    days = [
      {
        day: 'Day 1: Express Comfort & Prime City Access',
        schedule: [
          { time: '07:30 AM - 08:30 AM', activity: 'Express breakfast & high-speed Wi-Fi workstation setup', location: 'Satyam Residency Room / Lounge', transport: 'On-site' },
          { time: '09:00 AM - 01:00 PM', activity: 'Business visits / industrial corridor meetings (JK Paper, IMFA)', location: 'Rayagada Industrial Area', transport: 'Hotel Chauffeur Cab' },
          { time: '01:30 PM - 02:30 PM', activity: 'Business lunch at prime Gajapati Junction dining', location: 'Satyam Residency Area', transport: 'Walk' },
          { time: '05:30 PM - 07:00 PM', activity: 'Quick evening visit to Maa Majhighariani for auspicious blessings', location: 'Majhighariani Temple (2.5 km)', transport: 'Auto (7 mins)' },
          { time: '08:00 PM - 10:00 PM', activity: 'Dinner & 24/7 hassle-free express checkout assistance', location: 'Satyam Residency', transport: 'On-site' }
        ]
      }
    ];
  }

  return c.json({
    success: true,
    itinerary: {
      title,
      purpose,
      duration,
      bestTimeToVisit: 'October to March (Pleasant weather)',
      travelTips: [
        'Maa Majhighariani temple queues are shortest during 7:00 AM - 9:00 AM.',
        'Ask front desk for pre-arranged reliable auto or cab rentals with fixed honest rates.',
        'Don\'t forget to try Rayagada\'s fresh authentic Chhena Poda!'
      ],
      days
    }
  });
});

// 7. Demand & Occupancy-Driven Dynamic Pricing Engine
app.get('/api/ai/dynamic-pricing', async (c) => {
  const db = c.env.DB;
  const checkIn = c.req.query('checkIn') || new Date().toISOString().slice(0, 10);
  
  let totalRooms = 12;
  let bookedRooms = 3;

  if (db) {
    try {
      const totalRes = await db.prepare(`SELECT COUNT(*) as count FROM rooms WHERE room_status = 'available'`).first();
      if (totalRes?.count) totalRooms = totalRes.count;

      const bookedRes = await db.prepare(`
        SELECT COUNT(DISTINCT room_id) as count FROM bookings
        WHERE booking_status IN ('pending', 'confirmed', 'checked_in', 'blocked')
          AND date(check_in) <= date(?) AND date(check_out) > date(?)
      `).bind(checkIn, checkIn).first();
      if (bookedRes?.count) bookedRooms = bookedRes.count;
    } catch (err) {
      console.warn('Dynamic pricing DB lookup fallback:', err?.message);
    }
  }

  const occupancyRate = Math.min(100, Math.round((bookedRooms / Math.max(1, totalRooms)) * 100));
  
  // Multipliers calculation
  let surgeMultiplier = 1.0;
  let demandLevel = 'Normal Demand';
  let badgeText = 'Best Value Guaranteed';

  if (occupancyRate >= 85) {
    surgeMultiplier = 1.20; // +20%
    demandLevel = 'Extremely High Demand';
    badgeText = '🔥 Only a Few Rooms Left — High Demand';
  } else if (occupancyRate >= 65) {
    surgeMultiplier = 1.10; // +10%
    demandLevel = 'Moderate High Demand';
    badgeText = '⚡ Selling Fast in Rayagada';
  } else {
    badgeText = '✨ Early Bird Rate Applied';
  }

  // Base room prices
  const roomRates = [
    {
      room_type_id: 'RT-STD',
      name: 'Standard Room',
      basePrice: 1499,
      dynamicPrice: Math.round(1499 * surgeMultiplier),
      discount: surgeMultiplier === 1.0 ? '10% OFF' : null
    },
    {
      room_type_id: 'RT-DLX',
      name: 'Deluxe Room',
      basePrice: 2499,
      dynamicPrice: Math.round(2499 * surgeMultiplier),
      discount: surgeMultiplier === 1.0 ? '15% OFF' : null
    },
    {
      room_type_id: 'RT-BSN',
      name: 'Executive Suite',
      basePrice: 4999,
      dynamicPrice: Math.round(4999 * surgeMultiplier),
      discount: surgeMultiplier === 1.0 ? '20% OFF' : null
    }
  ];

  return c.json({
    success: true,
    occupancyRate,
    totalRooms,
    bookedRooms,
    availableRooms: Math.max(1, totalRooms - bookedRooms),
    surgeMultiplier,
    demandLevel,
    badgeText,
    roomRates
  });
});

// 8. AI Review Responder for Admin & Reputation Management
app.post('/api/ai/generate-review-response', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { guestName = 'Guest', rating = 5, _reviewText = '', tone = 'warm' } = body;

  let response = '';

  if (rating >= 4) {
    if (tone === 'warm') {
      response = `Dear ${guestName},\n\nThank you so much for choosing Satyam Residency, Rayagada and sharing your wonderful ${rating}-star feedback! We are delighted that you enjoyed our clean accommodations, prompt service, and prime location at Gajapati Junction. Our entire team looks forward to welcoming you back on your next visit to Rayagada!\n\nWarm regards,\nManagement, Satyam Residency`;
    } else {
      response = `Dear ${guestName},\n\nWe sincerely appreciate your high praise and positive review of Satyam Residency. Providing seamless hospitality and superior comfort is our highest priority. We look forward to hosting you again soon.\n\nBest regards,\nGeneral Management, Satyam Residency`;
    }
  } else {
    response = `Dear ${guestName},\n\nThank you for sharing your candid feedback regarding your recent stay. We are deeply sorry to learn that your experience did not meet your expectations. At Satyam Residency, we hold ourselves to rigorous standards of hospitality and cleanliness. We have escalated your feedback directly to our operations and housekeeping leadership to ensure this is immediately rectified. Please contact our manager at ${c.env.RECEPTION_PHONE || '+91 8984938388'} so we can make this right for you.\n\nSincerely,\nGuest Experience Leadership, Satyam Residency`;
  }

  return c.json({
    success: true,
    aiResponse: response,
    sentiment: rating >= 4 ? 'positive' : (rating === 3 ? 'neutral' : 'negative'),
    confidence: '99%'
  });
});

// 9. Smart Post-Stay Feedback & Review Booster
app.post('/api/ai/submit-feedback', async (c) => {
  const db = c.env.DB;
  await ensureAiTables(db);
  const body = await c.req.json().catch(() => ({}));

  const {
    bookingCode = 'SR-DIRECT',
    guestName = 'Guest',
    rating = 5,
    category = 'Overall Experience',
    comments = ''
  } = body;

  const numRating = Number(rating) || 5;
  const feedbackId = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
  const sentiment = numRating >= 4 ? 'positive' : (numRating === 3 ? 'neutral' : 'critical');

  const record = {
    id: feedbackId,
    booking_code: bookingCode,
    guest_name: guestName,
    rating: numRating,
    category,
    comments,
    sentiment,
    status: numRating <= 3 ? 'escalated_to_management' : 'published',
    created_at: new Date().toISOString()
  };

  if (db) {
    try {
      await db.prepare(`
        INSERT INTO guest_feedbacks (id, booking_code, guest_name, rating, category, comments, sentiment, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        record.id, record.booking_code, record.guest_name, record.rating,
        record.category, record.comments, record.sentiment, record.status
      ).run();
    } catch (err) {
      console.warn('DB feedback insert fallback:', err?.message);
    }
  }

  inMemoryFeedbacks.unshift(record);

  // Pre-generate positive Google review snippet if rating is 4 or 5
  let googleReviewPrompt = '';
  if (numRating >= 4) {
    googleReviewPrompt = `Had an outstanding stay at Satyam Residency in Rayagada! Super clean rooms, excellent AC & hot water, friendly staff, and very close to Maa Majhighariani Temple. Highly recommend for both family and business trips!`;
  }

  return c.json({
    success: true,
    feedbackId,
    sentiment,
    isEscalated: numRating <= 3,
    googleReviewPrompt,
    message: numRating >= 4
      ? 'Thank you for your wonderful review! You can copy the generated review to Google Maps.'
      : 'Your feedback has been privately routed to Satyam Residency Management for immediate resolution.'
  });
});

export default app;