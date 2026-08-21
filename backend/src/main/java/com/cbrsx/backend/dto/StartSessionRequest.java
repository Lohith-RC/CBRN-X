package com.cbrsx.backend.dto;

public class StartSessionRequest {
    private String traineeId;
    private String traineeName;
    private String batchUnit;
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
        private String traineeId;
        private String traineeName;
        private String batchUnit;
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
