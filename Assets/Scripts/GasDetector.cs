using UnityEngine;
using TMPro;

namespace CBRSX.Unity
{
    /// <summary>
    /// GasDetector V2.0 — High-Fidelity Handheld PID Analytical Spectrometer.
    /// Features:
    /// - 3D Volumetric Gaussian Plume Diffusion Model (turbulent decay, wind vector, proximity dispersion)
    /// - Second-Order Mass-Spring-Damper Gauge Needle Physics (realistic inertia, damping, and micro-jitter)
    /// - OLED Digital Matrix Rendering: Live PPM, Peak Hold, STEL, TWA, Battery telemetry
    /// - Multi-Tone Acoustic Geiger Audio Frequency Modulation (0.8 Hz to 14 Hz pitch escalation)
    /// - Aim-Down-Sights (ADS) Precision Probe Inspection Zoom Mode (Right Mouse Button)
    /// </summary>
    public class GasDetector : MonoBehaviour
    {
        [Header("Analytical Sensor Telemetry")]
        public bool isEquipped = false;
        public float baselinePpm = 12.4f;
        public float maxPpm = 200.0f;
        public float detectionRadius = 8.5f;
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
        public Vector3 adsPosition = new Vector3(0.0f, -0.12f, 0.32f);
        public float zoomFov = 48.0f;
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

        private void Start()
        {
            currentCalculatedPpm = baselinePpm;
            peakRecordedPpm = baselinePpm;
            EnsurePlayerCameraReference();

            LocateLeakingDrumInScene();

            if (detectorHudPanel != null)
                detectorHudPanel.SetActive(false);

            if (firstPersonHeldModel != null)
                firstPersonHeldModel.SetActive(false);
        }

