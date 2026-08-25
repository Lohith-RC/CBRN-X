-- Initial Sample Trainees
MERGE INTO trainees (trainee_id, name, batch_unit, created_at)
KEY (trainee_id)
VALUES ('tr-001', 'Inspector Lohith R C', '10th NDRF Battalion', CURRENT_TIMESTAMP);

MERGE INTO trainees (trainee_id, name, batch_unit, created_at)
KEY (trainee_id)
VALUES ('tr-002', 'Sub-Inspector Ananya Rao', '4th NDRF Battalion', CURRENT_TIMESTAMP);

MERGE INTO trainees (trainee_id, name, batch_unit, created_at)
KEY (trainee_id)
VALUES ('tr-003', 'Constable Rajesh Kumar', '8th NDRF Battalion', CURRENT_TIMESTAMP);

-- Initial Sample Training Sessions
MERGE INTO sessions (session_id, trainee_id, scenario_id, started_at, completed_at, final_score, pass_status, created_at)
KEY (session_id)
VALUES (
    'sess-demo-01',
    'tr-001',
    'scen-chem-01',
    DATEADD('HOUR', -2, CURRENT_TIMESTAMP),
    DATEADD('HOUR', -1, CURRENT_TIMESTAMP),
    92,
    'PASSED',
    CURRENT_TIMESTAMP
);

MERGE INTO sessions (session_id, trainee_id, scenario_id, started_at, completed_at, final_score, pass_status, created_at)
KEY (session_id)
VALUES (
    'sess-demo-02',
    'tr-002',
    'scen-chem-01',
    DATEADD('HOUR', -4, CURRENT_TIMESTAMP),
    DATEADD('HOUR', -3, CURRENT_TIMESTAMP),
    68,
    'FAILED',
    CURRENT_TIMESTAMP
);

MERGE INTO sessions (session_id, trainee_id, scenario_id, started_at, completed_at, final_score, pass_status, created_at)
KEY (session_id)
VALUES (
    'sess-demo-03',
    'tr-003',
    'scen-rad-02',
    DATEADD('HOUR', -6, CURRENT_TIMESTAMP),
    DATEADD('HOUR', -5, CURRENT_TIMESTAMP),
    88,
    'PASSED',
    CURRENT_TIMESTAMP
);
