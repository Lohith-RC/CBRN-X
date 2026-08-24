package com.cbrsx.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "scenarios")
public class Scenario {

    @Id
    @Column(name = "scenario_id", length = 64)
    private String scenarioId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_score")
    private Integer maxScore = 100;

    public Scenario() {}

    public Scenario(String scenarioId, String code, String title, String description, Integer maxScore) {
        this.scenarioId = scenarioId;
        this.code = code;
        this.title = title;
        this.description = description;
        this.maxScore = maxScore != null ? maxScore : 100;
    }

    public String getScenarioId() { return scenarioId; }
    public void setScenarioId(String scenarioId) { this.scenarioId = scenarioId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getMaxScore() { return maxScore; }
    public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }

    public static ScenarioBuilder builder() { return new ScenarioBuilder(); }

    public static class ScenarioBuilder {
        private String scenarioId;
        private String code;
        private String title;
        private String description;
        private Integer maxScore = 100;

        public ScenarioBuilder scenarioId(String scenarioId) { this.scenarioId = scenarioId; return this; }
        public ScenarioBuilder code(String code) { this.code = code; return this; }
        public ScenarioBuilder title(String title) { this.title = title; return this; }
        public ScenarioBuilder description(String description) { this.description = description; return this; }
        public ScenarioBuilder maxScore(Integer maxScore) { this.maxScore = maxScore; return this; }

        public Scenario build() {
            return new Scenario(scenarioId, code, title, description, maxScore);
        }
    }
}
