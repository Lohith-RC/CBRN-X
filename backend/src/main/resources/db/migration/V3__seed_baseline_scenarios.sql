-- ============================================================================
-- CBRS-X V3: Idempotent Baseline Scenario Seeds
-- ============================================================================

INSERT INTO scenarios (scenario_id, code, title, description, max_score)
SELECT 'scen-chem-01', 'CBRN-CHEM-01', 'Chemical Spill Emergency Response', 'Industrial Chemical Leak Incident at Storage Bay 3. Respond with full CBRN protocol: PPE, Hazard Detection, Civilian Evacuation, Containment, Decontamination.', 100
WHERE NOT EXISTS (SELECT 1 FROM scenarios WHERE scenario_id = 'scen-chem-01');

INSERT INTO scenarios (scenario_id, code, title, description, max_score)
SELECT 'scen-rad-02', 'CBRN-RAD-02', 'Radiological Dirty Bomb & Isotope Containment', 'High-Risk Cesium-137 Isotope Dispersion at Reactor Sub-Vault. Equip dosimeter, deploy lead shielding blanket, extract technicians, and secure hot cell perimeter.', 100
WHERE NOT EXISTS (SELECT 1 FROM scenarios WHERE scenario_id = 'scen-rad-02');

INSERT INTO scenarios (scenario_id, code, title, description, max_score)
SELECT 'scen-bio-03', 'CBRN-BIO-03', 'Biological Pathogen Laboratory Breach', 'Level-4 Biosafety Facility Airborne Pathogen Spill. Don PAPR positive-pressure respirator, establish negative pressure airlock, neutralize bio-aerosol, and decontaminate.', 100
WHERE NOT EXISTS (SELECT 1 FROM scenarios WHERE scenario_id = 'scen-bio-03');
