-- ============================================================================
-- CBRS-X V2: Performance & Query Optimization Indexes
-- ============================================================================

-- Fast lookup for session events ordered chronologically
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_session_timestamp ON events(session_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_events_session_type_time ON events(session_id, event_type, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Fast lookup for trainee progression & history queries
CREATE INDEX IF NOT EXISTS idx_sessions_trainee_id ON sessions(trainee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainee_started ON sessions(trainee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_pass_status ON sessions(pass_status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_squad_pass ON sessions(squad_id, pass_status);

-- Fast lookup for administrative audit trails
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON audit_logs(actor_username, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
