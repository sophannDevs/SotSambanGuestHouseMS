package com.guesthouse.audit;

import java.util.UUID;

/**
 * Published by services when a critical action happens (see AuditAction) and
 * consumed by AuditEventListener, which is the only place that writes to
 * audit_logs. Publishing is decoupled from persistence so callers don't need
 * an AuditLogRepository dependency, and so the write only lands if the
 * originating transaction actually commits (see @TransactionalEventListener
 * on the listener).
 */
public class AuditEvent {

    private final UUID propertyId;
    private final UUID userId;
    private final String action;
    private final String entityType;
    private final UUID entityId;
    private final String oldValue;
    private final String newValue;
    private final String description;

    public AuditEvent(UUID propertyId, UUID userId, String action, String entityType, UUID entityId,
                       String oldValue, String newValue, String description) {
        this.propertyId = propertyId;
        this.userId = userId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.description = description;
    }

    public UUID getPropertyId() {
        return propertyId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public String getOldValue() {
        return oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public String getDescription() {
        return description;
    }
}
