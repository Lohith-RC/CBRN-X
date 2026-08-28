using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace CBRSX.Unity
{
    /// <summary>
    /// PostProcessingController V3.0 — Stage-Reactive Post-Processing Driver.
    /// Controls URP Volume overrides to dynamically manipulate camera optics,
    /// color grading LUT profiles, chromatic aberration, film grain, and lens distortion.
    /// Now features:
    /// - Per-stage post-processing profiles (Briefing clean, Hazard sickly, Decon wet)
    /// - Hazard proximity-based saturation shift toward toxic green
    /// - Water droplet noise overlay during decon
    /// - Mission complete golden bloom surge
    /// - Smooth transition interpolation between all profiles
    /// </summary>
    [RequireComponent(typeof(Volume))]
    public class PostProcessingController : MonoBehaviour
    {
        public static PostProcessingController Instance { get; private set; }

        [Header("Volume Configuration")]
        private Volume postProcessVolume;
        private VolumeProfile profile;

        // URP Volume Component Overrides
        private ChromaticAberration chromaticAberration;
        private LensDistortion lensDistortion;
        private FilmGrain filmGrain;
        private Vignette vignette;
        private ColorAdjustments colorAdjustments;
        private Bloom bloom;

        [Header("Visor Optical Profile Settings")]
        [Range(0f, 1f)] public float targetVisorVignette = 0.65f;
        [Range(-1f, 1f)] public float targetVisorDistortion = -0.25f;
        [Range(0f, 1f)] public float targetVisorAberration = 0.45f;
        public Color visorTint = new Color(0.92f, 0.96f, 0.98f, 1f);

        [Header("CCTV Surveillance Profile Settings")]
        public Color cctvTint = new Color(0.7f, 0.95f, 0.75f, 1f);
        [Range(0f, 1f)] public float cctvGrainIntensity = 0.85f;

        [Header("Critical Hazard Flash Settings")]
        public Color hazardAlarmTint = new Color(1f, 0.45f, 0.35f, 1f);

        [Header("Hazard Proximity Effect")]
        public Color hazardProximityTint = new Color(0.85f, 0.92f, 0.55f, 1f);
        public float hazardProximityVignetteMax = 0.55f;

        [Header("Decon Water Droplet Effect")]
        [Range(0f, 1f)] public float deconGrainIntensity = 0.65f;
        [Range(-1f, 1f)] public float deconDistortion = -0.15f;

        [Header("Mission Complete Profile")]
        public Color missionCompleteTint = new Color(1.0f, 0.95f, 0.82f, 1f);
        public float missionCompleteBloom = 3.0f;

        // Transition Smoothing
        private float transitionSpeed = 3.5f;
        private bool isVisorActive = false;
        private bool isCctvActive = false;
        private bool isHazardAlarm = false;
        private GameManager.ScenarioStage currentStage = GameManager.ScenarioStage.BriefingOperational;
        private float hazardProximityFactor = 0f;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
                return;
            }

            postProcessVolume = GetComponent<Volume>();
            if (postProcessVolume != null)
            {
                profile = postProcessVolume.profile;
                profile.TryGet(out chromaticAberration);
                profile.TryGet(out lensDistortion);
                profile.TryGet(out filmGrain);
                profile.TryGet(out vignette);
                profile.TryGet(out colorAdjustments);
                profile.TryGet(out bloom);
            }
        }

        private void Start()
        {
            if (GameManager.Instance != null)
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
            UpdateHazardProximity();
            UpdateOpticalTransitions();
        }

        private void UpdateHazardProximity()
        {
            Camera cam = Camera.main;
            if (cam == null) return;

            LeakDrum[] drums = FindObjectsByType<LeakDrum>();
            float nearestDist = float.MaxValue;
            bool anyActive = false;

            foreach (var d in drums)
            {
                if (d.isLeaking && !d.isContained)
                {
                    anyActive = true;
                    float dist = Vector3.Distance(cam.transform.position, d.transform.position);
                    if (dist < nearestDist) nearestDist = dist;
                }
            }

            if (anyActive)
            {
                hazardProximityFactor = Mathf.Clamp01(1.0f - nearestDist / 12f);
            }
            else
            {
                hazardProximityFactor = Mathf.Lerp(hazardProximityFactor, 0f, Time.deltaTime * 2f);
            }
        }

        /// <summary>
        /// Smoothly interpolates volume override parameters based on current operational mode and stage.
        /// </summary>
        private void UpdateOpticalTransitions()
        {
            if (profile == null) return;

            float dt = Time.deltaTime * transitionSpeed;

            if (isVisorActive)
            {
                ApplyVisorProfile(dt);
            }
            else if (isCctvActive)
            {
                ApplyCctvProfile(dt);
            }
            else if (isHazardAlarm)
            {
                ApplyHazardAlarmProfile(dt);
            }
            else
            {
                ApplyStageProfile(dt);
            }

            // Always apply hazard proximity overlay on top
            if (hazardProximityFactor > 0.01f && !isCctvActive)
            {
                ApplyHazardProximityOverlay(dt);
            }
        }

        private void ApplyVisorProfile(float dt)
        {
            if (lensDistortion != null)
                lensDistortion.intensity.value = Mathf.Lerp(lensDistortion.intensity.value, targetVisorDistortion, dt);
            if (vignette != null)
                vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, targetVisorVignette, dt);
            if (chromaticAberration != null)
                chromaticAberration.intensity.value = Mathf.Lerp(chromaticAberration.intensity.value, targetVisorAberration, dt);
            if (colorAdjustments != null)
                colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, visorTint, dt);
        }

        private void ApplyCctvProfile(float dt)
        {
            if (filmGrain != null)
                filmGrain.intensity.value = Mathf.Lerp(filmGrain.intensity.value, cctvGrainIntensity, dt);
            if (colorAdjustments != null)
                colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, cctvTint, dt);
            if (vignette != null)
                vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.4f, dt);
            if (chromaticAberration != null)
                chromaticAberration.intensity.value = Mathf.Lerp(chromaticAberration.intensity.value, 0.6f, dt);
        }

        private void ApplyHazardAlarmProfile(float dt)
        {
            if (colorAdjustments != null)
            {
                float pulse = Mathf.PingPong(Time.time * 2f, 1f);
                colorAdjustments.colorFilter.value = Color.Lerp(Color.white, hazardAlarmTint, pulse * 0.4f);
            }
            if (vignette != null)
                vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.5f, dt);
        }

        private void ApplyStageProfile(float dt)
        {
            switch (currentStage)
            {
                case GameManager.ScenarioStage.BriefingOperational:
                case GameManager.ScenarioStage.PerimeterAssessment:
                    // Clean neutral profile
                    ApplyCleanProfile(dt);
                    break;

                case GameManager.ScenarioStage.LevelBDonning:
                    // Slight warm tint
                    ApplyCleanProfile(dt);
                    if (colorAdjustments != null)
                        colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, new Color(1f, 0.98f, 0.92f), dt);
                    break;

                case GameManager.ScenarioStage.ChemicalSpectrometry:
                case GameManager.ScenarioStage.CivilianExtraction:
                case GameManager.ScenarioStage.HazardContainment:
                    // Tense profile — slight grain, tighter vignette
                    if (lensDistortion != null)
                        lensDistortion.intensity.value = Mathf.Lerp(lensDistortion.intensity.value, -0.08f, dt);
                    if (vignette != null)
                        vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.32f, dt);
                    if (chromaticAberration != null)
                        chromaticAberration.intensity.value = Mathf.Lerp(chromaticAberration.intensity.value, 0.12f, dt);
                    if (filmGrain != null)
                        filmGrain.intensity.value = Mathf.Lerp(filmGrain.intensity.value, 0.18f, dt);
                    if (colorAdjustments != null)
                        colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, Color.white, dt);
                    break;

                case GameManager.ScenarioStage.DeconNeutralization:
                    // Water droplet effect
                    if (filmGrain != null)
                        filmGrain.intensity.value = Mathf.Lerp(filmGrain.intensity.value, deconGrainIntensity, dt);
                    if (lensDistortion != null)
                        lensDistortion.intensity.value = Mathf.Lerp(lensDistortion.intensity.value, deconDistortion, dt);
                    if (vignette != null)
                        vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.25f, dt);
                    if (colorAdjustments != null)
                        colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, new Color(0.9f, 0.95f, 1.0f), dt);
                    break;

                case GameManager.ScenarioStage.MissionDebrief:
                    // Golden bloom surge — vignette fades to 0
                    if (bloom != null)
                        bloom.intensity.value = Mathf.Lerp(bloom.intensity.value, missionCompleteBloom, dt * 0.5f);
                    if (vignette != null)
                        vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.05f, dt);
                    if (colorAdjustments != null)
                        colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, missionCompleteTint, dt * 0.5f);
                    if (filmGrain != null)
                        filmGrain.intensity.value = Mathf.Lerp(filmGrain.intensity.value, 0f, dt);
                    if (chromaticAberration != null)
                        chromaticAberration.intensity.value = Mathf.Lerp(chromaticAberration.intensity.value, 0f, dt);
                    break;

                default:
                    ApplyCleanProfile(dt);
                    break;
            }
        }

        private void ApplyCleanProfile(float dt)
        {
            if (lensDistortion != null)
                lensDistortion.intensity.value = Mathf.Lerp(lensDistortion.intensity.value, 0f, dt);
            if (vignette != null)
                vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.2f, dt);
            if (chromaticAberration != null)
                chromaticAberration.intensity.value = Mathf.Lerp(chromaticAberration.intensity.value, 0.05f, dt);
            if (filmGrain != null)
                filmGrain.intensity.value = Mathf.Lerp(filmGrain.intensity.value, 0.1f, dt);
            if (colorAdjustments != null)
                colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, Color.white, dt);
        }

        private void ApplyHazardProximityOverlay(float dt)
        {
            if (colorAdjustments != null)
            {
                Color currentColor = colorAdjustments.colorFilter.value;
                Color proximityColor = Color.Lerp(currentColor, hazardProximityTint, hazardProximityFactor * 0.35f);
                colorAdjustments.colorFilter.value = Color.Lerp(currentColor, proximityColor, dt);
            }

            if (vignette != null)
            {
                float currentVignette = vignette.intensity.value;
                float proximityVignette = Mathf.Lerp(currentVignette, hazardProximityVignetteMax, hazardProximityFactor);
                vignette.intensity.value = Mathf.Lerp(currentVignette, proximityVignette, dt * 0.5f);
            }
        }

        public void SetVisorOpticsActive(bool active)
        {
            isVisorActive = active;
            isCctvActive = false;
        }

        public void SetVisorFogIntensity(float intensity)
        {
            if (vignette != null && isVisorActive)
            {
                targetVisorVignette = Mathf.Clamp(0.65f + intensity * 0.2f, 0.4f, 0.95f);
            }
        }

        public void SetCctvModeActive(bool active)
        {
            isCctvActive = active;
            isVisorActive = false;
        }

        public void TriggerHazardAlarmPulse(bool active)
        {
            isHazardAlarm = active;
        }

        public void TriggerFlashImpulse(float intensity)
        {
            if (bloom != null)
            {
                bloom.intensity.value = Mathf.Max(bloom.intensity.value, intensity * 5f);
            }
        }

        private void OnStageChanged(GameManager.ScenarioStage newStage)
        {
            currentStage = newStage;
        }
    }
}
