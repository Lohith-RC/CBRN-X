package com.cbrsx.backend.dto;

import java.time.Instant;

/**
 * [R2-05] API Response DTO for event ingestion.
 * Decouples API response payload from internal JPA SessionEvent entity.
 */
public class LogEventResponse {
    private String eventId;
    private String sessionId;
    private String eventType;
    private Instant timestamp;
    private String status;

    public LogEventResponse() {}

    public LogEventResponse(String eventId, String sessionId, String eventType, Instant timestamp, String status) {
        this.eventId = eventId;
        this.sessionId = sessionId;
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.status = status;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static class Builder {
        private String eventId;
        private String sessionId;
        private String eventType;
        private Instant timestamp;
        private String status;

        public Builder eventId(String eventId) { this.eventId = eventId; return this; }
        public Builder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public Builder eventType(String eventType) { this.eventType = eventType; return this; }
        public Builder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }
        public Builder status(String status) { this.status = status; return this; }

        public LogEventResponse build() {
            return new LogEventResponse(eventId, sessionId, eventType, timestamp, status);
        }
    }
}
