package com.guesthouse.service;

import com.guesthouse.audit.AuditEvent;
import com.guesthouse.dto.audit.AuditLogResponse;
import com.guesthouse.entity.AuditLog;
import com.guesthouse.repository.AuditLogRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditService {

    private final ApplicationEventPublisher eventPublisher;
    private final AuditLogRepository auditLogRepository;

    public AuditService(ApplicationEventPublisher eventPublisher, AuditLogRepository auditLogRepository) {
        this.eventPublisher = eventPublisher;
        this.auditLogRepository = auditLogRepository;
    }

    public void record(UUID propertyId, UUID userId, String action, String entityType, UUID entityId,
                        String oldValue, String newValue, String description) {
        eventPublisher.publishEvent(new AuditEvent(propertyId, userId, action, entityType, entityId, oldValue, newValue, description));
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(UUID propertyId, Pageable pageable) {
        return auditLogRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId, pageable).map(this::mapToDto);
    }

    private AuditLogResponse mapToDto(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUserId(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getOldValue(),
                log.getNewValue(),
                log.getDescription(),
                log.getCreatedAt()
        );
    }
}
