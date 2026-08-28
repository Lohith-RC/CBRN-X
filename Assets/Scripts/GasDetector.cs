using UnityEngine;
using TMPro;

namespace CBRSX.Unity
{
    /// <summary>
    /// GasDetector V4.0 — High-Visibility Analytical PID Spectrometer.
    /// Features:
    /// - Auto-discovers firstPersonHeldModel and UI_GasDetector_Overlay HUD panel
    /// - Dynamic procedural visual fallback ensuring 100% on-screen visibility
    /// - Real-time OLED PPM concentration display and geiger audio ticking
    /// - Smooth Aim-Down-Sights (Right-Click ADS) and zero-freeze collision stripping
    /// </summary>
    public class GasDetector : MonoBehaviour
    {
        [Header("Analytical Sensor Telemetry")]
        public bool isEquipped = false;
        public float baselinePpm = 12.4f;
        public float maxPpm = 200.0f;
        public float detectionRadius = 14.0f;
        public float dispersionDiffusionCoeff = 2.2f;

        [Header("Atmospheric Plume Vector")]
        public Vector3 ambientWindVector = new Vector3(0.5f, 0f, 0.2f);
        public float turbulenceIntensity = 1.4f;

        [Header("Needle Mass-Spring-Damper Physics")]
        public Transform needleGaugeTransform;
        public float springStiffness = 45.0f;
        public float damperCoefficient = 7.5f;
        public float needleJitterAmplitude = 1.2f;

        [Header("OLED Telemetry Matrix Display")]
        public GameObject detectorHudPanel;
        public TextMeshProUGUI livePpmText;
        public TextMeshProUGUI peakPpmText;
        public TextMeshProUGUI stelStatusText;
        public TextMeshProUGUI batteryText;

        [Header("Aim-Down-Sights (ADS) Tool Zoom")]
        public GameObject firstPersonHeldModel;
        public Vector3 hipPosition = new Vector3(0.28f, -0.22f, 0.45f);
        public Vector3 adsPosition = new Vector3(0.0f, -0.12f, 0.35f);
        public float zoomFov = 50.0f;
        public float defaultFov = 75.0f;
        public float adsTransitionSpeed = 9.0f;

        [Header("Multi-Tone Acoustic Sensor Feedback")]
        public AudioSource geigerAudioSource;
        public AudioClip geigerTickClip;
        public AudioClip alarmThresholdClip;

        // Internal Analytical State
        private LeakDrum leakingDrum;
        private float currentCalculatedPpm = 0f;
        private float peakRecordedPpm = 0f;
        private float needlePositionAngle = 90f; // 90 deg = 0 PPM, -90 deg = 200 PPM
        private float needleVelocity = 0f;
        private float geigerTimer = 0f;
        private Camera playerCamera;
        private bool isAimingDownSights = false;

        private void Awake()
        {
            EnsurePlayerCameraReference();
            LocateVisualModelAndHud();
            StripChildColliders(firstPersonHeldModel);
        }

        private void Start()
        {
            currentCalculatedPpm = baselinePpm;
            peakRecordedPpm = baselinePpm;
            EnsurePlayerCameraReference();
            LocateLeakingDrumInScene();
            LocateVisualModelAndHud();

            if (detectorHudPanel != null)
                detectorHudPanel.SetActive(false);

            if (firstPersonHeldModel != null)
            {
                StripChildColliders(firstPersonHeldModel);
                firstPersonHeldModel.SetActive(false);
            }
        }

        private void EnsurePlayerCameraReference()
        {
            if (playerCamera == null)
            {
                FirstPersonResponderController responder = FindAnyObjectByType<FirstPersonResponderController>();
                if (responder != null)
                {
                    playerCamera = responder.GetComponentInChildren<Camera>();
                }
                if (playerCamera == null)
                {
                    playerCamera = Camera.main;
                }
            }
        }

