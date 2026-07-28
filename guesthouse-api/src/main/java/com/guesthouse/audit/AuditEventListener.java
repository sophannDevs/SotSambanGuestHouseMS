package com.guesthouse.audit;

import com.guesthouse.entity.AuditLog;
import com.guesthouse.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AuditEventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditEventListener.class);

    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // AFTER_COMMIT: a cancelled booking that gets rolled back (e.g. a later
    // validation error in the same transaction) must not leave behind an
    // audit entry claiming it happened. fallbackExecution=true covers
    // publishers with no active transaction (e.g. a plain read-only GET like
    // the staff directory view) — without it, TransactionalEventListener
    // silently drops events that have no transaction to hook AFTER_COMMIT to.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAuditEvent(AuditEvent event) {
        try {
            AuditLog entry = new AuditLog();
            entry.setPropertyId(event.getPropertyId());
            entry.setUserId(event.getUserId());
            entry.setAction(event.getAction());
            entry.setEntityType(event.getEntityType());
            entry.setEntityId(event.getEntityId());
            entry.setOldValue(event.getOldValue());
            entry.setNewValue(event.getNewValue());
            entry.setDescription(event.getDescription());
            auditLogRepository.save(entry);
        } catch (Exception ex) {
            // The business action already committed; a failure to persist its
            // audit trail must not surface as an error back to the caller.
            log.error("Failed to persist audit log for action {}: {}", event.getAction(), ex.getMessage(), ex);
        }
    }
}
