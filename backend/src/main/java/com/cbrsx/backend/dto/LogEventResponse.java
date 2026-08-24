package com.cbrsx.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * [R2-05] API Response DTO for event ingestion.
 * Decouples API response payload from internal JPA SessionEvent entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogEventResponse {
    private String eventId;
    private String sessionId;
    private String eventType;
    private Instant timestamp;
    private String status;
}
