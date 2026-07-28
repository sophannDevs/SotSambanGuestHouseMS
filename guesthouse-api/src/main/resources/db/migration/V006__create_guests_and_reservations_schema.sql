-- =============================================================================
--  V006 — Guests, Reservations, Document Sequences & Status History
-- =============================================================================

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    id_passport_number VARCHAR(100),
    nationality VARCHAR(100) DEFAULT 'Cambodian',
    vip_level VARCHAR(30) DEFAULT 'STANDARD',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX ix_guests__property_id ON guests (property_id);
CREATE INDEX ix_guests__name ON guests (last_name, first_name);

-- Document Sequences for auto-generating RSV-2026-000001, etc.
CREATE TABLE document_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    sequence_type VARCHAR(40) NOT NULL,
    year INTEGER NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_sequences UNIQUE (property_id, sequence_type, year)
);

-- Reservations table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reservation_number VARCHAR(50) NOT NULL,
    main_guest_id UUID NOT NULL REFERENCES guests(id),
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    assigned_room_id UUID REFERENCES rooms(id),
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    total_nights INTEGER NOT NULL DEFAULT 1,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER NOT NULL DEFAULT 0,
    base_rate NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reservation_status VARCHAR(40) NOT NULL DEFAULT 'CONFIRMED',
    payment_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID',
    source VARCHAR(40) NOT NULL DEFAULT 'DIRECT_WALK_IN',
    external_reference VARCHAR(100),
    special_requests TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_reservations__dates CHECK (departure_date > arrival_date),
    CONSTRAINT ck_reservations__status CHECK (reservation_status IN ('DRAFT', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW')),
    CONSTRAINT ck_reservations__pay_status CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED')),
    CONSTRAINT ck_reservations__source CHECK (source IN ('DIRECT_WALK_IN', 'DIRECT_PHONE', 'DIRECT_EMAIL', 'DIRECT_WEBSITE', 'BOOKING_COM', 'AGODA', 'EXPEDIA', 'AIRBNB', 'TRAVEL_AGENT', 'CORPORATE', 'OTHER'))
);

CREATE UNIQUE INDEX uq_reservations__property_number ON reservations (property_id, reservation_number);
CREATE INDEX ix_reservations__dates ON reservations (property_id, arrival_date, departure_date);
CREATE INDEX ix_reservations__status ON reservations (property_id, reservation_status);

-- Reservation Rooms junction
CREATE TABLE reservation_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id),
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    night_rate NUMERIC(14, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX ix_reservation_rooms__room_dates ON reservation_rooms (room_id, arrival_date, departure_date);

-- Reservation Status History audit log
CREATE TABLE reservation_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    previous_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,
    changed_by UUID,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Document Sequence for 2026
INSERT INTO document_sequences (property_id, sequence_type, year, current_value)
VALUES ('a0000000-0000-0000-0000-000000000001', 'RESERVATION', 2026, 2);

-- Seed Demo Guests
INSERT INTO guests (id, property_id, first_name, last_name, email, phone, nationality, vip_level) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'John', 'Smith', 'john.smith@example.com', '+1 555-0192', 'American', 'VIP_GOLD'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Emma', 'Watson', 'emma.w@example.com', '+44 7700-900077', 'British', 'STANDARD'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'David', 'Miller', 'david.m@example.com', '+61 491-570156', 'Australian', 'STANDARD');

-- Seed Demo Reservations
INSERT INTO reservations (id, property_id, reservation_number, main_guest_id, room_type_id, assigned_room_id, arrival_date, departure_date, total_nights, adults, children, base_rate, tax_amount, total_amount, paid_amount, balance_due, reservation_status, payment_status, source) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'RSV-2026-000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000102', '2026-07-27', '2026-07-29', 2, 2, 0, 30.00, 6.00, 66.00, 66.00, 0.00, 'CHECKED_IN', 'PAID', 'DIRECT_WALK_IN'),
    ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'RSV-2026-000002', 'b0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000104', '2026-07-28', '2026-07-31', 3, 2, 0, 32.00, 9.60, 105.60, 0.00, 105.60, 'CONFIRMED', 'UNPAID', 'BOOKING_COM');

INSERT INTO reservation_rooms (reservation_id, room_id, arrival_date, departure_date, night_rate) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000102', '2026-07-27', '2026-07-29', 30.00),
    ('b1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000104', '2026-07-28', '2026-07-31', 32.00);
