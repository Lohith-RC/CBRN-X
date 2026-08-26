-- ============================================================================
-- CBRS-X V2: Audit Logs & Advanced Performance Compound Indexes
-- ============================================================================

-- 1. Persistent Administrative & Security Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    actor_username VARCHAR(64) NOT NULL,
    target_resource VARCHAR(255),
    ip_address VARCHAR(45),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Advanced Performance Compound Indexes
CREATE INDEX IF NOT EXISTS idx_events_session_type_time ON events(session_id, event_type, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_sessions_trainee_started ON sessions(trainee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_squad_pass ON sessions(squad_id, pass_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON audit_logs(actor_username, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
