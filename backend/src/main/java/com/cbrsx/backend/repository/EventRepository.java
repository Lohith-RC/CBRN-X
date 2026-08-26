package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.SessionEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<SessionEvent, String> {
    List<SessionEvent> findBySessionIdOrderByTimestampAsc(String sessionId);
    Page<SessionEvent> findBySessionIdOrderByTimestampAsc(String sessionId, Pageable pageable);
    Page<SessionEvent> findBySessionIdAndTimestampBetweenOrderByTimestampAsc(
            String sessionId, Instant start, Instant end, Pageable pageable);
    long countBySessionIdAndEventType(String sessionId, String eventType);
    // [R2-02] Used by SessionService to enforce per-session event count limits
    long countBySessionId(String sessionId);
    List<SessionEvent> findBySessionIdIn(Collection<String> sessionIds);
}
