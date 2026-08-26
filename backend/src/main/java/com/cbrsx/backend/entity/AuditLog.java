package com.cbrsx.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @Column(name = "audit_id", length = 64)
    private String auditId;

    @Column(name = "action_type", length = 100, nullable = false)
    private String actionType;

    @Column(name = "actor_username", length = 64, nullable = false)
    private String actorUsername;

    @Column(name = "target_resource", length = 255)
    private String targetResource;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "SUCCESS";

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp;

    public AuditLog() {}

    public AuditLog(String auditId, String actionType, String actorUsername, String targetResource, String ipAddress, String status, String details, Instant timestamp) {
        this.auditId = auditId;
        this.actionType = actionType;
        this.actorUsername = actorUsername;
        this.targetResource = targetResource;
        this.ipAddress = ipAddress;
        this.status = status != null ? status : "SUCCESS";
        this.details = details;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    public String getAuditId() { return auditId; }
    public void setAuditId(String auditId) { this.auditId = auditId; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }

    public String getTargetResource() { return targetResource; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public static AuditLogBuilder builder() { return new AuditLogBuilder(); }

    public static class AuditLogBuilder {
        private String auditId;
        private String actionType;
        private String actorUsername;
        private String targetResource;
        private String ipAddress;
        private String status = "SUCCESS";
        private String details;
        private Instant timestamp;

        public AuditLogBuilder auditId(String auditId) { this.auditId = auditId; return this; }
        public AuditLogBuilder actionType(String actionType) { this.actionType = actionType; return this; }
        public AuditLogBuilder actorUsername(String actorUsername) { this.actorUsername = actorUsername; return this; }
        public AuditLogBuilder targetResource(String targetResource) { this.targetResource = targetResource; return this; }
        public AuditLogBuilder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public AuditLogBuilder status(String status) { this.status = status; return this; }
        public AuditLogBuilder details(String details) { this.details = details; return this; }
        public AuditLogBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }

        public AuditLog build() {
            return new AuditLog(auditId, actionType, actorUsername, targetResource, ipAddress, status, details, timestamp);
        }
    }
}
