-- CBRS-X Database Schema DDL for PostgreSQL / Supabase / H2(PostgreSQL mode)

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
    event_data TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Performance indexes for hot query paths
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_sessions_trainee_id ON sessions(trainee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_pass_status ON sessions(pass_status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

-- Initial Seed Data using MERGE (H2 + PostgreSQL compatible upsert)
MERGE INTO scenarios (scenario_id, code, title, description, max_score)
KEY (scenario_id)
VALUES ('scen-chem-01', 'CBRN-CHEM-01', 'Chemical Spill Emergency Response', 'Industrial Chemical Leak Incident at Storage Bay 3. Respond with full CBRN protocol: PPE, Hazard Detection, Civilian Evacuation, Containment, Decontamination.', 100);

MERGE INTO scenarios (scenario_id, code, title, description, max_score)
KEY (scenario_id)
VALUES ('scen-rad-02', 'CBRN-RAD-02', 'Radiological Dirty Bomb & Isotope Containment', 'High-Risk Cesium-137 Isotope Dispersion at Reactor Sub-Vault. Equip dosimeter, deploy lead shielding blanket, extract technicians, and secure hot cell perimeter.', 100);

MERGE INTO scenarios (scenario_id, code, title, description, max_score)
KEY (scenario_id)
VALUES ('scen-bio-03', 'CBRN-BIO-03', 'Biological Pathogen Laboratory Breach', 'Level-4 Biosafety Facility Airborne Pathogen Spill. Don PAPR positive-pressure respirator, establish negative pressure airlock, neutralize bio-aerosol, and decontaminate.', 100);
