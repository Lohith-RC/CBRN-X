package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    Page<AuditLog> findByActorUsername(String actorUsername, Pageable pageable);
    Page<AuditLog> findByActionType(String actionType, Pageable pageable);
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
}
