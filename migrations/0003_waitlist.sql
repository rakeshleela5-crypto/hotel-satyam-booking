CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  room_type_id TEXT,
  preferred_dates TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
