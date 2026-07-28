-- =============================================================================
--  V008 — Payments, Invoices, Receipts & Document Sequences
-- =============================================================================

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) NOT NULL,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id),
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'CASH',
    payment_kind VARCHAR(40) NOT NULL DEFAULT 'PAYMENT',
    status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
    transaction_reference VARCHAR(100),
    notes TEXT,
    payment_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT ck_payments__method CHECK (payment_method IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'KHQR', 'OTHER')),
    CONSTRAINT ck_payments__kind CHECK (payment_kind IN ('DEPOSIT', 'PAYMENT', 'REFUND')),
    CONSTRAINT ck_payments__status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
);

CREATE UNIQUE INDEX uq_payments__property_number ON payments (property_id, payment_number);
CREATE INDEX ix_payments__reservation ON payments (reservation_id);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id),
    invoice_type VARCHAR(40) NOT NULL DEFAULT 'STANDARD',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(40) NOT NULL DEFAULT 'ISSUED',
    due_date DATE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT ck_invoices__type CHECK (invoice_type IN ('STANDARD', 'TAX_INVOICE')),
    CONSTRAINT ck_invoices__status CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED'))
);

CREATE UNIQUE INDEX uq_invoices__property_number ON invoices (property_id, invoice_number);

-- Receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id),
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE UNIQUE INDEX uq_receipts__property_number ON receipts (property_id, receipt_number);

-- Seed Document Sequences for PAY, INV, RCT in 2026
INSERT INTO document_sequences (property_id, sequence_type, year, current_value) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'PAYMENT', 2026, 1),
    ('a0000000-0000-0000-0000-000000000001', 'INVOICE', 2026, 1),
    ('a0000000-0000-0000-0000-000000000001', 'RECEIPT', 2026, 1);

-- Seed Demo Payment for RSV-2026-000001
INSERT INTO payments (id, property_id, payment_number, reservation_id, guest_id, amount, payment_method, payment_kind, status, transaction_reference)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'PAY-2026-000001',
    'b1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    66.00,
    'CASH',
    'PAYMENT',
    'COMPLETED',
    'TXN-998811'
);

-- Seed Demo Invoice & Receipt
INSERT INTO invoices (id, property_id, invoice_number, reservation_id, guest_id, invoice_type, subtotal, tax_amount, grand_total, status)
VALUES (
    'c2000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'INV-2026-000001',
    'b1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'STANDARD',
    60.00,
    6.00,
    66.00,
    'PAID'
);

INSERT INTO receipts (id, property_id, receipt_number, payment_id, reservation_id, guest_id, amount)
VALUES (
    'c3000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'RCT-2026-000001',
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    66.00
);
