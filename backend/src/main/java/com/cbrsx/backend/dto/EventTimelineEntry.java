package com.cbrsx.backend.dto;

import java.time.Instant;

/**
 * A single entry in a session's chronological event timeline.
 * Severity mirrors DebriefService classification rules so instructors see
 * exactly what was logged — nothing is synthesized on the frontend.
 */
public record EventTimelineEntry(
        Instant timestamp,
        String eventType,
        String severity) {

    public static final String SEVERITY_VIOLATION = "VIOLATION";
    public static final String SEVERITY_WARNING = "WARNING";
    public static final String SEVERITY_SUCCESS = "SUCCESS";
    public static final String SEVERITY_INFO = "INFO";

    public static String classifySeverity(String eventType, String eventData) {
        if (eventType == null) {
            return SEVERITY_INFO;
        }
        if ("entered_hazard_zone_without_ppe".equals(eventType) || "evacuation_incomplete".equals(eventType)
                || eventType.contains("without_ppe") || eventType.contains("incomplete")
                || "session_voided".equals(eventType)) {
            return SEVERITY_VIOLATION;
        }
        if ((eventType.contains("identified") || eventType.contains("leak") || eventType.contains("source"))
                && eventData != null && eventData.contains("\"correct\"") && eventData.contains("false")) {
            return SEVERITY_WARNING;
        }
        if (eventType.contains("completed") || eventType.contains("equipped") || eventType.contains("evacuated")
                || eventType.contains("extracted") || eventType.contains("deployed") || eventType.contains("sealed")) {
            return SEVERITY_SUCCESS;
        }
        return SEVERITY_INFO;
    }
}
