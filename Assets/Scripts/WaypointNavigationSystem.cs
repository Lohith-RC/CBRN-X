using UnityEngine;
using System.Collections.Generic;

namespace CBRSX.Unity
{
    /// <summary>
    /// WaypointNavigationSystem V2.1 — Auto-Configuring Stage-Aware Objective Waypoint & Guidance Manager.
    /// Features:
    /// - Self-bootstrapping runtime discovery of all scenario objectives
    /// - Pulsing emissive diamond beacons floating over current targets
    /// - Animated dynamic floor projection arrow pointing towards active objective
    /// - Public accessors for HUD distance and label integration
    /// - Auto-registered to GameManager stage transitions
    /// </summary>
    public class WaypointNavigationSystem : MonoBehaviour
    {
        public static WaypointNavigationSystem Instance { get; private set; }

        [System.Serializable]
        public class Waypoint
        {
            public string label;
            public Transform target;
            public GameManager.ScenarioStage activeDuringStage;
            public bool isCompleted;
            [HideInInspector] public GameObject markerInstance;
            [HideInInspector] public Light markerLight;
        }

        [Header("Waypoint Definitions")]
        public List<Waypoint> waypoints = new List<Waypoint>();

        [Header("Marker Appearance")]
        public float markerHoverHeight = 2.2f;
        public float markerBobAmplitude = 0.15f;
        public float markerBobFrequency = 1.5f;
        public float markerRotationSpeed = 60f;
        public float markerScale = 0.4f;

        [Header("Colors")]
        public Color activeColor = new Color(1f, 0.85f, 0.1f, 1f);   // Bright Gold
        public Color completedColor = new Color(0.2f, 0.95f, 0.35f, 1f); // Green
        public Color lockedColor = new Color(0.4f, 0.5f, 0.6f, 0.3f); // Grey

        [Header("Floor Guidance Arrow")]
        public float arrowDistance = 2.2f;
        public Color arrowColor = new Color(0.0f, 0.9f, 1.0f, 0.85f); // Cyan Pulse

        // Internal State
        private GameManager.ScenarioStage currentStage;
        private Camera playerCamera;
        private GameObject floorArrowInstance;
        private int activeWaypointIndex = -1;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else if (Instance != this) { Destroy(gameObject); return; }
        }

        private void Start()
        {
            EnsurePlayerCameraReference();

            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStageTransition += OnStageChanged;
                currentStage = GameManager.Instance.currentStage;
            }

