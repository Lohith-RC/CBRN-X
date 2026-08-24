using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace CBRSX.Unity
{
    /// <summary>
    /// PostProcessingController V2.0 — High-fidelity runtime post-processing driver.
    /// Controls URP Volume overrides to dynamically manipulate camera optics,
    /// color grading LUT profiles, chromatic aberration, film grain, and lens distortion
    /// in response to simulation events (CCTV surveillance, hazard alarm, visor donning, decon deluge).
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

        // Transition Smoothing
        private float transitionSpeed = 3.5f;
        private bool isVisorActive = false;
        private bool isCctvActive = false;
        private bool isHazardAlarm = false;

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

        private void Update()
        {
            UpdateOpticalTransitions();
        }

        /// <summary>
        /// Smoothly interpolates volume override parameters based on current operational mode.
        /// </summary>
        private void UpdateOpticalTransitions()
        {
            if (profile == null) return;

            float dt = Time.deltaTime * transitionSpeed;

            if (isVisorActive)
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
            else if (isCctvActive)
            {
                if (filmGrain != null)
                    filmGrain.intensity.value = Mathf.Lerp(filmGrain.intensity.value, cctvGrainIntensity, dt);
                if (colorAdjustments != null)
                    colorAdjustments.colorFilter.value = Color.Lerp(colorAdjustments.colorFilter.value, cctvTint, dt);
                if (vignette != null)
                    vignette.intensity.value = Mathf.Lerp(vignette.intensity.value, 0.4f, dt);
            }
            else if (isHazardAlarm)
            {
                if (colorAdjustments != null)
                {
                    float pulse = Mathf.PingPong(Time.time * 2f, 1f);
                    colorAdjustments.colorFilter.value = Color.Lerp(Color.white, hazardAlarmTint, pulse * 0.4f);
                }
            }
            else
            {
                // Default Clean Tactical Profile
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
        }

        public void SetVisorOpticsActive(bool active)
        {
            isVisorActive = active;
            isCctvActive = false;
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
    }
}