        private void LocateVisualModelAndHud()
        {
            EnsurePlayerCameraReference();

            // Locate Held 3D Model
            if (firstPersonHeldModel == null && playerCamera != null)
            {
                Transform found = playerCamera.transform.Find("FP_GasDetector_HeldModel");
                if (found == null) found = playerCamera.transform.Find("Held_GasDetector_PID");
                if (found == null) found = playerCamera.transform.Find("FP_Held_3M_GasDetector");
                if (found == null) found = playerCamera.transform.Find("Held_PID_Detector");
                
                if (found != null)
                {
                    firstPersonHeldModel = found.gameObject;
                }
                else
                {
                    // Create procedural high-visibility held detector model on camera
                    CreateProceduralHeldDetector();
                }
            }

            // Locate HUD Overlay Panel
            if (detectorHudPanel == null)
            {
                GameObject hud = GameObject.Find("UI_GasDetector_Overlay");
                if (hud != null) detectorHudPanel = hud;
            }

            // Locate TMP Text fields
            if (detectorHudPanel != null)
            {
                if (livePpmText == null) livePpmText = detectorHudPanel.transform.Find("Text_LivePPM")?.GetComponent<TextMeshProUGUI>();
                if (peakPpmText == null) peakPpmText = detectorHudPanel.transform.Find("Text_PeakPPM")?.GetComponent<TextMeshProUGUI>();
            }
        }

        private void CreateProceduralHeldDetector()
        {
            if (playerCamera == null) return;

            GameObject root = new GameObject("FP_GasDetector_HeldModel");
            root.transform.SetParent(playerCamera.transform);
            root.transform.localPosition = hipPosition;
            root.transform.localRotation = Quaternion.identity;
            root.transform.localScale = Vector3.one * 0.4f;

            Shader litShader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard");

            // Main Detector Body (Safety Orange)
            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
            body.name = "Body";
            body.transform.SetParent(root.transform);
            body.transform.localPosition = Vector3.zero;
            body.transform.localScale = new Vector3(0.25f, 0.45f, 0.15f);
            Collider bodyCol = body.GetComponent<Collider>();
            if (bodyCol != null) { bodyCol.enabled = false; Destroy(bodyCol); }

            Material bodyMat = new Material(litShader);
            bodyMat.SetColor("_BaseColor", new Color(0.96f, 0.51f, 0.12f)); // Orange
            body.GetComponent<MeshRenderer>().material = bodyMat;

            // OLED Screen
            GameObject screen = GameObject.CreatePrimitive(PrimitiveType.Cube);
            screen.name = "Screen";
            screen.transform.SetParent(root.transform);
            screen.transform.localPosition = new Vector3(0f, 0.1f, -0.08f);
            screen.transform.localScale = new Vector3(0.2f, 0.18f, 0.02f);
            Collider screenCol = screen.GetComponent<Collider>();
            if (screenCol != null) { screenCol.enabled = false; Destroy(screenCol); }

            Material screenMat = new Material(litShader);
            screenMat.SetColor("_BaseColor", Color.black);
            screenMat.EnableKeyword("_EMISSION");
            screenMat.SetColor("_EmissionColor", new Color(0f, 0.9f, 1f) * 1.5f); // Cyan Glow
            screen.GetComponent<MeshRenderer>().material = screenMat;

            // Sniffer Probe
            GameObject probe = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            probe.name = "Probe";
            probe.transform.SetParent(root.transform);
            probe.transform.localPosition = new Vector3(0f, 0.32f, 0f);
            probe.transform.localScale = new Vector3(0.04f, 0.15f, 0.04f);
            Collider probeCol = probe.GetComponent<Collider>();
            if (probeCol != null) { probeCol.enabled = false; Destroy(probeCol); }

            StripChildColliders(root);
            firstPersonHeldModel = root;
        }

        private void StripChildColliders(GameObject root)
        {
            if (root == null) return;
            Collider[] colliders = root.GetComponentsInChildren<Collider>(true);
            foreach (var c in colliders)
            {
                c.enabled = false;
                c.isTrigger = true;
                if (Application.isPlaying)
                {
                    Destroy(c);
                }
            }

            Rigidbody[] rbs = root.GetComponentsInChildren<Rigidbody>(true);
            foreach (var rb in rbs)
            {
                rb.isKinematic = true;
                rb.detectCollisions = false;
                if (Application.isPlaying)
                {
                    Destroy(rb);
                }
            }
        }

        private void LocateLeakingDrumInScene()
        {
            LeakDrum[] drums = FindObjectsByType<LeakDrum>();
            foreach (var d in drums)
            {
                if (d.isLeaking)
                {
                    leakingDrum = d;
                    break;
                }
            }
        }

        private void Update()
        {
            if (!isEquipped) return;

            try
            {
                EnsurePlayerCameraReference();
                HandleAimDownSights();
                CalculateAtmosphericDiffusionModel();
                SimulateNeedleSpringDamperPhysics();
                UpdateOledTelemetryMatrix();
                UpdateAcousticModulation();
            }
            catch (System.Exception ex)
            {
                Debug.LogWarning($"[GasDetector Update Warning]: {ex.Message}");
            }
        }

