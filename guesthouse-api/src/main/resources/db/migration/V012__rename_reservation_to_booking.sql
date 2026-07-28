-- =============================================================================
--  V012 — Rename Reservation to Booking Across Schemas & Permissions
-- =============================================================================

-- 1. Rename tables
ALTER TABLE IF EXISTS reservations RENAME TO bookings;
ALTER TABLE IF EXISTS reservation_rooms RENAME TO booking_rooms;
ALTER TABLE IF EXISTS reservation_status_history RENAME TO booking_status_history;

-- 2. Rename columns in bookings table
ALTER TABLE IF EXISTS bookings RENAME COLUMN reservation_number TO booking_number;
ALTER TABLE IF EXISTS bookings RENAME COLUMN reservation_status TO booking_status;

-- 3. Rename foreign key columns referencing bookings table
ALTER TABLE IF EXISTS booking_rooms RENAME COLUMN reservation_id TO booking_id;
ALTER TABLE IF EXISTS booking_status_history RENAME COLUMN reservation_id TO booking_id;
ALTER TABLE IF EXISTS check_ins RENAME COLUMN reservation_id TO booking_id;
ALTER TABLE IF EXISTS check_outs RENAME COLUMN reservation_id TO booking_id;
ALTER TABLE IF EXISTS payments RENAME COLUMN reservation_id TO booking_id;
ALTER TABLE IF EXISTS invoices RENAME COLUMN reservation_id TO booking_id;
ALTER TABLE IF EXISTS receipts RENAME COLUMN reservation_id TO booking_id;

-- 4. Rename constraints on bookings
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS ck_reservations__dates;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS ck_reservations__status;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS ck_reservations__pay_status;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS ck_reservations__source;

ALTER TABLE IF EXISTS bookings ADD CONSTRAINT ck_bookings__dates CHECK (departure_date > arrival_date);
ALTER TABLE IF EXISTS bookings ADD CONSTRAINT ck_bookings__status CHECK (booking_status IN ('DRAFT', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'));
ALTER TABLE IF EXISTS bookings ADD CONSTRAINT ck_bookings__pay_status CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'));
ALTER TABLE IF EXISTS bookings ADD CONSTRAINT ck_bookings__source CHECK (source IN ('DIRECT_WALK_IN', 'DIRECT_PHONE', 'DIRECT_EMAIL', 'DIRECT_WEBSITE', 'BOOKING_COM', 'AGODA', 'EXPEDIA', 'AIRBNB', 'TRAVEL_AGENT', 'CORPORATE', 'OTHER'));

-- 5. Rename indexes
ALTER INDEX IF EXISTS uq_reservations__property_number RENAME TO uq_bookings__property_number;
ALTER INDEX IF EXISTS ix_reservations__dates RENAME TO ix_bookings__dates;
ALTER INDEX IF EXISTS ix_reservations__status RENAME TO ix_bookings__status;
ALTER INDEX IF EXISTS ix_reservation_rooms__room_dates RENAME TO ix_booking_rooms__room_dates;
ALTER INDEX IF EXISTS ix_check_ins__reservation RENAME TO ix_check_ins__booking;
ALTER INDEX IF EXISTS ix_check_outs__reservation RENAME TO ix_check_outs__booking;
ALTER INDEX IF EXISTS ix_payments__reservation RENAME TO ix_payments__booking;

-- 6. Update document_sequences sequence_type
UPDATE document_sequences SET sequence_type = 'BOOKING' WHERE sequence_type = 'RESERVATION';

-- 7. Update permissions keys and modules
UPDATE permissions SET module = 'booking', permission_key = REPLACE(permission_key, 'reservation:', 'booking:'), description = REPLACE(description, 'reservation', 'booking') WHERE module = 'reservation' OR permission_key LIKE 'reservation:%';
UPDATE permissions SET description = REPLACE(description, 'Reservation', 'Booking') WHERE description LIKE '%Reservation%';
