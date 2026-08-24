package com.cbrsx.backend.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class StartSessionRequest {
    @Size(max = 64, message = "traineeId must not exceed 64 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "traineeId may only contain letters, digits, dashes and underscores")
    private String traineeId;
    @Size(max = 120, message = "traineeName must not exceed 120 characters")
    private String traineeName;
    @Size(max = 100, message = "batchUnit must not exceed 100 characters")
    private String batchUnit;
    @Size(max = 50, message = "scenarioCode must not exceed 50 characters")
    private String scenarioCode;

    public StartSessionRequest() {}

    public StartSessionRequest(String traineeId, String traineeName, String batchUnit, String scenarioCode) {
        this.traineeId = traineeId;
        this.traineeName = traineeName;
        this.batchUnit = batchUnit;
        this.scenarioCode = scenarioCode;
    }

    public String getTraineeId() { return traineeId; }
    public void setTraineeId(String traineeId) { this.traineeId = traineeId; }

    public String getTraineeName() { return traineeName; }
    public void setTraineeName(String traineeName) { this.traineeName = traineeName; }

    public String getBatchUnit() { return batchUnit; }
    public void setBatchUnit(String batchUnit) { this.batchUnit = batchUnit; }

    public String getScenarioCode() { return scenarioCode; }
    public void setScenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; }

    public static StartSessionRequestBuilder builder() { return new StartSessionRequestBuilder(); }

    public static class StartSessionRequestBuilder {
        @Size(max = 64, message = "traineeId must not exceed 64 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "traineeId may only contain letters, digits, dashes and underscores")
    private String traineeId;
        @Size(max = 120, message = "traineeName must not exceed 120 characters")
    private String traineeName;
        @Size(max = 100, message = "batchUnit must not exceed 100 characters")
    private String batchUnit;
        @Size(max = 50, message = "scenarioCode must not exceed 50 characters")
    private String scenarioCode;

        public StartSessionRequestBuilder traineeId(String traineeId) { this.traineeId = traineeId; return this; }
        public StartSessionRequestBuilder traineeName(String traineeName) { this.traineeName = traineeName; return this; }
        public StartSessionRequestBuilder batchUnit(String batchUnit) { this.batchUnit = batchUnit; return this; }
        public StartSessionRequestBuilder scenarioCode(String scenarioCode) { this.scenarioCode = scenarioCode; return this; }

        public StartSessionRequest build() {
            return new StartSessionRequest(traineeId, traineeName, batchUnit, scenarioCode);
        }
    }
}