            AutoDiscoverObjectiveTargets();
            CreateWaypointMarkers();
            CreateFloorArrow();
            UpdateActiveWaypoint();
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStageTransition -= OnStageChanged;
            }
        }

        private void EnsurePlayerCameraReference()
        {
            if (playerCamera == null)
            {
                FirstPersonResponderController responder = FindFirstObjectByType<FirstPersonResponderController>();
                if (responder != null) playerCamera = responder.GetComponentInChildren<Camera>();
                if (playerCamera == null) playerCamera = Camera.main;
            }
        }

        private void AutoDiscoverObjectiveTargets()
        {
            if (waypoints.Count > 0) return;

            // 1. Stage: Perimeter Assessment -> PPE Station
            GameObject ppeGo = GameObject.Find("PPE_HeavyDuty_Workbench");
            if (ppeGo == null) ppeGo = GameObject.Find("PPE_EQUIPMENT_STAGING_BENCHES");
            if (ppeGo == null)
            {
                PpeStation ppeStation = FindFirstObjectByType<PpeStation>();
                if (ppeStation != null) ppeGo = ppeStation.gameObject;
            }
            if (ppeGo != null)
            {
                waypoints.Add(new Waypoint {
                    label = "Don Level-B PPE Ensemble",
                    target = ppeGo.transform,
                    activeDuringStage = GameManager.ScenarioStage.PerimeterAssessment
                });
            }

            // 2. Stage: Chemical Spectrometry -> Gas Detector / Leak Drum
            GameObject detGo = GameObject.Find("PROP_GasDetector_WallDock");
            if (detGo == null)
            {
                GasDetector detector = FindFirstObjectByType<GasDetector>();
                if (detector != null && detector.transform.root != transform.root) detGo = detector.gameObject;
            }
            if (detGo != null)
            {
                waypoints.Add(new Waypoint {
                    label = "Equip Handheld PID Spectrometer",
                    target = detGo.transform,
                    activeDuringStage = GameManager.ScenarioStage.ChemicalSpectrometry
                });
            }

            LeakDrum drum = FindFirstObjectByType<LeakDrum>();
            if (drum != null)
            {
                waypoints.Add(new Waypoint {
                    label = "Scan Toxic Chemical Drum",
                    target = drum.transform,
                    activeDuringStage = GameManager.ScenarioStage.ChemicalSpectrometry
                });
            }

            // 3. Stage: Civilian Extraction -> Injured Worker
            Civilian civ = FindFirstObjectByType<Civilian>();
            if (civ != null)
            {
                waypoints.Add(new Waypoint {
                    label = "Evacuate Incapacitated Personnel",
                    target = civ.transform,
                    activeDuringStage = GameManager.ScenarioStage.CivilianExtraction
                });
            }

            // 4. Stage: Hazard Containment -> Leaking Drum
            if (drum != null)
            {
                waypoints.Add(new Waypoint {
                    label = "Apply Magnetic Patch Sealant",
                    target = drum.transform,
                    activeDuringStage = GameManager.ScenarioStage.HazardContainment
                });
            }

            // 5. Stage: Decon Neutralization -> Decon Station Arch
            DeconStation decon = FindFirstObjectByType<DeconStation>();
            if (decon != null)
            {
                waypoints.Add(new Waypoint {
                    label = "Complete Decontamination Shower",
                    target = decon.transform,
                    activeDuringStage = GameManager.ScenarioStage.DeconNeutralization
                });
            }
        }

        private void CreateWaypointMarkers()
        {
            Shader litShader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");

            foreach (var wp in waypoints)
            {
                if (wp.target == null || wp.markerInstance != null) continue;

                GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
                marker.name = $"WP_Marker_{wp.label}";
                marker.transform.SetParent(transform);
                marker.transform.localScale = Vector3.one * markerScale;
                marker.transform.rotation = Quaternion.Euler(45f, 0f, 45f);

                Collider col = marker.GetComponent<Collider>();
                if (col != null) Destroy(col);

                Material mat = new Material(litShader);
                mat.SetColor("_BaseColor", activeColor);
                mat.EnableKeyword("_EMISSION");
                mat.SetColor("_EmissionColor", activeColor * 1.5f);
                marker.GetComponent<MeshRenderer>().material = mat;

                GameObject lightGO = new GameObject("MarkerLight");
                lightGO.transform.SetParent(marker.transform);
                lightGO.transform.localPosition = Vector3.zero;
                Light light = lightGO.AddComponent<Light>();
                light.type = LightType.Point;
                light.color = activeColor;
                light.intensity = 1.0f;
                light.range = 4.0f;

                wp.markerInstance = marker;
                wp.markerLight = light;
            }
        }

        private void CreateFloorArrow()
        {
            if (floorArrowInstance != null) return;

            floorArrowInstance = new GameObject("FloorArrow_Navigator");
            floorArrowInstance.transform.SetParent(transform);

            Shader litShader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");

            GameObject arrowBody = GameObject.CreatePrimitive(PrimitiveType.Cube);
            arrowBody.name = "ArrowBody";
            arrowBody.transform.SetParent(floorArrowInstance.transform);
            arrowBody.transform.localPosition = new Vector3(0f, 0.05f, 0f);
            arrowBody.transform.localScale = new Vector3(0.2f, 0.04f, 1.0f);

            Collider bodyCol = arrowBody.GetComponent<Collider>();
            if (bodyCol != null) Destroy(bodyCol);

            Material arrowMat = new Material(litShader);
            arrowMat.SetColor("_BaseColor", arrowColor);
            arrowMat.EnableKeyword("_EMISSION");
            arrowMat.SetColor("_EmissionColor", arrowColor * 2.0f);
            arrowBody.GetComponent<MeshRenderer>().material = arrowMat;
        }

        private void OnStageChanged(GameManager.ScenarioStage newStage)
        {
            currentStage = newStage;
            UpdateActiveWaypoint();
        }

        private void UpdateActiveWaypoint()
        {
            activeWaypointIndex = -1;

            for (int i = 0; i < waypoints.Count; i++)
            {
                var wp = waypoints[i];
                if (wp.target == null) continue;

                bool isActiveStage = (wp.activeDuringStage == currentStage);
                if (wp.markerInstance != null)
                {
                    wp.markerInstance.SetActive(isActiveStage);
                }

                if (isActiveStage && activeWaypointIndex == -1)
                {
                    activeWaypointIndex = i;
                }
            }

            if (floorArrowInstance != null)
            {
                floorArrowInstance.SetActive(activeWaypointIndex >= 0);
            }
        }

        private void Update()
        {
            EnsurePlayerCameraReference();
            UpdateMarkerAnimations();
            UpdateFloorArrow();
        }

        private void UpdateMarkerAnimations()
        {
            float bob = Mathf.Sin(Time.time * markerBobFrequency * Mathf.PI * 2f) * markerBobAmplitude;

            foreach (var wp in waypoints)
            {
                if (wp.target == null || wp.markerInstance == null || !wp.markerInstance.activeSelf) continue;

                Vector3 targetPos = wp.target.position + Vector3.up * (markerHoverHeight + bob);
                wp.markerInstance.transform.position = targetPos;
                wp.markerInstance.transform.Rotate(Vector3.up, markerRotationSpeed * Time.deltaTime, Space.World);
            }
        }

        private void UpdateFloorArrow()
        {
            if (floorArrowInstance == null || activeWaypointIndex < 0 || activeWaypointIndex >= waypoints.Count) return;

            Waypoint activeWp = waypoints[activeWaypointIndex];
            if (activeWp.target == null) return;

            FirstPersonResponderController responder = FindFirstObjectByType<FirstPersonResponderController>();
            if (responder == null) return;

            Vector3 playerPos = responder.transform.position;
            Vector3 targetPos = activeWp.target.position;

            Vector3 dir = (targetPos - playerPos);
            dir.y = 0f;

            if (dir.sqrMagnitude > 0.5f)
            {
                dir.Normalize();
                Vector3 arrowPos = playerPos + dir * arrowDistance + Vector3.up * 0.05f;
                floorArrowInstance.transform.position = arrowPos;
                floorArrowInstance.transform.rotation = Quaternion.LookRotation(dir, Vector3.up);
            }
        }

        public float GetDistanceToActiveWaypoint()
        {
            if (activeWaypointIndex < 0 || activeWaypointIndex >= waypoints.Count) return -1f;
            Waypoint activeWp = waypoints[activeWaypointIndex];
            if (activeWp == null || activeWp.target == null) return -1f;

            FirstPersonResponderController responder = FindFirstObjectByType<FirstPersonResponderController>();
            if (responder == null) return -1f;

            return Vector3.Distance(responder.transform.position, activeWp.target.position);
        }

        public string GetActiveWaypointLabel()
        {
            if (activeWaypointIndex < 0 || activeWaypointIndex >= waypoints.Count) return "Stand By";
            Waypoint activeWp = waypoints[activeWaypointIndex];
            return (activeWp != null) ? activeWp.label : "Stand By";
        }
    }
}
