package com.cbrsx.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "instructor_users")
public class InstructorUser {

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_INSTRUCTOR = "INSTRUCTOR";

    @Id
    @Column(name = "username", length = 64)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "unit", length = 120)
    private String unit;

    @Column(name = "role", nullable = false, length = 20)
    private String role = ROLE_INSTRUCTOR;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public InstructorUser() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) { createdAt = Instant.now(); }
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role != null ? role : ROLE_INSTRUCTOR; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
