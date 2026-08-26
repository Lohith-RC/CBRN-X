-- ============================================================================
-- CBRS-X V1: Core Schema Definition (PostgreSQL & H2 Compatible)
-- ============================================================================

-- 1. Trainees Table
CREATE TABLE IF NOT EXISTS trainees (
    trainee_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    batch_unit VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Scenarios Table
CREATE TABLE IF NOT EXISTS scenarios (
    scenario_id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score INT DEFAULT 100
);

-- 3. Training Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    trainee_id VARCHAR(64) REFERENCES trainees(trainee_id) ON DELETE CASCADE,
    scenario_id VARCHAR(64) REFERENCES scenarios(scenario_id) ON DELETE RESTRICT,
    squad_id VARCHAR(64),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    final_score INT,
    pass_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Session Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(session_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Instructor & Administrator Users Table
CREATE TABLE IF NOT EXISTS instructor_users (
    username VARCHAR(64) PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    unit VARCHAR(120),
    role VARCHAR(20) NOT NULL DEFAULT 'INSTRUCTOR',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Persistent Administrative & Security Audit Logs Table
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
