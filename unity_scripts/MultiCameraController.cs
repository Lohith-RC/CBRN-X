using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// MultiCameraController V2.0 — Tactical Multi-Angle CCTV & First-Person Camera Switcher.
    /// Allows switching between First-Person Responder, Facility CCTV, Hazard Closeup, and Decon Monitor cameras.
    /// Hotkeys: [F1] Responder FPS, [F2] CCTV Bay Overview, [F3] Hazard Closeup, [F4] Decon Station Cam, [F5] High Bay Cam.
    /// No longer conflicts with tool equip keys (1/2/G).
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

        [Header("Current Active Camera")]
        public int activeCameraIndex = 0; // 0 = Player, 1 = Overview, 2 = Hazard, 3 = Decon, 4 = HighBay

        [Header("Transition")]
        public float transitionFadeDuration = 0.3f;

        private Camera[] allCameras;
        private float fadeTimer = 0f;
        private bool isFading = false;
        private int pendingCameraIndex = -1;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            allCameras = new Camera[] {
                playerFpsCamera,
                cctvOverviewCamera,
                cctvHazardCloseupCamera,
                cctvDeconCamera,
                cctvHighBayCamera
            };

            SelectCamera(0);
        }

        private void Update()
        {
            // Rebind to Function keys to avoid conflict with tool equip (1/2/G/Tab)
            if (Input.GetKeyDown(KeyCode.F1)) SelectCamera(0);
            else if (Input.GetKeyDown(KeyCode.F2)) SelectCamera(1);
            else if (Input.GetKeyDown(KeyCode.F3)) SelectCamera(2);
            else if (Input.GetKeyDown(KeyCode.F4)) SelectCamera(3);
            else if (Input.GetKeyDown(KeyCode.F5)) SelectCamera(4);

            // Apply PostProcessing CCTV mode when not on player camera
            if (PostProcessingController.Instance != null)
            {
                PostProcessingController.Instance.SetCctvModeActive(activeCameraIndex > 0);
            }
        }

        public void SelectCamera(int index)
        {
            if (allCameras == null || allCameras.Length == 0) return;

            activeCameraIndex = Mathf.Clamp(index, 0, allCameras.Length - 1);

            for (int i = 0; i < allCameras.Length; i++)
            {
                if (allCameras[i] != null)
                {
                    allCameras[i].gameObject.SetActive(i == activeCameraIndex);
                    
                    // Enable AudioListener only on active camera to avoid multi-listener warnings
                    AudioListener listener = allCameras[i].GetComponent<AudioListener>();
                    if (listener != null)
                    {
                        listener.enabled = (i == activeCameraIndex);
                    }
                }
            }

            // Lock/unlock cursor based on camera mode
            FirstPersonResponderController responder = FindFirstObjectByType<FirstPersonResponderController>();
            if (responder != null)
            {
                responder.SetCursorLock(activeCameraIndex == 0);
            }

            Debug.Log($"[CBRS-X MultiCam] Active View: {GetCameraName(activeCameraIndex)} (Index: {activeCameraIndex})");
        }

        public string GetCameraName(int index)
        {
            switch (index)
            {
                case 0: return "Responder First-Person (FPS)";
                case 1: return "CCTV-01: Storage Bay Overview";
                case 2: return "CCTV-02: Chemical Hazard & Spill Pallet";
                case 3: return "CCTV-03: Decontamination Shower Tent";
                case 4: return "CCTV-04: High-Bay Facility Crane Angle";
                default: return "Unknown Camera";
            }
        }

        /// <summary>
        /// Returns true if the player FPS camera is currently active.
        /// Other systems can use this to disable FPS-only controls during CCTV view.
        /// </summary>
        public bool IsPlayerCameraActive()
        {
            return activeCameraIndex == 0;
        }
    }
}
