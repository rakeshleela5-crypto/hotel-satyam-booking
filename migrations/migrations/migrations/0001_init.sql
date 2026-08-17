[8/16/2026 9:18 AM] Leela rakesh: PRAGMA defer_foreign_keys = true;

CREATE TABLE users_new (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'guest',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_types_new (
  room_type_id TEXT PRIMARY KEY,
  room_type_name TEXT NOT NULL,
  base_price REAL NOT NULL,
  capacity INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms_new (
  room_id TEXT PRIMARY KEY,
  room_type_id TEXT NOT NULL,
  room_number TEXT,
  room_status TEXT NOT NULL DEFAULT 'available',
  floor TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types_new(room_type_id)
);

CREATE TABLE bookings_new (
  id TEXT PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  room_type_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  nights INTEGER NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  subtotal REAL NOT NULL,
  tax REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  booking_status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  refund_status TEXT DEFAULT 'none',
  refund_amount REAL DEFAULT 0,
  source TEXT DEFAULT 'online',
  fraud_status TEXT DEFAULT 'SAFE',
  fraud_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users_new(user_id),
  FOREIGN KEY (room_type_id) REFERENCES room_types_new(room_type_id),
  FOREIGN KEY (room_id) REFERENCES rooms_new(room_id)
);

CREATE TABLE payment_events_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings_new(id)
);

INSERT INTO users_new (user_id, full_name, email, phone, role, created_at, updated_at)
SELECT user_id, full_name, email, phone, role, created_at, updated_at
FROM users;

INSERT INTO room_types_new (room_type_id, room_type_name, base_price, capacity, description, created_at, updated_at)
SELECT
  room_type_id,
  room_type_name,
  base_price,
  COALESCE(capacity, 2),
  description,
  created_at,
  updated_at
FROM room_types;

INSERT INTO rooms_new (room_id, room_type_id, room_number, room_status, floor, created_at, updated_at)
SELECT room_id, room_type_id, room_number, room_status, floor, created_at, updated_at
FROM rooms;

INSERT INTO bookings_new (
  id, booking_code, user_id, room_type_id, room_id,
  guest_name, guest_email, guest_phone,
  check_in, check_out, nights, guests,
  subtotal, tax, total_amount,
  status, booking_status, payment_status,
  special_requests, razorpay_order_id, razorpay_payment_id, razorpay_signature,
  refund_status, refund_amount, source, fraud_status, fraud_reason,
  created_at, updated_at
)
SELECT
  booking_id,
  COALESCE(booking_code, 'SR-' || SUBSTR(booking_id, 3)),
  user_id,
  COALESCE(room_type_id, (SELECT room_type_id FROM rooms WHERE rooms.room_id = bookings.room_id), 'RT-STD'),
  room_id,
  COALESCE(guest_name, (SELECT full_name FROM users WHERE users.user_id = bookings.user_id), 'Guest'),
  (SELECT email FROM users WHERE users.user_id = bookings.user_id),
  COALESCE(guest_phone, (SELECT phone FROM users WHERE users.user_id = bookings.user_id), ''),
[8/16/2026 9:18 AM] Leela rakesh: check_in,
  check_out,
  nights,
  COALESCE(guests, adults, 1),
  COALESCE(subtotal, total_amount),
  COALESCE(tax, 0),
  COALESCE(total_amount, subtotal),
  COALESCE(status, booking_status, 'pending'),
  COALESCE(booking_status, status, 'pending'),
  COALESCE(payment_status, 'pending'),
  special_requests,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  COALESCE(refund_status, 'none'),
  COALESCE(refund_amount, 0),
  COALESCE(source, 'online'),
  COALESCE(fraud_status, 'SAFE'),
  fraud_reason,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
FROM bookings;

DROP TABLE IF EXISTS payment_events;
DROP TABLE IF EXISTS booking_events;
DROP TABLE IF EXISTS waitlist;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS users;

ALTER TABLE users_new RENAME TO users;
ALTER TABLE room_types_new RENAME TO room_types;
ALTER TABLE rooms_new RENAME TO rooms;
ALTER TABLE bookings_new RENAME TO bookings;
ALTER TABLE payment_events_new RENAME TO payment_events;

CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payment_events(booking_id);

PRAGMA foreign_key_check;
PRAGMA defer_foreign_keys = off;
