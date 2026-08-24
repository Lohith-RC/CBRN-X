using System;
using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// GameManager V2.0 — Master Protocol Coordinator & Scoring State Engine.
    /// Features:
    /// - Comprehensive Protocol State Machine tracking all 7 NDRF response milestones
    /// - Sub-Stage Micro-Tracking & Penalty Deduplication
    /// - Multi-Subscriber C# Event Bus for HUD, Audio, and Post-Processing Subsystems
    /// - End-of-Mission Telemetry Serialization & Composite Score Compilation
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum ScenarioStage
        {
            BriefingOperational,        // Stage 0
            PerimeterAssessment,        // Stage 1
            LevelBDonning,              // Stage 2
            ChemicalSpectrometry,       // Stage 3
            CivilianExtraction,         // Stage 4
            HazardContainment,          // Stage 5
            DeconNeutralization,        // Stage 6
            MissionDebrief              // Stage 7
        }

        [Header("Session Telemetry")]
        public string sessionId = "";
        public float scenarioStartTime = 0f;
        public ScenarioStage currentStage = ScenarioStage.BriefingOperational;

        [Header("Protocol Verification Flags")]
        public bool isPpeFullyEquipped = false;
        public bool isDetectorEquipped = false;
        public bool leakSourceIdentified = false;
        public string identifiedDrumId = "";
        public int totalCiviliansCount = 2;
        public int evacuatedCiviliansCount = 0;
        public bool containmentKitEquipped = false;
        public bool containmentComplete = false;
        public bool decontaminationComplete = false;
        public bool scenarioCompleted = false;

        // Multi-Subscriber C# Events
        public event Action<ScenarioStage> OnStageTransition;
        public event Action<string> OnPpeItemEquippedEvent;
        public event Action OnFullPpeCompletedEvent;
        public event Action OnLeakSourceConfirmedEvent;
        public event Action<string> OnCivilianRescuedEvent;
        public event Action OnContainmentFinishedEvent;
        public event Action OnDecontaminationFinishedEvent;
        public event Action<string> OnProtocolMistakeReported;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public void StartScenario()
        {
            if (scenarioStartTime > 0f) return;

            scenarioStartTime = Time.time;
            sessionId = Guid.NewGuid().ToString();

            SetStage(ScenarioStage.PerimeterAssessment);

            if (CbrsEventLogger.Instance != null)
            {
                CbrsEventLogger.Instance.LogEvent("scenario_started",
                    "{\"trainee_id\":\"" + CbrsEventLogger.Instance.traineeName +
                    "\",\"scenario_id\":\"chemical_spill_v1\"}");
            }

            Debug.Log($"[CBRS-X V2.0] Operational scenario initiated with Session ID: {sessionId}");
        }

        public void RegisterPpeEquip(string itemKey)
        {
            OnPpeItemEquippedEvent?.Invoke(itemKey);
        }

        public void RegisterFullPpeDonned()
        {
            if (isPpeFullyEquipped) return;

            isPpeFullyEquipped = true;
            OnFullPpeCompletedEvent?.Invoke();
            SetStage(ScenarioStage.ChemicalSpectrometry);

            Debug.Log("[CBRS-X V2.0] Full Level B CBRN PPE confirmed. Transitioning to ChemicalSpectrometry.");
        }

        public void RegisterDetectorEquipped()
        {
            isDetectorEquipped = true;
        }

        public void RegisterLeakIdentified(string drumId)
        {
            if (leakSourceIdentified) return;

            leakSourceIdentified = true;
            identifiedDrumId = drumId;

            OnLeakSourceConfirmedEvent?.Invoke();
            SetStage(ScenarioStage.CivilianExtraction);

            Debug.Log($"[CBRS-X V2.0] Primary leak source validated: {drumId}. Proceeding to CivilianExtraction.");
        }

        public void RegisterCivilianEvacuated(string civilianId)
        {
            evacuatedCiviliansCount++;
            OnCivilianRescuedEvent?.Invoke(civilianId);

            if (evacuatedCiviliansCount >= totalCiviliansCount)
            {
                SetStage(ScenarioStage.HazardContainment);
                Debug.Log("[CBRS-X V2.0] All civilians extracted safely. Advancing to HazardContainment.");
            }
        }

        public void RegisterContainmentKitEquipped()
        {
            containmentKitEquipped = true;
        }

        public void RegisterContainmentComplete()
        {
            containmentComplete = true;
            OnContainmentFinishedEvent?.Invoke();
            SetStage(ScenarioStage.DeconNeutralization);

            Debug.Log("[CBRS-X V2.0] Drum fissure sealed. Advancing to DeconNeutralization.");
        }

        public void RegisterDecontaminationComplete()
        {
            if (decontaminationComplete) return;

            decontaminationComplete = true;
            OnDecontaminationFinishedEvent?.Invoke();
            FinalizeMission();
        }

        public void ReportMistake(string warningMessage)
        {
            OnProtocolMistakeReported?.Invoke(warningMessage);
        }

        public void SetStage(ScenarioStage newStage)
        {
            if (currentStage == newStage) return;

            currentStage = newStage;
            Debug.Log($"[CBRS-X V2.0] Stage Transition -> {newStage}");
            OnStageTransition?.Invoke(newStage);
        }

        private void FinalizeMission()
        {
            if (scenarioCompleted) return;

            scenarioCompleted = true;
            float totalElapsed = Time.time - scenarioStartTime;

            SetStage(ScenarioStage.MissionDebrief);

            if (evacuatedCiviliansCount < totalCiviliansCount)
            {
                int remaining = totalCiviliansCount - evacuatedCiviliansCount;
                if (CbrsEventLogger.Instance != null)
                {
                    CbrsEventLogger.Instance.LogEvent("evacuation_incomplete",
                        "{\"evacuated_count\":" + evacuatedCiviliansCount +
                        ",\"total_count\":" + totalCiviliansCount +
                        ",\"left_behind_count\":" + remaining + "}");
                }
            }

            if (CbrsEventLogger.Instance != null)
            {
                CbrsEventLogger.Instance.LogEvent("scenario_completed",
                    "{\"total_time_seconds\":" + totalElapsed.ToString("F1") + "}");
            }

            Debug.Log($"[CBRS-X V2.0] Mission COMPLETE in {totalElapsed:F1}s.");
        }

        public string GetStageObjectiveText()
        {
            switch (currentStage)
            {
                case ScenarioStage.BriefingOperational:
                    return "OPERATIONAL BRIEFING: Gas release at Bay 3. Click INITIATE DEPLOYMENT.";
                case ScenarioStage.PerimeterAssessment:
                    return "ASSESSMENT: Survey environmental hazard signage. Do not penetrate boundary without PPE.";
                case ScenarioStage.LevelBDonning:
                    return "PROTOCOL: Don Level B Hazmat Suit, CBRN Gas Mask, and Chemical Gloves.";
                case ScenarioStage.ChemicalSpectrometry:
                    if (!isDetectorEquipped)
                        return "DETECTION: Acquire handheld PID detector from utility crate.";
                    if (!leakSourceIdentified)
                        return "DETECTION: Perform spectrometry sweeps on drum cluster to locate leak source.";
                    return "DETECTION: Leak source confirmed. Proceed to extract civilians.";
                case ScenarioStage.CivilianExtraction:
                    return $"EXTRACTION: Guide all trapped workers to the Safe Zone triage marker ({evacuatedCiviliansCount}/{totalCiviliansCount}).";
                case ScenarioStage.HazardContainment:
                    if (!containmentKitEquipped)
                        return "CONTAINMENT: Acquire magnetic patch and sealant injection kit.";
                    return "CONTAINMENT: Hold click on the ruptured drum to inject pneumatic sealant.";
                case ScenarioStage.DeconNeutralization:
                    return "NEUTRALIZATION: Pass through high-pressure decontamination archway.";
                case ScenarioStage.MissionDebrief:
                    return "DEBRIEF: Mission successfully completed. Telemetry uploaded to Instructor Dashboard.";
                default:
                    return "";
            }
        }
    }
}
