ALTER TABLE bookings ADD COLUMN razorpay_order_id TEXT;
ALTER TABLE bookings ADD COLUMN razorpay_payment_id TEXT;
ALTER TABLE bookings ADD COLUMN razorpay_signature TEXT;
ALTER TABLE bookings ADD COLUMN booking_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN refund_status TEXT DEFAULT 'none';
ALTER TABLE bookings ADD COLUMN refund_amount INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id
ON bookings (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_status
ON bookings (booking_status);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
ON bookings (payment_status);
