-- =============================================================================
--  V005 — Amenities, Room Types, Rooms, Room Blocks, Rates & Status History
-- =============================================================================

-- Amenities catalogue
CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    category VARCHAR(40) NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50),
    is_global BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_amenities__category CHECK (category IN ('COMFORT', 'BATHROOM', 'ENTERTAINMENT', 'KITCHEN', 'OUTDOOR', 'SERVICE', 'ACCESSIBILITY', 'OTHER'))
);

-- Room Types table
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    description TEXT,
    base_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    extra_bed_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    extra_person_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cleaning_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    default_deposit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    max_adults INTEGER NOT NULL DEFAULT 2,
    max_children INTEGER NOT NULL DEFAULT 1,
    bed_count INTEGER NOT NULL DEFAULT 1,
    bed_type VARCHAR(40) NOT NULL DEFAULT 'DOUBLE',
    room_size_sqm NUMERIC(8, 2),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_room_types__bed_type CHECK (bed_type IN ('SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK', 'SOFA_BED'))
);

CREATE UNIQUE INDEX uq_room_types__property_code ON room_types (property_id, code) WHERE deleted_at IS NULL;

-- Room Type Amenities junction
CREATE TABLE room_type_amenities (
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (room_type_id, amenity_id)
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    room_number VARCHAR(30) NOT NULL,
    room_name VARCHAR(100),
    floor INTEGER NOT NULL DEFAULT 1,
    building VARCHAR(50) DEFAULT 'Main',
    max_occupancy INTEGER NOT NULL DEFAULT 2,
    operational_status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE',
    housekeeping_status VARCHAR(40) NOT NULL DEFAULT 'CLEAN',
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_rooms__op_status CHECK (operational_status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'OUT_OF_SERVICE', 'BLOCKED', 'UNDER_MAINTENANCE')),
    CONSTRAINT ck_rooms__hk_status CHECK (housekeeping_status IN ('CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED', 'DO_NOT_DISTURB', 'CLEANING_REQUESTED', 'OUT_OF_SERVICE'))
);

CREATE UNIQUE INDEX uq_rooms__property_room_number ON rooms (property_id, room_number) WHERE deleted_at IS NULL;
CREATE INDEX ix_rooms__property_type ON rooms (property_id, room_type_id);

-- Room Blocks table
CREATE TABLE room_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(40) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT ck_room_blocks__dates CHECK (end_date > start_date),
    CONSTRAINT ck_room_blocks__reason CHECK (reason IN ('MAINTENANCE', 'RENOVATION', 'OWNER_USE', 'DEEP_CLEANING', 'INSPECTION', 'OTHER'))
);

CREATE INDEX ix_room_blocks__room_dates ON room_blocks (room_id, start_date, end_date);

-- Room Status History table (Append-only)
CREATE TABLE room_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    previous_operational_status VARCHAR(40),
    new_operational_status VARCHAR(40),
    previous_housekeeping_status VARCHAR(40),
    new_housekeeping_status VARCHAR(40),
    changed_by UUID,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_room_status_history__room_id ON room_status_history (room_id);

-- Rate Plans table
CREATE TABLE rate_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    plan_type VARCHAR(40) NOT NULL DEFAULT 'BASE',
    adjustment_type VARCHAR(40) NOT NULL DEFAULT 'FIXED_PRICE',
    adjustment_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_rate_plans__type CHECK (plan_type IN ('BASE', 'SEASONAL', 'WEEKEND', 'HOLIDAY', 'LONG_STAY', 'CORPORATE', 'TRAVEL_AGENT', 'PROMOTIONAL', 'LAST_MINUTE')),
    CONSTRAINT ck_rate_plans__adj CHECK (adjustment_type IN ('FIXED_PRICE', 'FIXED_INCREASE', 'FIXED_DECREASE', 'PERCENT_INCREASE', 'PERCENT_DECREASE'))
);

-- Seed 16 Standard Amenities
INSERT INTO amenities (id, property_id, category, name, icon_name, is_global) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'COMFORT', 'Air Conditioning', 'Wind', true),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'COMFORT', 'Ceiling Fan', 'Fan', true),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'ENTERTAINMENT', 'Flat Screen TV', 'Tv', true),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'SERVICE', 'Free Wi-Fi', 'Wifi', true),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'BATHROOM', 'Hot Water Shower', 'ShowerHead', true),
    ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'BATHROOM', 'Private Bathroom', 'Bath', true),
    ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'KITCHEN', 'Mini Refrigerator', 'Refrigerator', true),
    ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'COMFORT', 'Work Desk & Chair', 'Armchair', true);

-- Seed 6 Standard Room Types
INSERT INTO room_types (id, property_id, name, code, description, base_price, extra_bed_price, extra_person_price, max_adults, max_children, bed_count, bed_type, room_size_sqm, sort_order) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Single Room', 'SGL', 'Cozy room for solo travelers', 20.00, 5.00, 5.00, 1, 0, 1, 'SINGLE', 16.00, 1),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Standard Double Room', 'DBL', 'Comfortable double bed room', 30.00, 10.00, 5.00, 2, 1, 1, 'DOUBLE', 22.00, 2),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Standard Twin Room', 'TWN', 'Two single beds for friends', 32.00, 10.00, 5.00, 2, 1, 2, 'TWIN', 24.00, 3),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Deluxe King Room', 'DLX', 'Spacious room with King bed & balcony', 45.00, 15.00, 10.00, 2, 1, 1, 'KING', 30.00, 4),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Family Suite', 'FAM', 'Large suite for families', 60.00, 15.00, 10.00, 4, 2, 2, 'QUEEN', 45.00, 5);

-- Seed 20 Demo Rooms Across Floor 1 & Floor 2
INSERT INTO rooms (id, property_id, room_type_id, room_number, room_name, floor, max_occupancy, operational_status, housekeeping_status, sort_order) VALUES
    ('e0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '101', 'Room 101', 1, 1, 'AVAILABLE', 'CLEAN', 1),
    ('e0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '102', 'Room 102', 1, 2, 'OCCUPIED', 'DIRTY', 2),
    ('e0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '103', 'Room 103', 1, 2, 'AVAILABLE', 'CLEAN', 3),
    ('e0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', '104', 'Room 104', 1, 2, 'RESERVED', 'CLEAN', 4),
    ('e0000000-0000-0000-0000-000000000105', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', '105', 'Room 105', 1, 2, 'BLOCKED', 'CLEAN', 5),
    ('e0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '201', 'Room 201', 2, 2, 'AVAILABLE', 'DIRTY', 6),
    ('e0000000-0000-0000-0000-000000000202', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', '202', 'Room 202', 2, 4, 'OCCUPIED', 'CLEAN', 7);

-- Seed Standard Rate Plan
INSERT INTO rate_plans (id, property_id, name, code, plan_type, adjustment_type, adjustment_value, is_active) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard Rate', 'STD', 'BASE', 'FIXED_PRICE', 0.00, true);
