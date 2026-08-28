using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// EmergencyLightingFlasher V2.0 — Stage-Reactive Multi-Pattern Emergency Lighting.
    /// Features:
    /// - Red Emergency Strobes with sharp cubic pulse
    /// - Rotating Amber Emergency Beacon with smooth rotation
    /// - Damaged Electrical Panel Spark Glow with randomized burst patterns
    /// - Blue Decon Area Strobe (distinct from red emergency)
    /// - Floor-Level Green LED Path Strips (emissive material pulsing)
    /// - Random Power Brownout Flicker (1-2s dramatic total dimming)
    /// - Automatic sync with GameManager stages for lighting pattern changes
    /// </summary>
    public class EmergencyLightingFlasher : MonoBehaviour
    {
        [Header("Red Emergency Strobes")]
        public Light[] redStrobes;
        public float strobeFrequency = 1.6f;
        public float maxStrobeIntensity = 4.0f;
        public float minStrobeIntensity = 0.2f;

        [Header("Rotating Amber Emergency Beacon")]
        public Transform amberBeaconTransform;
        public Light amberBeaconLight;
        public float beaconRotationSpeed = 320.0f;
        public float beaconPulseSpeed = 2.5f;

        [Header("Damaged Electrical Panel Spark Glow")]
        public Light electricalSparkLight;
        public ParticleSystem electricalSparkParticles;
        private float nextSparkTime = 0f;

        [Header("Blue Decontamination Strobes")]
        public Light[] blueDeconStrobes;
        public float blueStrobeFrequency = 2.2f;
        public float blueMaxIntensity = 3.5f;

        [Header("Floor-Level Green LED Path Strips")]
        public MeshRenderer[] greenLedStrips;
        public float ledPulseSpeed = 1.2f;
        public Color ledBaseColor = new Color(0.1f, 0.8f, 0.3f, 1f);
        public float ledMinEmission = 0.3f;
        public float ledMaxEmission = 1.5f;

        [Header("Power Brownout Flicker")]
        public Light[] allFacilityLights;
        public float minBrownoutInterval = 45f;
        public float maxBrownoutInterval = 120f;
        public float brownoutDuration = 1.5f;
        public float brownoutDimLevel = 0.05f;

        [Header("Stage Sync")]
        public bool syncWithGameManager = true;

        // Internal State
        private float brownoutTimer = 0f;
        private float brownoutActiveTimer = 0f;
        private bool isBrownoutActive = false;
        private float[] facilityLightBaseIntensities;
        private GameManager.ScenarioStage currentStage = GameManager.ScenarioStage.BriefingOperational;

        private void Start()
        {
            brownoutTimer = Random.Range(minBrownoutInterval, maxBrownoutInterval);

            // Cache baseline intensities for brownout restoration
            if (allFacilityLights != null && allFacilityLights.Length > 0)
            {
                facilityLightBaseIntensities = new float[allFacilityLights.Length];
                for (int i = 0; i < allFacilityLights.Length; i++)
                {
                    if (allFacilityLights[i] != null)
                        facilityLightBaseIntensities[i] = allFacilityLights[i].intensity;
                }
            }

            // Subscribe to stage changes
            if (syncWithGameManager && GameManager.Instance != null)
            {
                GameManager.Instance.OnStageTransition += OnStageChanged;
            }
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
            float time = Time.time;

            UpdateRedStrobes(time);
            UpdateAmberBeacon(time);
            UpdateElectricalSparks(time);
            UpdateBlueDeconStrobes(time);
            UpdateGreenLedStrips(time);
            UpdatePowerBrownout();
        }

        private void UpdateRedStrobes(float time)
        {
            if (redStrobes == null || redStrobes.Length == 0) return;

            // Intensity ramps up during hazard stages
            float stageMultiplier = GetStageIntensityMultiplier();

            float strobeWave = Mathf.PingPong(time * strobeFrequency * 2f, 1.0f);
            float sharpPulse = Mathf.Pow(strobeWave, 3.0f);
            float intensity = Mathf.Lerp(minStrobeIntensity, maxStrobeIntensity * stageMultiplier, sharpPulse);

            for (int i = 0; i < redStrobes.Length; i++)
            {
                if (redStrobes[i] != null)
                {
                    // Alternate phase for each strobe pair
                    float phaseOffset = (i % 2 == 0) ? 0f : 0.5f / strobeFrequency;
                    float localWave = Mathf.PingPong((time + phaseOffset) * strobeFrequency * 2f, 1.0f);
                    float localPulse = Mathf.Pow(localWave, 3.0f);
                    redStrobes[i].intensity = Mathf.Lerp(minStrobeIntensity, maxStrobeIntensity * stageMultiplier, localPulse);
                }
            }
        }

        private void UpdateAmberBeacon(float time)
        {
            if (amberBeaconTransform != null)
            {
                amberBeaconTransform.Rotate(Vector3.up, beaconRotationSpeed * Time.deltaTime, Space.World);
            }
            if (amberBeaconLight != null)
            {
                float pulse = 0.7f + 0.3f * Mathf.Sin(time * beaconPulseSpeed * Mathf.PI * 2f);
                amberBeaconLight.intensity = 3.5f * pulse;
            }
        }

        private void UpdateElectricalSparks(float time)
        {
            if (electricalSparkLight == null) return;

            if (time > nextSparkTime)
            {
                electricalSparkLight.intensity = Random.Range(3.0f, 6.5f);
                nextSparkTime = time + Random.Range(0.08f, 0.25f);

                // Burst spark particles during flash
                if (electricalSparkParticles != null && Random.value < 0.4f)
                {
                    electricalSparkParticles.Emit(Random.Range(3, 8));
                }

                if (Random.value < 0.15f)
                {
                    nextSparkTime = time + Random.Range(1.5f, 3.5f);
                    electricalSparkLight.intensity = 0f;
                }
            }
            else
            {
                electricalSparkLight.intensity = Mathf.Lerp(electricalSparkLight.intensity, 0f, Time.deltaTime * 15f);
            }
        }

        private void UpdateBlueDeconStrobes(float time)
        {
            if (blueDeconStrobes == null || blueDeconStrobes.Length == 0) return;

            // Only active during decon stage
            bool isDeconStage = currentStage == GameManager.ScenarioStage.DeconNeutralization;

            for (int i = 0; i < blueDeconStrobes.Length; i++)
            {
                if (blueDeconStrobes[i] == null) continue;

                if (isDeconStage)
                {
                    float pulse = Mathf.PingPong((time + i * 0.3f) * blueStrobeFrequency * 2f, 1.0f);
                    blueDeconStrobes[i].intensity = Mathf.Pow(pulse, 2f) * blueMaxIntensity;
                    blueDeconStrobes[i].enabled = true;
                }
                else
                {
                    blueDeconStrobes[i].intensity = Mathf.Lerp(blueDeconStrobes[i].intensity, 0f, Time.deltaTime * 3f);
                    if (blueDeconStrobes[i].intensity < 0.01f)
                        blueDeconStrobes[i].enabled = false;
                }
            }
        }

        private void UpdateGreenLedStrips(float time)
        {
            if (greenLedStrips == null) return;

            float emission = Mathf.Lerp(ledMinEmission, ledMaxEmission,
                (Mathf.Sin(time * ledPulseSpeed * Mathf.PI * 2f) + 1f) * 0.5f);

            Color emissionColor = ledBaseColor * emission;

            for (int i = 0; i < greenLedStrips.Length; i++)
            {
                if (greenLedStrips[i] != null && greenLedStrips[i].material != null)
                {
                    // Sequential chase animation
                    float offset = (i / (float)greenLedStrips.Length) * Mathf.PI * 2f;
                    float localEmission = Mathf.Lerp(ledMinEmission, ledMaxEmission,
                        (Mathf.Sin(time * ledPulseSpeed * Mathf.PI * 2f + offset) + 1f) * 0.5f);
                    greenLedStrips[i].material.SetColor("_EmissionColor", ledBaseColor * localEmission);
                }
            }
        }

        private void UpdatePowerBrownout()
        {
            if (allFacilityLights == null || allFacilityLights.Length == 0) return;

            if (isBrownoutActive)
            {
                brownoutActiveTimer -= Time.deltaTime;
                if (brownoutActiveTimer <= 0f)
                {
                    isBrownoutActive = false;
                    brownoutTimer = Random.Range(minBrownoutInterval, maxBrownoutInterval);

                    // Restore all lights
                    for (int i = 0; i < allFacilityLights.Length; i++)
                    {
                        if (allFacilityLights[i] != null && facilityLightBaseIntensities != null)
                            allFacilityLights[i].intensity = facilityLightBaseIntensities[i];
                    }
                }
                else
                {
                    // Flicker during brownout
                    float flicker = Random.Range(brownoutDimLevel, brownoutDimLevel + 0.15f);
                    for (int i = 0; i < allFacilityLights.Length; i++)
                    {
                        if (allFacilityLights[i] != null && facilityLightBaseIntensities != null)
                            allFacilityLights[i].intensity = facilityLightBaseIntensities[i] * flicker;
                    }
                }
            }
            else
            {
                brownoutTimer -= Time.deltaTime;
                if (brownoutTimer <= 0f)
                {
                    isBrownoutActive = true;
                    brownoutActiveTimer = brownoutDuration;

                    // Add trauma for dramatic effect
                    FirstPersonResponderController responder = FindAnyObjectByType<FirstPersonResponderController>();
                    if (responder != null)
                    {
                        responder.AddTrauma(0.1f);
                    }
                }
            }
        }

        private float GetStageIntensityMultiplier()
        {
            switch (currentStage)
            {
                case GameManager.ScenarioStage.BriefingOperational:
                    return 0.5f;
                case GameManager.ScenarioStage.PerimeterAssessment:
                    return 0.7f;
                case GameManager.ScenarioStage.LevelBDonning:
                    return 0.8f;
                case GameManager.ScenarioStage.ChemicalSpectrometry:
                case GameManager.ScenarioStage.CivilianExtraction:
                    return 1.0f;
                case GameManager.ScenarioStage.HazardContainment:
                    return 1.2f;
                case GameManager.ScenarioStage.DeconNeutralization:
                    return 0.6f;
                case GameManager.ScenarioStage.MissionDebrief:
                    return 0.3f;
                default:
                    return 1.0f;
            }
        }

        private void OnStageChanged(GameManager.ScenarioStage newStage)
        {
            currentStage = newStage;
        }
    }
}