using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// MultiCameraController — Tactical Multi-Angle CCTV & First-Person Camera Switcher.
    /// Allows switching between First-Person Responder, Facility CCTV, Hazard Closeup, and Decon Monitor cameras.
    /// Hotkeys: [1] Responder FPS, [2] CCTV Bay Overview, [3] Hazard Closeup, [4] Decon Station Cam, [5] High Bay Cam.
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

        private Camera[] allCameras;

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
            if (Input.GetKeyDown(KeyCode.Alpha1)) SelectCamera(0);
            else if (Input.GetKeyDown(KeyCode.Alpha2)) SelectCamera(1);
            else if (Input.GetKeyDown(KeyCode.Alpha3)) SelectCamera(2);
            else if (Input.GetKeyDown(KeyCode.Alpha4)) SelectCamera(3);
            else if (Input.GetKeyDown(KeyCode.Alpha5)) SelectCamera(4);
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
    }
}
