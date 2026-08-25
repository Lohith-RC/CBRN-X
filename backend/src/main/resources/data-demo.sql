-- Initial Sample Trainees
-- Portable idempotent seeds: INSERT ... SELECT ... WHERE NOT EXISTS works on
-- PostgreSQL / Supabase and all H2 modes. ANSI INTERVAL arithmetic only.
INSERT INTO trainees (trainee_id, name, batch_unit, created_at)
SELECT 'tr-001', 'Inspector Lohith R C', '10th NDRF Battalion', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM trainees WHERE trainee_id = 'tr-001');

INSERT INTO trainees (trainee_id, name, batch_unit, created_at)
SELECT 'tr-002', 'Sub-Inspector Ananya Rao', '4th NDRF Battalion', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM trainees WHERE trainee_id = 'tr-002');

INSERT INTO trainees (trainee_id, name, batch_unit, created_at)
SELECT 'tr-003', 'Constable Rajesh Kumar', '8th NDRF Battalion', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM trainees WHERE trainee_id = 'tr-003');

-- Initial Sample Training Sessions
INSERT INTO sessions (session_id, trainee_id, scenario_id, started_at, completed_at, final_score, pass_status, created_at)
SELECT 'sess-demo-01', 'tr-001', 'scen-chem-01',
       CURRENT_TIMESTAMP - INTERVAL '2' HOUR, CURRENT_TIMESTAMP - INTERVAL '1' HOUR,
       92, 'PASSED', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = 'sess-demo-01');

INSERT INTO sessions (session_id, trainee_id, scenario_id, started_at, completed_at, final_score, pass_status, created_at)
SELECT 'sess-demo-02', 'tr-002', 'scen-chem-01',
       CURRENT_TIMESTAMP - INTERVAL '4' HOUR, CURRENT_TIMESTAMP - INTERVAL '3' HOUR,
       68, 'FAILED', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = 'sess-demo-02');

INSERT INTO sessions (session_id, trainee_id, scenario_id, started_at, completed_at, final_score, pass_status, created_at)
SELECT 'sess-demo-03', 'tr-003', 'scen-rad-02',
       CURRENT_TIMESTAMP - INTERVAL '6' HOUR, CURRENT_TIMESTAMP - INTERVAL '5' HOUR,
       88, 'PASSED', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = 'sess-demo-03');
