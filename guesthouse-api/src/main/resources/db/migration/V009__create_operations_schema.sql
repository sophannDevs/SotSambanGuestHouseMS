-- =============================================================================
--  V009 — Housekeeping Tasks & Maintenance Issues
-- =============================================================================

-- Housekeeping Tasks table
CREATE TABLE housekeeping_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    task_type VARCHAR(40) NOT NULL DEFAULT 'CHECKOUT_CLEANING',
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    assigned_staff_id UUID REFERENCES users(id),
    notes TEXT,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT ck_hk_tasks__type CHECK (task_type IN ('CHECKOUT_CLEANING', 'STAY_OVER_CLEANING', 'DEEP_CLEANING', 'GUEST_REQUEST', 'INSPECTION')),
    CONSTRAINT ck_hk_tasks__priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT ck_hk_tasks__status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'INSPECTED', 'CANCELLED'))
);

CREATE INDEX ix_hk_tasks__property_date ON housekeeping_tasks (property_id, scheduled_date);
CREATE INDEX ix_hk_tasks__room ON housekeeping_tasks (room_id);

-- Maintenance Issues table
CREATE TABLE maintenance_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    severity VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(40) NOT NULL DEFAULT 'REPORTED',
    is_blocking BOOLEAN NOT NULL DEFAULT false,
    reported_by UUID,
    assigned_staff_id UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_maint_issues__severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT ck_maint_issues__status CHECK (status IN ('REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'))
);

CREATE INDEX ix_maint_issues__property_status ON maintenance_issues (property_id, status);
CREATE INDEX ix_maint_issues__room ON maintenance_issues (room_id);

-- Seed Demo Housekeeping Task for Room 102
INSERT INTO housekeeping_tasks (id, property_id, room_id, task_type, priority, status, scheduled_date)
VALUES (
    'd1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000102',
    'CHECKOUT_CLEANING',
    'HIGH',
    'PENDING',
    CURRENT_DATE
);

-- Seed Demo Maintenance Issue for Room 105
INSERT INTO maintenance_issues (id, property_id, room_id, title, description, severity, status, is_blocking)
VALUES (
    'd2000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000105',
    'Air Conditioner Water Leak',
    'AC unit dripping water onto floor in Room 105',
    'HIGH',
    'REPORTED',
    true
);
