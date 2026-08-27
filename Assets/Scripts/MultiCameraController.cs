using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace CBRSX.Unity
{
    /// <summary>
    /// MultiCameraController V3.0 — Multi-Angle Facility CCTV & Responder Camera Rig.
    /// Features:
    /// - [F1] Responder First-Person Helmet Cam (FPS)
    /// - [F2] CCTV-01: Storage Bay Overview (High Angle)
    /// - [F3] CCTV-02: Chemical Hazard & Spill Breach (Closeup)
    /// - [F4] CCTV-03: Decontamination Shower & Washdown Station
    /// - [F5] CCTV-04: High-Bay Ceiling Crane (Bird's-Eye View)
    /// - [F6] CCTV-05: Level-B PPE Staging Area (Safety Depot)
    /// - [V] / [C] / [Numpad]: Quick Next/Prev Camera Cycle
    /// - Real-time on-screen tactical CCTV telemetry overlay
    /// </summary>
    public class MultiCameraController : MonoBehaviour
    {
        public static MultiCameraController Instance { get; private set; }

        [Header("Camera Rig References")]
        public Camera playerFpsCamera;
        public Camera cctvOverviewCamera;
        public Camera cctvHazardCloseupCamera;
        public Camera cctvDeconCamera;
        public Camera cctvHighBayCamera;
        public Camera cctvStagingCamera;

        [Header("Current Active Camera")]
        public int activeCameraIndex = 0;

        [Header("CCTV Visual Overlay")]
        public bool showCctvOverlay = true;

        private List<Camera> allCameras = new List<Camera>();
        private GUIStyle overlayStyle;
        private GUIStyle recDotStyle;
        private float sessionTimer = 0f;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else { Destroy(gameObject); return; }
        }

        private void Start()
        {
            RefreshCameraList();
            SelectCamera(0);
        }

        public void RefreshCameraList()
        {
            allCameras.Clear();
            if (playerFpsCamera != null) allCameras.Add(playerFpsCamera);
            if (cctvOverviewCamera != null) allCameras.Add(cctvOverviewCamera);
            if (cctvHazardCloseupCamera != null) allCameras.Add(cctvHazardCloseupCamera);
            if (cctvDeconCamera != null) allCameras.Add(cctvDeconCamera);
            if (cctvHighBayCamera != null) allCameras.Add(cctvHighBayCamera);
            if (cctvStagingCamera != null) allCameras.Add(cctvStagingCamera);
        }

        private void Update()
        {
            sessionTimer += Time.deltaTime;

            // Direct Function Key Hotkeys (F1 - F6)
            if (Input.GetKeyDown(KeyCode.F1)) SelectCamera(0);
            else if (Input.GetKeyDown(KeyCode.F2)) SelectCamera(1);
            else if (Input.GetKeyDown(KeyCode.F3)) SelectCamera(2);
            else if (Input.GetKeyDown(KeyCode.F4)) SelectCamera(3);
            else if (Input.GetKeyDown(KeyCode.F5)) SelectCamera(4);
            else if (Input.GetKeyDown(KeyCode.F6)) SelectCamera(5);

            // Cycle Hotkeys (V / C)
            if (Input.GetKeyDown(KeyCode.V) || Input.GetKeyDown(KeyCode.Tab) && Input.GetKey(KeyCode.LeftControl))
            {
                CycleCamera(1);
            }
            else if (Input.GetKeyDown(KeyCode.C) && Input.GetKey(KeyCode.LeftAlt))
            {
                CycleCamera(-1);
            }

            // Sync CCTV Post-Processing mode
            if (PostProcessingController.Instance != null)
            {
                PostProcessingController.Instance.SetCctvModeActive(activeCameraIndex > 0);
            }
        }

        public void CycleCamera(int direction)
        {
            if (allCameras.Count == 0) RefreshCameraList();
            if (allCameras.Count == 0) return;

            int nextIndex = (activeCameraIndex + direction) % allCameras.Count;
            if (nextIndex < 0) nextIndex += allCameras.Count;
            SelectCamera(nextIndex);
        }

        public void SelectCamera(int index)
        {
            if (allCameras.Count == 0) RefreshCameraList();
            if (allCameras.Count == 0) return;

            activeCameraIndex = Mathf.Clamp(index, 0, allCameras.Count - 1);

            for (int i = 0; i < allCameras.Count; i++)
            {
                if (allCameras[i] != null)
                {
                    bool isActive = (i == activeCameraIndex);
                    allCameras[i].gameObject.SetActive(isActive);

                    // Ensure single AudioListener to prevent audio warnings
                    AudioListener listener = allCameras[i].GetComponent<AudioListener>();
                    if (listener != null)
                    {
                        listener.enabled = isActive;
                    }
                }
            }

            // Manage mouse look lock when viewing facility CCTV vs Player FPS
            FirstPersonResponderController responder = FirstPersonResponderController.Instance;
            if (responder != null)
            {
                responder.SetCursorLock(activeCameraIndex == 0);
            }

            Debug.Log($"<color=#00FFCC><b>[CBRS-X MultiCam] Switched View: {GetCameraName(activeCameraIndex)} [Key: F{activeCameraIndex + 1}]</b></color>");
        }

        public string GetCameraName(int index)
        {
            switch (index)
            {
                case 0: return "RESPONDER HELMET CAM [FPS]";
                case 1: return "CCTV-01: STORAGE BAY OVERVIEW";
                case 2: return "CCTV-02: CHEMICAL HAZARD & SPILL BREACH";
                case 3: return "CCTV-03: DECON SHOWER & WASHDOWN ARCH";
                case 4: return "CCTV-04: HIGH-BAY CRANE (BIRD'S-EYE)";
                case 5: return "CCTV-05: LEVEL-B PPE STAGING DEPOT";
                default: return $"FACILITY CAM-{index:00}";
            }
        }

        public bool IsPlayerCameraActive()
        {
            return activeCameraIndex == 0;
        }

        private void OnGUI()
        {
            if (!showCctvOverlay) return;

            if (overlayStyle == null)
            {
                overlayStyle = new GUIStyle(GUI.skin.box);
                overlayStyle.alignment = TextAnchor.MiddleLeft;
                overlayStyle.fontSize = 14;
                overlayStyle.normal.textColor = new Color(0.95f, 0.95f, 0.95f, 0.95f);
            }

            if (recDotStyle == null)
            {
                recDotStyle = new GUIStyle(GUI.skin.label);
                recDotStyle.fontSize = 14;
                recDotStyle.fontStyle = FontStyle.Bold;
            }

            // Top-Left Camera Switcher Banner
            GUILayout.BeginArea(new Rect(15, 15, 620, 75));
            GUILayout.BeginVertical("box");

            GUILayout.BeginHorizontal();
            // Blinking Recording Indicator
            bool blink = (Mathf.FloorToInt(Time.time * 2f) % 2 == 0);
            GUI.color = blink ? Color.red : Color.gray;
            GUILayout.Label("REC 🔴", recDotStyle, GUILayout.Width(65));
            GUI.color = Color.white;

            int minutes = Mathf.FloorToInt(sessionTimer / 60F);
            int seconds = Mathf.FloorToInt(sessionTimer - minutes * 60);
            GUILayout.Label($"[{minutes:00}:{seconds:00}]  <b>{GetCameraName(activeCameraIndex)}</b>", GUILayout.ExpandWidth(true));
            GUILayout.EndHorizontal();

            GUILayout.Space(2);
            GUILayout.Label("<color=#FFCC00>[F1-F6]</color> Direct Cam Select  |  <color=#00FFCC>[V]</color> Next Cam  |  <color=#00FFCC>[Alt+C]</color> Prev Cam");

            GUILayout.EndVertical();
            GUILayout.EndArea();

            // Bottom-Right Camera Thumbnail Selection Bar
            GUILayout.BeginArea(new Rect(Screen.width - 480, Screen.height - 48, 465, 40));
            GUILayout.BeginHorizontal();
            for (int i = 0; i < allCameras.Count; i++)
            {
                GUI.backgroundColor = (i == activeCameraIndex) ? new Color(0.2f, 0.9f, 0.3f, 0.9f) : new Color(0.2f, 0.2f, 0.25f, 0.75f);
                if (GUILayout.Button($"F{i + 1}: Cam {i + 1}", GUILayout.Height(32), GUILayout.Width(72)))
                {
                    SelectCamera(i);
                }
            }
            GUI.backgroundColor = Color.white;
            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }
    }
}
