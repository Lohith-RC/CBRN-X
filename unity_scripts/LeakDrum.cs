using UnityEngine;

namespace CBRSX.Unity
{
    public class LeakDrum : MonoBehaviour
    {
        public string drumId = "DRUM-03";
        public bool isLeaking = true;
        public ParticleSystem gasCloudParticles;
        public bool isContained = false;

        public void InspectDrum()
        {
            if (CbrsEventLogger.Instance != null)
            {
                string json = "{\"drumId\":\"" + drumId + "\",\"correct\":" + (isLeaking ? "true" : "false") + "}";
                CbrsEventLogger.Instance.LogEvent("leak_source_identified", json);
            }
        }

        public void ApplyContainment()
        {
            if (!isContained && isLeaking)
            {
                isContained = true;
                if (gasCloudParticles != null)
                {
                    gasCloudParticles.Stop();
                }
                Debug.Log($"[CBRS-X] Chemical Drum {drumId} successfully sealed!");
                if (CbrsEventLogger.Instance != null)
                {
                    CbrsEventLogger.Instance.LogEvent("containment_completed", "{\"drumId\":\"" + drumId + "\"}");
                }
            }
        }
    }
}
