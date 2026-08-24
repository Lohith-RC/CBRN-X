package com.cbrsx.backend.dto;

import java.time.Instant;

public class MistakeDetailDTO {
    private String stage;
    private String description;
    private int deductionPoints;
    private String severity;
    private Instant timestamp;

    public MistakeDetailDTO() {}

    public MistakeDetailDTO(String stage, String description, int deductionPoints, String severity, Instant timestamp) {
        this.stage = stage;
        this.description = description;
        this.deductionPoints = deductionPoints;
        this.severity = severity;
        this.timestamp = timestamp;
    }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getDeductionPoints() { return deductionPoints; }
    public void setDeductionPoints(int deductionPoints) { this.deductionPoints = deductionPoints; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public static MistakeDetailDTOBuilder builder() { return new MistakeDetailDTOBuilder(); }

    public static class MistakeDetailDTOBuilder {
        private String stage;
        private String description;
        private int deductionPoints;
        private String severity;
        private Instant timestamp;

        public MistakeDetailDTOBuilder stage(String stage) { this.stage = stage; return this; }
        public MistakeDetailDTOBuilder description(String description) { this.description = description; return this; }
        public MistakeDetailDTOBuilder deductionPoints(int deductionPoints) { this.deductionPoints = deductionPoints; return this; }
        public MistakeDetailDTOBuilder severity(String severity) { this.severity = severity; return this; }
        public MistakeDetailDTOBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

        public MistakeDetailDTO build() {
            return new MistakeDetailDTO(stage, description, deductionPoints, severity, timestamp);
        }
    }
}
