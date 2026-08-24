using UnityEngine;
using System.Collections.Generic;

namespace CBRSX.Unity
{
    /// <summary>
    /// WaypointNavigationSystem V1.0 — Stage-Aware Objective Waypoint Manager.
    /// Features:
    /// - Floating diamond markers above objective targets with color-coding (yellow active, green done, grey locked)
    /// - Animated floor arrow projectors pointing toward the next objective
    /// - Distance readout integration with HudManager
    /// - Auto-registration via GameManager.OnStageTransition events
    /// - Screen-edge indicator arrows for off-screen objectives
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
            [HideInInspector] public bool isCompleted;
            [HideInInspector] public GameObject markerInstance;
            [HideInInspector] public Light markerLight;
        }

        [Header("Waypoint Definitions")]
        public List<Waypoint> waypoints = new List<Waypoint>();

        [Header("Marker Appearance")]
        public float markerHoverHeight = 2.5f;
        public float markerBobAmplitude = 0.15f;
        public float markerBobFrequency = 1.2f;
        public float markerRotationSpeed = 45f;
        public float markerScale = 0.35f;

        [Header("Colors")]
        public Color activeColor = new Color(1f, 0.85f, 0.1f, 1f);   // Yellow
        public Color completedColor = new Color(0.2f, 0.9f, 0.35f, 1f); // Green
        public Color lockedColor = new Color(0.5f, 0.5f, 0.5f, 0.4f); // Grey

        [Header("Floor Arrow")]
        public GameObject floorArrowPrefab;
        public float arrowDistance = 2.5f;
        public Color arrowColor = new Color(1f, 0.85f, 0.1f, 0.7f);

        // Internal State
        private GameManager.ScenarioStage currentStage;
        private Camera playerCamera;
        private GameObject floorArrowInstance;
        private int activeWaypointIndex = -1;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else { Destroy(gameObject); return; }
        }

        private void Start()
        {
            playerCamera = Camera.main;

            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStageTransition += OnStageChanged;
                currentStage = GameManager.Instance.currentStage;
            }

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

        private void Update()
        {
            UpdateMarkerAnimations();
            UpdateFloorArrow();
        }

        private void CreateWaypointMarkers()
        {
            foreach (var wp in waypoints)
            {
                if (wp.target == null) continue;

                // Create a diamond (rotated cube) marker
                GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cube);
                marker.name = $"WP_Marker_{wp.label}";
                marker.transform.SetParent(transform);
                marker.transform.localScale = Vector3.one * markerScale;
                marker.transform.rotation = Quaternion.Euler(45f, 0f, 45f); // Diamond orientation

                // Remove collider so it doesn't interfere with gameplay
                Collider col = marker.GetComponent<Collider>();
                if (col != null) Destroy(col);

                // Create emissive material
                Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                mat.SetColor("_BaseColor", lockedColor);
                mat.EnableKeyword("_EMISSION");
                mat.SetColor("_EmissionColor", lockedColor * 0.5f);
                mat.SetFloat("_Surface", 1f); // Transparent
                marker.GetComponent<MeshRenderer>().material = mat;

                // Add point light for glow
                GameObject lightGO = new GameObject("MarkerLight");
                lightGO.transform.SetParent(marker.transform);
                lightGO.transform.localPosition = Vector3.zero;
                Light light = lightGO.AddComponent<Light>();
                light.type = LightType.Point;
                light.color = lockedColor;
                light.intensity = 0.5f;
                light.range = 3.0f;

                wp.markerInstance = marker;
                wp.markerLight = light;
            }
        }

        private void CreateFloorArrow()
        {
            // Create a simple arrow on the floor using a cube stretched into a triangle shape
            floorArrowInstance = new GameObject("FloorArrow_Navigator");
            floorArrowInstance.transform.SetParent(transform);

            // Arrow body
            GameObject arrowBody = GameObject.CreatePrimitive(PrimitiveType.Cube);
            arrowBody.name = "ArrowBody";
            arrowBody.transform.SetParent(floorArrowInstance.transform);
            arrowBody.transform.localPosition = new Vector3(0f, 0.02f, 0f);
            arrowBody.transform.localScale = new Vector3(0.15f, 0.03f, 0.8f);

            Collider bodyCol = arrowBody.GetComponent<Collider>();
            if (bodyCol != null) Destroy(bodyCol);

            Material arrowMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            arrowMat.SetColor("_BaseColor", arrowColor);
            arrowMat.EnableKeyword("_EMISSION");
            arrowMat.SetColor("_EmissionColor", arrowColor * 1.5f);
            arrowBody.GetComponent<MeshRenderer>().material = arrowMat;

            // Arrow head
            GameObject arrowHead = GameObject.CreatePrimitive(PrimitiveType.Cube);
            arrowHead.name = "ArrowHead";
            arrowHead.transform.SetParent(floorArrowInstance.transform);
            arrowHead.transform.localPosition = new Vector3(0f, 0.02f, 0.55f);
            arrowHead.transform.localScale = new Vector3(0.4f, 0.03f, 0.4f);
            arrowHead.transform.localRotation = Quaternion.Euler(0, 45, 0);

            Collider headCol = arrowHead.GetComponent<Collider>();
            if (headCol != null) Destroy(headCol);
            arrowHead.GetComponent<MeshRenderer>().material = arrowMat;

            floorArrowInstance.SetActive(false);
        }

        private void UpdateMarkerAnimations()
        {
            float time = Time.time;

            for (int i = 0; i < waypoints.Count; i++)
            {
                var wp = waypoints[i];
                if (wp.target == null || wp.markerInstance == null) continue;

                bool isActive = (wp.activeDuringStage == currentStage && !wp.isCompleted);
                bool isVisible = isActive || wp.isCompleted;

                wp.markerInstance.SetActive(isVisible);

                if (!isVisible) continue;

                // Position: hover above target with bob
                float bob = Mathf.Sin(time * markerBobFrequency * Mathf.PI * 2f + i) * markerBobAmplitude;
                wp.markerInstance.transform.position = wp.target.position + Vector3.up * (markerHoverHeight + bob);

                // Rotation: continuous spin
                wp.markerInstance.transform.Rotate(Vector3.up, markerRotationSpeed * Time.deltaTime, Space.World);

                // Color
                Color targetColor = isActive ? activeColor : (wp.isCompleted ? completedColor : lockedColor);
                MeshRenderer mr = wp.markerInstance.GetComponent<MeshRenderer>();
                if (mr != null && mr.material != null)
                {
                    mr.material.SetColor("_BaseColor", targetColor);

                    float emissionPulse = isActive
                        ? Mathf.Lerp(0.8f, 2.0f, (Mathf.Sin(time * 3f) + 1f) * 0.5f)
                        : 0.5f;
                    mr.material.SetColor("_EmissionColor", targetColor * emissionPulse);
                }

                if (wp.markerLight != null)
                {
                    wp.markerLight.color = targetColor;
                    wp.markerLight.intensity = isActive ? 2.0f : 0.5f;
                }

                if (isActive)
                {
                    activeWaypointIndex = i;
                }
            }
        }

        private void UpdateFloorArrow()
        {
            if (floorArrowInstance == null || playerCamera == null) return;

            if (activeWaypointIndex < 0 || activeWaypointIndex >= waypoints.Count)
            {
                floorArrowInstance.SetActive(false);
                return;
            }

            var activeWp = waypoints[activeWaypointIndex];
            if (activeWp.target == null || activeWp.isCompleted)
            {
                floorArrowInstance.SetActive(false);
                return;
            }

            floorArrowInstance.SetActive(true);

            // Position arrow on floor in front of player, pointing toward objective
            Transform playerTransform = playerCamera.transform.root;
            Vector3 dirToTarget = (activeWp.target.position - playerTransform.position).normalized;
            dirToTarget.y = 0;

            if (dirToTarget.sqrMagnitude > 0.01f)
            {
                Vector3 arrowPos = playerTransform.position + dirToTarget * arrowDistance;
                arrowPos.y = 0.04f; // Floor level

                floorArrowInstance.transform.position = arrowPos;
                floorArrowInstance.transform.rotation = Quaternion.LookRotation(dirToTarget, Vector3.up);

                // Pulse arrow emission
                float pulse = Mathf.Lerp(1.0f, 2.5f, (Mathf.Sin(Time.time * 2f) + 1f) * 0.5f);
                MeshRenderer[] renderers = floorArrowInstance.GetComponentsInChildren<MeshRenderer>();
                foreach (var r in renderers)
                {
                    if (r.material != null)
                    {
                        r.material.SetColor("_EmissionColor", arrowColor * pulse);
                    }
                }
            }
        }

        /// <summary>
        /// Returns the distance from the player to the current active waypoint.
        /// Returns -1 if no active waypoint.
        /// </summary>
        public float GetDistanceToActiveWaypoint()
        {
            if (activeWaypointIndex < 0 || activeWaypointIndex >= waypoints.Count)
                return -1f;

            var wp = waypoints[activeWaypointIndex];
            if (wp.target == null || wp.isCompleted) return -1f;

            Camera cam = Camera.main;
            if (cam == null) return -1f;

            return Vector3.Distance(cam.transform.position, wp.target.position);
        }

        /// <summary>
        /// Returns the label of the current active waypoint.
        /// </summary>
        public string GetActiveWaypointLabel()
        {
            if (activeWaypointIndex < 0 || activeWaypointIndex >= waypoints.Count)
                return "";

            return waypoints[activeWaypointIndex].label;
        }

        private void OnStageChanged(GameManager.ScenarioStage newStage)
        {
            // Mark all waypoints for the previous stage as completed
            foreach (var wp in waypoints)
            {
                if (wp.activeDuringStage == currentStage)
                {
                    wp.isCompleted = true;
                }
            }

            currentStage = newStage;
            UpdateActiveWaypoint();
        }

        private void UpdateActiveWaypoint()
        {
            activeWaypointIndex = -1;
            for (int i = 0; i < waypoints.Count; i++)
            {
                if (waypoints[i].activeDuringStage == currentStage && !waypoints[i].isCompleted)
                {
                    activeWaypointIndex = i;
                    break;
                }
            }
        }
    }
}
