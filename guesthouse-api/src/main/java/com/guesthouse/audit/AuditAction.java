package com.guesthouse.audit;

/**
 * Kept in sync with the ck_audit_logs__action CHECK constraint in
 * V013__create_audit_logs_schema.sql — add a value in both places together.
 */
public final class AuditAction {

    public static final String BOOKING_CANCELLED = "BOOKING_CANCELLED";
    public static final String PRICE_MODIFIED = "PRICE_MODIFIED";
    public static final String STAFF_ACCESSED = "STAFF_ACCESSED";

    private AuditAction() {
    }
}
