package com.cbrsx.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class LogEventRequest {
    @NotBlank(message = "sessionId is required")
    @Size(max = 64, message = "sessionId must not exceed 64 characters")
    private String sessionId;
    @NotBlank(message = "eventType is required")
    @Pattern(regexp = "^[a-z0-9_]{3,64}$", message = "eventType must be 3-64 chars: lowercase letters, digits, underscores")
    private String eventType;
    @Size(max = 4096, message = "eventData must not exceed 4096 characters")
    private String eventData;
    private Instant timestamp;

    public LogEventRequest() {}

    public LogEventRequest(String sessionId, String eventType, String eventData, Instant timestamp) {
        this.sessionId = sessionId;
        this.eventType = eventType;
        this.eventData = eventData;
        this.timestamp = timestamp;
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventData() { return eventData; }
    public void setEventData(String eventData) { this.eventData = eventData; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public static LogEventRequestBuilder builder() { return new LogEventRequestBuilder(); }

    public static class LogEventRequestBuilder {
        @NotBlank(message = "sessionId is required")
    @Size(max = 64, message = "sessionId must not exceed 64 characters")
    private String sessionId;
        @NotBlank(message = "eventType is required")
    @Pattern(regexp = "^[a-z0-9_]{3,64}$", message = "eventType must be 3-64 chars: lowercase letters, digits, underscores")
    private String eventType;
        @Size(max = 4096, message = "eventData must not exceed 4096 characters")
    private String eventData;
        private Instant timestamp;

        public LogEventRequestBuilder sessionId(String sessionId) { this.sessionId = sessionId; return this; }
        public LogEventRequestBuilder eventType(String eventType) { this.eventType = eventType; return this; }
        public LogEventRequestBuilder eventData(String eventData) { this.eventData = eventData; return this; }
        public LogEventRequestBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

        public LogEventRequest build() {
            return new LogEventRequest(sessionId, eventType, eventData, timestamp);
        }
    }
}

