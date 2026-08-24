package com.cbrsx.backend.dto;

public class ScoreBreakdownDTO {
    private int ppeScore;
    private int detectionScore;
    private int evacuationScore;
    private int containmentScore;
    private int decontaminationScore;
    private int timeBonusScore;
    private int totalPenalties;
    private int netScore;

    public ScoreBreakdownDTO() {}

    public ScoreBreakdownDTO(int ppeScore, int detectionScore, int evacuationScore, int containmentScore, int decontaminationScore, int timeBonusScore, int totalPenalties, int netScore) {
        this.ppeScore = ppeScore;
        this.detectionScore = detectionScore;
        this.evacuationScore = evacuationScore;
        this.containmentScore = containmentScore;
        this.decontaminationScore = decontaminationScore;
        this.timeBonusScore = timeBonusScore;
        this.totalPenalties = totalPenalties;
        this.netScore = netScore;
    }

    public int getPpeScore() { return ppeScore; }
    public void setPpeScore(int ppeScore) { this.ppeScore = ppeScore; }

    public int getDetectionScore() { return detectionScore; }
    public void setDetectionScore(int detectionScore) { this.detectionScore = detectionScore; }

    public int getEvacuationScore() { return evacuationScore; }
    public void setEvacuationScore(int evacuationScore) { this.evacuationScore = evacuationScore; }

    public int getContainmentScore() { return containmentScore; }
    public void setContainmentScore(int containmentScore) { this.containmentScore = containmentScore; }

    public int getDecontaminationScore() { return decontaminationScore; }
    public void setDecontaminationScore(int decontaminationScore) { this.decontaminationScore = decontaminationScore; }

    public int getTimeBonusScore() { return timeBonusScore; }
    public void setTimeBonusScore(int timeBonusScore) { this.timeBonusScore = timeBonusScore; }

    public int getTotalPenalties() { return totalPenalties; }
    public void setTotalPenalties(int totalPenalties) { this.totalPenalties = totalPenalties; }

    public int getnetScore() { return netScore; }
    public void setnetScore(int netScore) { this.netScore = netScore; }

    public static ScoreBreakdownDTOBuilder builder() { return new ScoreBreakdownDTOBuilder(); }

    public static class ScoreBreakdownDTOBuilder {
        private int ppeScore;
        private int detectionScore;
        private int evacuationScore;
        private int containmentScore;
        private int decontaminationScore;
        private int timeBonusScore;
        private int totalPenalties;
        private int netScore;

        public ScoreBreakdownDTOBuilder ppeScore(int ppeScore) { this.ppeScore = ppeScore; return this; }
        public ScoreBreakdownDTOBuilder detectionScore(int detectionScore) { this.detectionScore = detectionScore; return this; }
        public ScoreBreakdownDTOBuilder evacuationScore(int evacuationScore) { this.evacuationScore = evacuationScore; return this; }
        public ScoreBreakdownDTOBuilder containmentScore(int containmentScore) { this.containmentScore = containmentScore; return this; }
        public ScoreBreakdownDTOBuilder decontaminationScore(int decontaminationScore) { this.decontaminationScore = decontaminationScore; return this; }
        public ScoreBreakdownDTOBuilder timeBonusScore(int timeBonusScore) { this.timeBonusScore = timeBonusScore; return this; }
        public ScoreBreakdownDTOBuilder totalPenalties(int totalPenalties) { this.totalPenalties = totalPenalties; return this; }
        public ScoreBreakdownDTOBuilder netScore(int netScore) { this.netScore = netScore; return this; }

        public ScoreBreakdownDTO build() {
            return new ScoreBreakdownDTO(ppeScore, detectionScore, evacuationScore, containmentScore, decontaminationScore, timeBonusScore, totalPenalties, netScore);
        }
    }
}