        public void ToggleEquip()
        {
            if (isEquipped)
            {
                UnequipDetector();
            }
            else
            {
                EquipDetector();
            }
        }

        public void EquipDetector()
        {
            FirstPersonResponderController responder = FirstPersonResponderController.Instance;
            if (responder == null) responder = FindAnyObjectByType<FirstPersonResponderController>();

            if (responder != null && transform.root != responder.transform)
            {
                GasDetector playerDet = responder.GetComponentInChildren<GasDetector>(true);
                if (playerDet != null && playerDet != this)
                {
                    playerDet.EquipDetector();
                    gameObject.SetActive(false);
                    return;
                }
            }

            if (isEquipped) return;

            isEquipped = true;
            EnsurePlayerCameraReference();
            LocateVisualModelAndHud();

            MeshRenderer mr = GetComponent<MeshRenderer>();
            if (mr != null) mr.enabled = false;
            Collider col = GetComponent<Collider>();
            if (col != null) col.enabled = false;

            if (firstPersonHeldModel != null)
            {
                StripChildColliders(firstPersonHeldModel);
                firstPersonHeldModel.SetActive(true);
                firstPersonHeldModel.transform.localPosition = hipPosition;

                MeshRenderer[] renderers = firstPersonHeldModel.GetComponentsInChildren<MeshRenderer>(true);
                foreach (var r in renderers)
                {
                    r.enabled = true;
                }
            }

            if (responder != null)
            {
                responder.StripAllChildColliders();
                responder.SetCursorLock(true);
            }

            if (detectorHudPanel != null)
                detectorHudPanel.SetActive(true);

            if (GameManager.Instance != null)
                GameManager.Instance.RegisterDetectorEquipped();

            if (CbrsEventLogger.Instance != null)
                CbrsEventLogger.Instance.LogEvent("detector_equipped", "{}");

            Debug.Log("<color=yellow>[CBRS-X] Handheld Gas Detector EQUIPPED — Visible in First-Person View.</color>");
        }

        public void UnequipDetector()
        {
            if (!isEquipped) return;

            isEquipped = false;

            if (firstPersonHeldModel != null)
                firstPersonHeldModel.SetActive(false);

            if (detectorHudPanel != null)
                detectorHudPanel.SetActive(false);

            if (playerCamera != null)
            {
                playerCamera.fieldOfView = defaultFov;
            }

            Debug.Log("<color=grey>[CBRS-X] Handheld Gas Detector STOWED / UNEQUIPPED.</color>");
        }

        private void HandleAimDownSights()
        {
            isAimingDownSights = Input.GetMouseButton(1); // Right click hold

            if (firstPersonHeldModel != null)
            {
                Vector3 targetPos = isAimingDownSights ? adsPosition : hipPosition;
                firstPersonHeldModel.transform.localPosition = Vector3.Lerp(
                    firstPersonHeldModel.transform.localPosition,
                    targetPos,
                    Time.deltaTime * adsTransitionSpeed
                );
            }

            if (playerCamera != null)
            {
                float targetFov = isAimingDownSights ? zoomFov : defaultFov;
                playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, targetFov, Time.deltaTime * adsTransitionSpeed);
            }
        }

        private void CalculateAtmosphericDiffusionModel()
        {
            if (leakingDrum == null)
            {
                LocateLeakingDrumInScene();
                if (leakingDrum == null)
                {
                    currentCalculatedPpm = baselinePpm;
                    return;
                }
            }

            Vector3 detectorPos = (playerCamera != null) ? playerCamera.transform.position : transform.position;
            Vector3 drumPos = leakingDrum.transform.position;

            Vector3 delta = detectorPos - drumPos;
            float distance = delta.magnitude;

            if (distance > detectionRadius || leakingDrum.isContained)
            {
                currentCalculatedPpm = Mathf.MoveTowards(currentCalculatedPpm, baselinePpm, Time.deltaTime * 15f);
                return;
            }

            float normalizedDist = Mathf.Clamp01(distance / detectionRadius);
            float inverseSquareFalloff = 1.0f / Mathf.Pow(1.0f + normalizedDist * dispersionDiffusionCoeff, 2.0f);

            float windAlignment = 1.0f;
            if (ambientWindVector.sqrMagnitude > 0.01f && distance > 0.1f)
            {
                float dot = Vector3.Dot(delta.normalized, ambientWindVector.normalized);
                windAlignment = Mathf.Lerp(0.6f, 1.4f, (dot + 1.0f) * 0.5f);
            }

            float turbulenceNoise = Mathf.PerlinNoise(Time.time * turbulenceIntensity, 0.5f) * 0.25f + 0.875f;
            float targetPpm = baselinePpm + (maxPpm - baselinePpm) * inverseSquareFalloff * windAlignment * turbulenceNoise;

            currentCalculatedPpm = Mathf.Lerp(currentCalculatedPpm, targetPpm, Time.deltaTime * 4.5f);
            peakRecordedPpm = Mathf.Max(peakRecordedPpm, currentCalculatedPpm);
        }