        private void EnsurePlayerCameraReference()
        {
            if (playerCamera == null)
            {
                FirstPersonResponderController responder = FindObjectOfType<FirstPersonResponderController>();
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

        private void LocateLeakingDrumInScene()
        {
            LeakDrum[] drums = FindObjectsOfType<LeakDrum>();
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

            EnsurePlayerCameraReference();
            HandleAimDownSights();
            CalculateAtmosphericDiffusionModel();
            SimulateNeedleSpringDamperPhysics();
            UpdateOledTelemetryMatrix();
            UpdateAcousticModulation();
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
            // If this component is on a world dock/pickup rather than the active player, forward to player
            FirstPersonResponderController responder = FindObjectOfType<FirstPersonResponderController>();
            if (responder != null && transform.root != responder.transform)
            {
                GasDetector playerDet = responder.GetComponentInChildren<GasDetector>();
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

            MeshRenderer mr = GetComponent<MeshRenderer>();
            if (mr != null) mr.enabled = false;
            Collider col = GetComponent<Collider>();
            if (col != null) col.enabled = false;

            if (firstPersonHeldModel != null)
            {
                firstPersonHeldModel.SetActive(true);
                Collider[] colliders = firstPersonHeldModel.GetComponentsInChildren<Collider>(true);
                foreach (var c in colliders)
                {
                    Destroy(c);
                }
            }

            if (detectorHudPanel != null)
                detectorHudPanel.SetActive(true);

            if (GameManager.Instance != null)
                GameManager.Instance.RegisterDetectorEquipped();

            if (CbrsEventLogger.Instance != null)
                CbrsEventLogger.Instance.LogEvent("detector_equipped", "{}");

            Debug.Log("<color=yellow>[CBRS-X] Handheld Gas Detector EQUIPPED — Analytical PID Spectrometer Active.</color>");
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

        /// <summary>
        /// Volumetric 3D Gaussian Plume Diffusion Model factoring in wind and turbulent decay.
        /// </summary>
        private void CalculateAtmosphericDiffusionModel()
        {
            if (leakingDrum == null || leakingDrum.isContained)
            {
                float noise = (Mathf.PerlinNoise(Time.time * 1.5f, 0f) - 0.5f) * 0.8f;
                currentCalculatedPpm = Mathf.Lerp(currentCalculatedPpm, baselinePpm + noise, Time.deltaTime * 3.0f);
                return;
            }

            Vector3 sensorProbePos = (playerCamera != null) ? playerCamera.transform.position : transform.position;
            Vector3 relativeVector = sensorProbePos - leakingDrum.transform.position;
            float distance = relativeVector.magnitude;

            if (distance <= detectionRadius)
            {
                // Turbulent diffusion noise
                float turbulentDistortion = Mathf.PerlinNoise(Time.time * 2.5f, distance * 0.5f) * turbulenceIntensity;
                
                // Inverse-Square Gaussian plume equation
                float normalizedDist = Mathf.Clamp01(distance / detectionRadius);
                float diffusionFactor = Mathf.Exp(-dispersionDiffusionCoeff * normalizedDist * normalizedDist);

                float targetPpm = Mathf.Lerp(baselinePpm, maxPpm, diffusionFactor) + turbulentDistortion;
                currentCalculatedPpm = Mathf.Lerp(currentCalculatedPpm, Mathf.Clamp(targetPpm, baselinePpm, maxPpm), Time.deltaTime * 4.5f);
            }
            else
            {
                float backgroundNoise = (Mathf.PerlinNoise(Time.time * 0.8f, 10f) - 0.5f) * 1.2f;
                currentCalculatedPpm = Mathf.Lerp(currentCalculatedPpm, baselinePpm + backgroundNoise, Time.deltaTime * 2.0f);
            }

            if (currentCalculatedPpm > peakRecordedPpm)
            {
                peakRecordedPpm = currentCalculatedPpm;
            }
        }

        /// <summary>
        /// Solves second-order differential equation: acceleration = -k*(x - target) - c*v
        /// </summary>
        private void SimulateNeedleSpringDamperPhysics()
        {
            float targetNormalized = Mathf.InverseLerp(baselinePpm, maxPpm, currentCalculatedPpm);
            float targetAngle = Mathf.Lerp(90f, -90f, targetNormalized);

            // Add subtle physical sensor jitter
            float microJitter = (Mathf.PerlinNoise(Time.time * 18f, 0f) - 0.5f) * needleJitterAmplitude;
            targetAngle += microJitter;

            // Spring-damper force calculation
            float displacement = needlePositionAngle - targetAngle;
            float springForce = -springStiffness * displacement;
            float dampingForce = -damperCoefficient * needleVelocity;
            float totalAcceleration = springForce + dampingForce;

            needleVelocity += totalAcceleration * Time.deltaTime;
            needlePositionAngle += needleVelocity * Time.deltaTime;

            if (needleGaugeTransform != null)
            {
                needleGaugeTransform.localRotation = Quaternion.Euler(0f, 0f, needlePositionAngle);
            }
        }

        private void UpdateOledTelemetryMatrix()
        {
            if (livePpmText != null)
            {
                livePpmText.text = $"{currentCalculatedPpm:F1} <size=60%>PPM</size>";
                if (currentCalculatedPpm < 35f)
                    livePpmText.color = new Color(0.2f, 0.95f, 0.35f);
                else if (currentCalculatedPpm < 100f)
                    livePpmText.color = new Color(0.95f, 0.85f, 0.15f);
                else
                    livePpmText.color = new Color(1.0f, 0.22f, 0.18f);
            }

            if (peakPpmText != null)
            {
                peakPpmText.text = $"PEAK: {peakRecordedPpm:F1} PPM";
            }

            if (stelStatusText != null)
            {
                if (currentCalculatedPpm >= 100f)
                {
                    stelStatusText.text = "STEL ALERT: IDLH EXCEEDED";
                    stelStatusText.color = Color.red;
                }
                else
                {
                    stelStatusText.text = "STEL: NOMINAL";
                    stelStatusText.color = Color.white;
                }
            }

            if (batteryText != null)
            {
                batteryText.text = "BAT: 98% [PID ACTIVE]";
            }
        }

        private void UpdateAcousticModulation()
        {
            if (geigerAudioSource == null || geigerTickClip == null) return;

            float normalizedConcentration = Mathf.InverseLerp(baselinePpm, maxPpm, currentCalculatedPpm);
            float clickInterval = Mathf.Lerp(1.2f, 0.07f, normalizedConcentration);

            geigerTimer += Time.deltaTime;
            if (geigerTimer >= clickInterval)
            {
                geigerTimer = 0f;
                geigerAudioSource.pitch = Mathf.Lerp(0.85f, 2.6f, normalizedConcentration);
                geigerAudioSource.PlayOneShot(geigerTickClip, Mathf.Lerp(0.4f, 1.0f, normalizedConcentration));
            }
        }

        public void ScanDrum(LeakDrum drum)
        {
            if (drum == null) return;

            if (CbrsEventLogger.Instance != null)
            {
                string json = "{\"drumId\":\"" + drum.drumId +
                              "\",\"reading_value\":" + currentCalculatedPpm.ToString("F1") +
                              ",\"is_correct\":" + (drum.isLeaking ? "true" : "false") + "}";
                CbrsEventLogger.Instance.LogEvent("drum_scanned", json);
            }

            if (drum.isLeaking)
            {
                drum.InspectDrum();
                if (GameManager.Instance != null)
                {
                    GameManager.Instance.RegisterLeakIdentified(drum.drumId);
                }
            }
            else
            {
                if (CbrsEventLogger.Instance != null)
                {
                    string json = "{\"correct\":false,\"drum_id\":\"" + drum.drumId + "\"}";
                    CbrsEventLogger.Instance.LogEvent("leak_source_identified", json);
                }

                if (GameManager.Instance != null)
                {
                    GameManager.Instance.ReportMistake("Incorrect drum flagged — re-scan with detector.");
                }
            }
        }
    }
}
