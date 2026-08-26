package com.cbrsx.backend.service;

import com.cbrsx.backend.entity.AuditLog;
import com.cbrsx.backend.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog logAction(String actionType, String actorUsername, String targetResource, String ipAddress, String status, String details) {
        AuditLog auditLog = AuditLog.builder()
                .auditId("audit-" + UUID.randomUUID())
                .actionType(actionType)
                .actorUsername(actorUsername != null ? actorUsername : "anonymous")
                .targetResource(targetResource)
                .ipAddress(ipAddress)
                .status(status != null ? status : "SUCCESS")
                .details(details)
                .timestamp(Instant.now())
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("[AUDIT] Action: {}, Actor: {}, Target: {}, Status: {}", actionType, actorUsername, targetResource, status);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getPagedLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