        private void SimulateNeedleSpringDamperPhysics()
        {
            if (needleGaugeTransform == null) return;

            float normalizedPpm = Mathf.Clamp01((currentCalculatedPpm - baselinePpm) / (maxPpm - baselinePpm));
            float targetAngle = Mathf.Lerp(90f, -90f, normalizedPpm);

            float displacement = targetAngle - needlePositionAngle;
            float springForce = displacement * springStiffness;
            float dampingForce = -needleVelocity * damperCoefficient;

            float acceleration = springForce + dampingForce;
            needleVelocity += acceleration * Time.deltaTime;
            needlePositionAngle += needleVelocity * Time.deltaTime;

            float jitter = (Random.value - 0.5f) * needleJitterAmplitude * normalizedPpm;
            needleGaugeTransform.localRotation = Quaternion.Euler(0f, 0f, needlePositionAngle + jitter);
        }

        private void UpdateOledTelemetryMatrix()
        {
            if (livePpmText != null)
            {
                livePpmText.text = $"{currentCalculatedPpm:F1} PPM";
                livePpmText.color = (currentCalculatedPpm > 100f) ? Color.red :
                                    (currentCalculatedPpm > 50f) ? new Color(1f, 0.5f, 0f) : Color.cyan;
            }

            // Also update 3D physical screen text if present
            if (firstPersonHeldModel != null)
            {
                TextMeshPro text3D = firstPersonHeldModel.GetComponentInChildren<TextMeshPro>();
                if (text3D != null)
                {
                    text3D.text = $"{currentCalculatedPpm:F1} PPM";
                    text3D.color = (currentCalculatedPpm > 100f) ? Color.red :
                                   (currentCalculatedPpm > 50f) ? new Color(1f, 0.5f, 0f) : Color.green;
                }
            }

            if (peakPpmText != null)
            {
                peakPpmText.text = $"PEAK: {peakRecordedPpm:F1} PPM";
            }

            if (stelStatusText != null)
            {
                if (currentCalculatedPpm > 150f)
                {
                    stelStatusText.text = "CRITICAL: IDLH EXCEEDED";
                    stelStatusText.color = Color.red;
                }
                else if (currentCalculatedPpm > 75f)
                {
                    stelStatusText.text = "WARNING: STEL ACTIVE";
                    stelStatusText.color = new Color(1f, 0.6f, 0.1f);
                }
                else
                {
                    stelStatusText.text = "ATMOSPHERE: MONITORING";
                    stelStatusText.color = Color.green;
                }
            }
        }

        private void UpdateAcousticModulation()
        {
            if (geigerAudioSource == null || geigerTickClip == null) return;

            float normalizedPpm = Mathf.Clamp01((currentCalculatedPpm - baselinePpm) / (maxPpm - baselinePpm));
            float tickInterval = Mathf.Lerp(0.8f, 0.05f, normalizedPpm);

            geigerTimer += Time.deltaTime;
            if (geigerTimer >= tickInterval)
            {
                geigerTimer = 0f;
                geigerAudioSource.pitch = Random.Range(0.9f, 1.15f);
                geigerAudioSource.PlayOneShot(geigerTickClip, Mathf.Lerp(0.3f, 1.0f, normalizedPpm));
            }
        }

        public void ScanDrum(LeakDrum drum)
        {
            if (drum == null) return;

            drum.ScanDrum();

            if (drum.isLeaking)
            {
                Debug.Log($"<color=red>[CBRS-X] Toxic leak validated on drum: {drum.drumId} (Concentration: {currentCalculatedPpm:F1} PPM)</color>");
                if (GameManager.Instance != null)
                {
                    GameManager.Instance.RegisterLeakIdentified(drum.drumId);
                }
            }
            else
            {
                Debug.Log($"<color=green>[CBRS-X] Drum {drum.drumId} confirmed intact (0 PPM above baseline).</color>");
            }
        }
    }
}
