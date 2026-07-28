-- =============================================================================
--  V007 — Front Desk: Check-Ins, Check-Outs & Keycard Tracking
-- =============================================================================

-- Check-Ins table
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id),
    guest_id UUID NOT NULL REFERENCES guests(id),
    key_number VARCHAR(50),
    house_rules_accepted BOOLEAN NOT NULL DEFAULT true,
    vehicle_plate VARCHAR(50),
    notes TEXT,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX ix_check_ins__reservation ON check_ins (reservation_id);
CREATE INDEX ix_check_ins__room ON check_ins (room_id);

-- Check-Outs table
CREATE TABLE check_outs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id),
    guest_id UUID NOT NULL REFERENCES guests(id),
    key_returned BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    check_out_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX ix_check_outs__reservation ON check_outs (reservation_id);

-- Seed Demo Check-In record for checked-in stay (RSV-2026-000001)
INSERT INTO check_ins (property_id, reservation_id, room_id, guest_id, key_number, house_rules_accepted, check_in_time)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000102',
    'b0000000-0000-0000-0000-000000000001',
    'KEY-102',
    true,
    now()
);
