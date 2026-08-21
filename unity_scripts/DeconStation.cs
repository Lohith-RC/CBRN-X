using UnityEngine;

namespace CBRSX.Unity
{
    public class DeconStation : MonoBehaviour
    {
        public ParticleSystem deconShowerParticles;
        private bool deconCompleted = false;

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player") && !deconCompleted)
            {
                deconCompleted = true;
                if (deconShowerParticles != null)
                {
                    deconShowerParticles.Play();
                }
                Debug.Log("[CBRS-X] Decontamination station shower completed!");
                if (CbrsEventLogger.Instance != null)
                {
                    CbrsEventLogger.Instance.LogEvent("decontamination_completed", "{\"archway\":true}");
                }
            }
        }
    }
}
