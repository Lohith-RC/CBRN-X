using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// LeakDrum V2.0 — Volumetric Hazard Source & Corrosive Plume Controller.
    /// Features:
    /// - Dynamic URP Particle System Plume Throttling (gradual decay during sealant injection)
    /// - Corrosive Material Degradation: Shader parameter blending for toxic residue and surface rust
    /// - Chemical Puddle Expansion: Real-time ground decal scaling
    /// - Acoustic Resonance: Pressurized gas hiss loop modulation with containment cutoff
    /// </summary>
    public class LeakDrum : MonoBehaviour
    {
        [Header("Hazard Identity & State")]
        public string drumId = "DRUM-02";
        public bool isLeaking = true;
        public bool isContained = false;

        [Header("Volumetric Gas Plume VFX")]
        public ParticleSystem gasCloudParticleSystem;
        public float maxEmissionRate = 85.0f;
        public Color toxicVaporColor = new Color(0.85f, 0.95f, 0.25f, 0.75f);

        [Header("Chemical Puddle Decal")]
        public Transform chemicalPuddleDecal;
        public float maxPuddleScale = 4.2f;
        public float puddleExpansionRate = 0.15f;
        private float currentPuddleScale = 0.8f;

        [Header("Acoustic Pressurized Venting")]
        public AudioSource ventingAudioSource;
        public AudioClip gasHissLoopClip;
        public AudioClip sealPneumaticSnapClip;

        [Header("Corrosive Material Properties")]
        public Renderer drumRenderer;
        public string corrosionShaderProperty = "_CorrosionIntensity";
        private Material drumMaterialInstance;

        private void Start()
        {
            if (drumRenderer != null)
            {
                drumMaterialInstance = drumRenderer.material;
            }

            if (isLeaking && !isContained)
            {
                InitializePlumeVFX();
            }
            else
            {
                if (gasCloudParticleSystem != null)
                    gasCloudParticleSystem.Stop();
            }
        }

        private void InitializePlumeVFX()
        {
            if (gasCloudParticleSystem != null)
            {
                var main = gasCloudParticleSystem.main;
                main.startColor = toxicVaporColor;

                var emission = gasCloudParticleSystem.emission;
                emission.rateOverTime = maxEmissionRate;

                gasCloudParticleSystem.Play();
            }

            if (ventingAudioSource != null && gasHissLoopClip != null)
            {
                ventingAudioSource.clip = gasHissLoopClip;
                ventingAudioSource.loop = true;
                ventingAudioSource.volume = 0.85f;
                ventingAudioSource.Play();
            }
        }

        private void Update()
        {
            if (isLeaking && !isContained)
            {
                UpdatePuddleExpansion();
                UpdateCorrosiveMaterial();
            }
        }

        private void UpdatePuddleExpansion()
        {
            if (chemicalPuddleDecal != null && currentPuddleScale < maxPuddleScale)
            {
                currentPuddleScale += puddleExpansionRate * Time.deltaTime;
                chemicalPuddleDecal.localScale = new Vector3(currentPuddleScale, 0.05f, currentPuddleScale);
            }
        }

        private void UpdateCorrosiveMaterial()
        {
            if (drumMaterialInstance != null)
            {
                float currentCorrosion = drumMaterialInstance.GetFloat(corrosionShaderProperty);
                if (currentCorrosion < 0.85f)
                {
                    drumMaterialInstance.SetFloat(corrosionShaderProperty, Mathf.Min(0.85f, currentCorrosion + 0.02f * Time.deltaTime));
                }
            }
        }

        public void InspectDrum()
        {
            if (CbrsEventLogger.Instance != null)
            {
                string json = "{\"drumId\":\"" + drumId +
                              "\",\"correct\":" + (isLeaking ? "true" : "false") + "}";
                CbrsEventLogger.Instance.LogEvent("leak_source_identified", json);
            }
        }

        public void ApplyContainment()
        {
            if (isContained) return;

            if (!isLeaking)
            {
                Debug.Log($"[CBRS-X V2.0] Drum {drumId} is intact — no containment necessary.");
                return;
            }

            ContainmentKit kit = FindObjectOfType<ContainmentKit>();
            if (kit != null && kit.isEquipped)
            {
                kit.BeginSealSequence(this);
            }
            else
            {
                FinalizeContainment();
            }
        }

        /// <summary>
        /// Smoothly throttles down the particle emissions and cuts off pressurized acoustic hiss.
        /// </summary>
        public void SetPlumeThrottle(float normalizedRemaining)
        {
            if (gasCloudParticleSystem != null)
            {
                var emission = gasCloudParticleSystem.emission;
                emission.rateOverTime = maxEmissionRate * normalizedRemaining;
            }

            if (ventingAudioSource != null)
            {
                ventingAudioSource.volume = 0.85f * normalizedRemaining;
                ventingAudioSource.pitch = Mathf.Lerp(0.5f, 1.0f, normalizedRemaining);
            }
        }

        public void FinalizeContainment()
        {
            isContained = true;

            if (gasCloudParticleSystem != null)
            {
                gasCloudParticleSystem.Stop();
            }

            if (ventingAudioSource != null)
            {
                ventingAudioSource.Stop();
                if (sealPneumaticSnapClip != null)
                {
                    ventingAudioSource.PlayOneShot(sealPneumaticSnapClip, 1.0f);
                }
            }

            Debug.Log($"[CBRS-X V2.0] Chemical Drum {drumId} hermetically sealed.");

            if (CbrsEventLogger.Instance != null)
            {
                CbrsEventLogger.Instance.LogEvent("containment_completed", "{\"drumId\":\"" + drumId + "\"}");
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.RegisterContainmentComplete();
            }
        }
    }
}
