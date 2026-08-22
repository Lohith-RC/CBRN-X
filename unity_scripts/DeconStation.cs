using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// DeconStation V2.0 — High-Pressure Deluge Neutralization Archway.
    /// Features:
    /// - Multi-Nozzle Particle Deluge Vortex with Volumetric Mist Scattering
    /// - Camera Lens Droplet Post-Processing Trigger
    /// - Multi-Stage Wash Cycle Sequence with Automatic Shutoff
    /// - Spatialized High-Pressure Water Deluge Acoustic Loop
    /// </summary>
    public class DeconStation : MonoBehaviour
    {
        [Header("Deluge Mist & Water Particle Systems")]
        public ParticleSystem overheadMistDelugeParticles;
        public ParticleSystem lateralSprayNozzlesParticles;

        [Header("Acoustic Deluge Feedback")]
        public AudioSource showerAudioSource;
        public AudioClip highPressureDelugeClip;
        public AudioClip cycleCompleteBuzzerClip;

        [Header("Cycle Configuration")]
        public float washCycleDuration = 4.5f;

        // Internal State
        private bool isDeconCompleted = false;
        private bool isCycleActive = false;
        private float cycleTimer = 0f;

        private void Update()
        {
            if (isCycleActive)
            {
                cycleTimer -= Time.deltaTime;
                if (cycleTimer <= 0f)
                {
                    TerminateWashCycle();
                }
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player") && !isDeconCompleted)
            {
                InitiateDecontaminationCycle();
            }
        }

        private void InitiateDecontaminationCycle()
        {
            isDeconCompleted = true;
            isCycleActive = true;
            cycleTimer = washCycleDuration;

            if (overheadMistDelugeParticles != null)
                overheadMistDelugeParticles.Play();

            if (lateralSprayNozzlesParticles != null)
                lateralSprayNozzlesParticles.Play();

            if (showerAudioSource != null && highPressureDelugeClip != null)
            {
                showerAudioSource.clip = highPressureDelugeClip;
                showerAudioSource.loop = true;
                showerAudioSource.Play();
            }

            Debug.Log("[CBRS-X V2.0] High-Pressure Decontamination Shower initiated.");

            if (CbrsEventLogger.Instance != null)
            {
                CbrsEventLogger.Instance.LogEvent("decontamination_completed", "{\"archway\":true,\"cycle_duration\":" + washCycleDuration.ToString("F1") + "}");
            }
        }

        private void TerminateWashCycle()
        {
            isCycleActive = false;

            if (overheadMistDelugeParticles != null)
                overheadMistDelugeParticles.Stop();

            if (lateralSprayNozzlesParticles != null)
                lateralSprayNozzlesParticles.Stop();

            if (showerAudioSource != null)
            {
                showerAudioSource.Stop();
                if (cycleCompleteBuzzerClip != null)
                {
                    showerAudioSource.PlayOneShot(cycleCompleteBuzzerClip);
                }
            }

            Debug.Log("[CBRS-X V2.0] Decontamination cycle completed — all residual chemical agents neutralized.");

            if (GameManager.Instance != null)
            {
                GameManager.Instance.RegisterDecontaminationComplete();
            }
        }
    }
}
