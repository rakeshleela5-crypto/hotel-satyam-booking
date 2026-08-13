DROP TABLE IF EXISTS booking_events;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('guest','admin','staff')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE hotels (
  hotel_id TEXT PRIMARY KEY,
  hotel_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE room_types (
  room_type_id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  room_type_name TEXT NOT NULL CHECK (room_type_name IN ('Standard Room','Deluxe Room','Business Suite','Family Suite')),
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 0,
  base_price REAL NOT NULL,
  amenities TEXT,
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);

CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  room_type_id TEXT NOT NULL,
  room_number TEXT NOT NULL,
  floor_no INTEGER,
  room_status TEXT NOT NULL CHECK (room_status IN ('available','occupied','maintenance','blocked')) DEFAULT 'available',
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id),
  UNIQUE (hotel_id, room_number)
);

CREATE TABLE bookings (
  booking_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  booking_status TEXT NOT NULL CHECK (booking_status IN ('pending','confirmed','checked_in','checked_out','cancelled')) DEFAULT 'pending',
  total_amount REAL NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid','partial','paid')) DEFAULT 'unpaid',
  special_request TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
  FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

CREATE TABLE payments (
  payment_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash','upi','card','bank_transfer')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending','success','failed','refunded')) DEFAULT 'pending',
  paid_at TEXT,
  transaction_ref TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

CREATE TABLE booking_events (
  event_id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- ==========================================
-- SAMPLE DATA FOR CLIENT DEMO
-- ==========================================

-- Insert Default Hotel
INSERT INTO hotels (hotel_id, hotel_name, city, state, address) 
VALUES ('H-001', 'Hotel Satyam', 'Visakhapatnam', 'Andhra Pradesh', 'Beach Road, Vizag');

-- Insert Room Types
INSERT INTO room_types (room_type_id, hotel_id, room_type_name, max_adults, max_children, base_price, amenities) VALUES
('RT-STD', 'H-001', 'Standard Room', 2, 1, 2000.00, 'Free WiFi, AC, TV'),
('RT-DLX', 'H-001', 'Deluxe Room', 2, 2, 3500.00, 'Free WiFi, AC, Smart TV, Sea View, Mini Fridge'),
('RT-BSN', 'H-001', 'Business Suite', 2, 0, 5000.00, 'Free WiFi, AC, Work Desk, Coffee Maker, Lounge Access'),
('RT-FAM', 'H-001', 'Family Suite', 4, 2, 7000.00, 'Free WiFi, AC, 2 Bedrooms, Kitchenette, Bathtub');

-- Insert Rooms (3 of each type)
INSERT INTO rooms (room_id, hotel_id, room_type_id, room_number, floor_no, room_status) VALUES
('RM-101', 'H-001', 'RT-STD', '101', 1, 'available'),
('RM-102', 'H-001', 'RT-STD', '102', 1, 'occupied'),
('RM-103', 'H-001', 'RT-STD', '103', 1, 'available'),

('RM-201', 'H-001', 'RT-DLX', '201', 2, 'available'),
('RM-202', 'H-001', 'RT-DLX', '202', 2, 'available'),
('RM-203', 'H-001', 'RT-DLX', '203', 2, 'maintenance'),

('RM-301', 'H-001', 'RT-BSN', '301', 3, 'available'),
('RM-302', 'H-001', 'RT-BSN', '302', 3, 'available'),

('RM-401', 'H-001', 'RT-FAM', '401', 4, 'available'),
('RM-402', 'H-001', 'RT-FAM', '402', 4, 'available');

-- Insert Demo Admin & Guest
INSERT INTO users (user_id, full_name, email, phone, role) VALUES
('U-ADMIN', 'Satyam Admin', 'admin@hotelsatyam.com', '+919999999999', 'admin'),
('U-001', 'Rakesh Leela', 'rakeshleela5@gmail.com', '+918888888888', 'guest'),
('U-002', 'Demo Client', 'client@demo.com', '+917777777777', 'guest');

-- Insert Sample Bookings
INSERT INTO bookings (booking_id, user_id, hotel_id, room_id, check_in, check_out, nights, adults, children, booking_status, total_amount, payment_status) VALUES
('B-10001', 'U-001', 'H-001', 'RM-102', date('now', '-1 day'), date('now', '+2 days'), 3, 2, 0, 'checked_in', 6000.00, 'paid'),
('B-10002', 'U-002', 'H-001', 'RM-201', date('now', '+5 days'), date('now', '+7 days'), 2, 2, 1, 'confirmed', 7000.00, 'partial');

-- Insert Sample Payments
INSERT INTO payments (payment_id, booking_id, amount, method, payment_status, paid_at, transaction_ref) VALUES
('PAY-901', 'B-10001', 6000.00, 'upi', 'success', datetime('now', '-1 day'), 'UPI-1234567890'),
('PAY-902', 'B-10002', 3500.00, 'card', 'success', datetime('now', '-2 days'), 'TXN-ABC987654');

-- Insert Sample Events
INSERT INTO booking_events (event_id, booking_id, event_type, event_note, created_by) VALUES
('EV-001', 'B-10001', 'CHECK_IN', 'Guest arrived at 2:00 PM', 'U-ADMIN'),
('EV-002', 'B-10002', 'DEPOSIT_PAID', 'Advanced 50% deposit received', 'U-ADMIN');

CREATE TABLE waitlist (
  waitlist_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  room_type_id TEXT NOT NULL,
  preferred_dates TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

