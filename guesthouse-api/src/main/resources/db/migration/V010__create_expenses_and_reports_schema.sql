-- =============================================================================
--  V010 — Expenses & Financial Reporting Schema
-- =============================================================================

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    expense_number VARCHAR(50) NOT NULL,
    category VARCHAR(40) NOT NULL DEFAULT 'OTHER',
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor VARCHAR(150),
    payment_method VARCHAR(40) NOT NULL DEFAULT 'CASH',
    approval_status VARCHAR(40) NOT NULL DEFAULT 'APPROVED',
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT ck_expenses__category CHECK (category IN ('ELECTRICITY', 'WATER', 'INTERNET', 'RENT', 'SALARY', 'SUPPLIES', 'CLEANING', 'MAINTENANCE', 'FOOD', 'TRANSPORTATION', 'MARKETING', 'COMMISSION', 'TAX', 'INSURANCE', 'OTHER')),
    CONSTRAINT ck_expenses__status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE UNIQUE INDEX uq_expenses__property_number ON expenses (property_id, expense_number);
CREATE INDEX ix_expenses__property_date ON expenses (property_id, expense_date);

-- Seed Document Sequence for EXPENSE in 2026
INSERT INTO document_sequences (property_id, sequence_type, year, current_value)
VALUES ('a0000000-0000-0000-0000-000000000001', 'EXPENSE', 2026, 3);

-- Seed Demo Expenses
INSERT INTO expenses (id, property_id, expense_number, category, description, amount, expense_date, vendor, payment_method, approval_status) VALUES
    ('e1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'EXP-2026-000001', 'ELECTRICITY', 'Monthly Electricity Utility Bill', 120.00, '2026-07-15', 'EDC Siem Reap', 'BANK_TRANSFER', 'APPROVED'),
    ('e1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'EXP-2026-000002', 'INTERNET', 'High Speed Fiber Wifi Service', 45.00, '2026-07-10', 'EZECOM', 'CASH', 'APPROVED'),
    ('e1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'EXP-2026-000003', 'SUPPLIES', 'Guest House Amenities & Cleaning Supplies', 80.00, '2026-07-20', 'Local Wholesale Market', 'CASH', 'APPROVED');
