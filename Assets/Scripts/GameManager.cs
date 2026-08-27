using System;
using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// GameManager V3.1 — Master Protocol Coordinator & Scenario Progression Engine.
    /// Manages 5-stage NDRF tactical response milestones and coordinates doors, navigation, and scoring.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum ScenarioStage
        {
            BriefingOperational,        // Stage 0
            PerimeterAssessment,        // Stage 1: Assessment & Donning
            LevelBDonning,              // Stage 2: PPE Donned
            ChemicalSpectrometry,       // Stage 3: Detect & Identify Leak
            CivilianExtraction,         // Stage 4: Evacuate Civilians
            HazardContainment,          // Stage 5: Containment & Clamp
            DeconNeutralization,        // Stage 6: Decon Shower
            MissionDebrief              // Stage 7: Complete
        }

        [Header("Auto-Start Configuration")]
        public bool autoStartOnPlay = true;
        public float autoStartDelay = 0.5f;

        [Header("Session Telemetry")]
        public string sessionId = "";
        public float scenarioStartTime = 0f;
        public ScenarioStage currentStage = ScenarioStage.BriefingOperational;

        [Header("Protocol Verification Flags")]
        public bool isPpeFullyEquipped = false;
        public bool isDetectorEquipped = false;
        public bool leakSourceIdentified = false;
        public string identifiedDrumId = "";
        public int totalCiviliansCount = 1;
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
        public event Action<float> OnScenarioCompletedEvent;
        public event Action<string> OnProtocolMistakeReported;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                if (transform.parent == null)
                {
                    DontDestroyOnLoad(gameObject);
                }
            }
            else if (Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            BootstrapSubsystems();
        }

        private void BootstrapSubsystems()
        {
            // Ensure WaypointNavigationSystem is running
            if (FindFirstObjectByType<WaypointNavigationSystem>() == null)
            {
                GameObject navGo = new GameObject("System_WaypointNavigation");
                navGo.AddComponent<WaypointNavigationSystem>();
            }

            // Ensure BayEntranceDoorController is running
            if (FindFirstObjectByType<BayEntranceDoorController>() == null)
            {
                GameObject doorGo = new GameObject("System_BayEntranceDoorController");
                doorGo.AddComponent<BayEntranceDoorController>();
            }
        }

        private void Start()
        {
            if (autoStartOnPlay)
            {
                Invoke(nameof(StartScenario), autoStartDelay);
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

            // Ensure entrance door is open for trainees
            BayEntranceDoorController door = FindFirstObjectByType<BayEntranceDoorController>();
            if (door != null)
            {
                door.OpenDoor();
            }

            Debug.Log($"[CBRS-X V3.1] Operational scenario initiated with Session ID: {sessionId}");
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

            // Ensure door is fully open
            BayEntranceDoorController door = FindFirstObjectByType<BayEntranceDoorController>();
            if (door != null)
            {
                door.OpenDoor();
            }

            Debug.Log("[CBRS-X V3.1] Full Level B CBRN PPE confirmed. Transitioning to ChemicalSpectrometry.");
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

            Debug.Log($"[CBRS-X V3.1] Primary leak source validated: {drumId}. Proceeding to CivilianExtraction.");
        }

        public void RegisterCivilianEvacuated(string civilianId)
        {
            evacuatedCiviliansCount++;
            OnCivilianRescuedEvent?.Invoke(civilianId);

            if (evacuatedCiviliansCount >= totalCiviliansCount)
            {
                SetStage(ScenarioStage.HazardContainment);
                Debug.Log("[CBRS-X V3.1] All civilians extracted safely. Advancing to HazardContainment.");
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

            Debug.Log("[CBRS-X V3.1] Drum fissure sealed. Advancing to DeconNeutralization.");
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
            Debug.Log($"[CBRS-X V3.1] Stage Transition -> {newStage}");
            OnStageTransition?.Invoke(newStage);
        }

        private void FinalizeMission()
        {
            if (scenarioCompleted) return;

            scenarioCompleted = true;
            float totalElapsed = Time.time - scenarioStartTime;

            SetStage(ScenarioStage.MissionDebrief);
            OnScenarioCompletedEvent?.Invoke(totalElapsed);

            if (CbrsEventLogger.Instance != null)
            {
                CbrsEventLogger.Instance.LogEvent("scenario_completed",
                    "{\"total_time_seconds\":" + totalElapsed.ToString("F1") + "}");
            }

            Debug.Log($"[CBRS-X V3.1] Mission COMPLETE in {totalElapsed:F1}s.");
        }

        public string GetStageObjectiveText()
        {
            switch (currentStage)
            {
                case ScenarioStage.BriefingOperational:
                case ScenarioStage.PerimeterAssessment:
                    return "OBJECTIVE: Approach staging bench [E] and don complete Level-B PPE ensemble.";
                case ScenarioStage.LevelBDonning:
                case ScenarioStage.ChemicalSpectrometry:
                    return "OBJECTIVE: Equip Handheld PID Spectrometer [1/G], enter Bay 03, and locate leaking drum.";
                case ScenarioStage.CivilianExtraction:
                    return "OBJECTIVE: Approach incapacitated worker in Bay 03 and lead them to safety.";
                case ScenarioStage.HazardContainment:
                    return "OBJECTIVE: Equip Containment Sealant Kit [2] and seal leaking chemical drum.";
                case ScenarioStage.DeconNeutralization:
                    return "OBJECTIVE: Enter Decontamination Shower Archway and complete washdown cycle.";
                case ScenarioStage.MissionDebrief:
                    return "MISSION COMPLETE: Proceed to terminal for certified evaluation scorecard.";
                default:
                    return "Follow Tactical Waypoints.";
            }
        }
    }
}
