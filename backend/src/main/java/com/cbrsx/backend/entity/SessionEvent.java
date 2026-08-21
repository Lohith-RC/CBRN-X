package com.cbrsx.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "events")
public class SessionEvent {

    @Id
    @Column(name = "event_id", length = 64)
    private String eventId;

    @Column(name = "session_id", length = 64, nullable = false)
    private String sessionId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "event_data", columnDefinition = "TEXT")
    private String eventData;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public SessionEvent() {}

    public SessionEvent(String eventId, String sessionId, String eventType, String eventData, Instant timestamp) {
        this.eventId = eventId;
        this.sessionId = sessionId;
        this.eventType = eventType;
        this.eventData = eventData;
        this.timestamp = timestamp;
    }

    @PrePersist
    public void prePersist() {
        if (timestamp == null) { timestamp = Instant.now(); }
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventData() { return eventData; }
    public void setEventData(String eventData) { this.eventData = eventData; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public static SessionEventBuilder builder() { return new SessionEventBuilder(); }

    public static class SessionEventBuilder {
        private String eventId;
        private String sessionId;
        private String eventType;
        private String eventData;
        private Instant timestamp;

        public SessionEventBuilder eventId(String eventId) { this.eventId = eventId; return this; }
        public SessionEventBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public SessionEventBuilder eventType(String eventType) { this.eventType = eventType; return this; }
        public SessionEventBuilder eventData(String eventData) { this.eventData = eventData; return this; }
        public SessionEventBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

        public SessionEvent build() {
            return new SessionEvent(eventId, sessionId, eventType, eventData, timestamp);
        }
    }
}
