package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.SessionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<SessionEvent, String> {
    List<SessionEvent> findBySessionIdOrderByTimestampAsc(String sessionId);
    long countBySessionIdAndEventType(String sessionId, String eventType);
    List<SessionEvent> findBySessionIdIn(Collection<String> sessionIds);
}
