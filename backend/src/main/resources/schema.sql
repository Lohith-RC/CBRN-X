-- CBRS-X Database Schema DDL for Supabase / PostgreSQL

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
    trainee_id VARCHAR(64) REFERENCES trainees(trainee_id),
    scenario_id VARCHAR(64) REFERENCES scenarios(scenario_id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    final_score INT,
    pass_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Session Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES sessions(session_id),
    event_type VARCHAR(100) NOT NULL,
    event_data TEXT, -- JSON string representation
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Initial Seed Data for Scenario CBRN-CHEM-01 (Cross-database MERGE)
MERGE INTO scenarios (scenario_id, code, title, description, max_score) KEY (scenario_id)
VALUES ('scen-chem-01', 'CBRN-CHEM-01', 'Chemical Spill Emergency Response', 'Industrial Chemical Leak Incident at Storage Bay 3. Respond with full CBRN protocol: PPE, Hazard Detection, Civilian Evacuation, Containment, Decontamination.', 100);
