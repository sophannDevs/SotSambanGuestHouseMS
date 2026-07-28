-- =============================================================================
--  V013 — Audit Logs: security & activity trail for critical actions
--
--  Distinct from per-entity history tables (booking_status_history,
--  room_status_history, login_history): those record every state change for
--  operational purposes, this records only the subset of actions that matter
--  for security review (cancellations, price changes, sensitive-data access).
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id UUID,
    old_value VARCHAR(500),
    new_value VARCHAR(500),
    description VARCHAR(500),
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_audit_logs__action CHECK (action IN ('BOOKING_CANCELLED', 'PRICE_MODIFIED', 'STAFF_ACCESSED'))
);

CREATE INDEX ix_audit_logs__property_id ON audit_logs (property_id, created_at DESC);
CREATE INDEX ix_audit_logs__user_id ON audit_logs (user_id);
CREATE INDEX ix_audit_logs__action ON audit_logs (action);
CREATE INDEX ix_audit_logs__entity ON audit_logs (entity_type, entity_id);
