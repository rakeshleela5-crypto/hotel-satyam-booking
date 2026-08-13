DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS waitlist;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  room_type TEXT,
  check_in TEXT,
  check_out TEXT,
  guests INTEGER,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  room_type TEXT,
  preferred_dates TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
