using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// LightFlicker — High-Frequency Dual-Noise Procedural Light Flicker for Fire & Arc Hazards.
    /// </summary>
    [RequireComponent(typeof(Light))]
    public class LightFlicker : MonoBehaviour
    {
        public float minIntensity = 1.8f;
        public float maxIntensity = 3.8f;
        public float flickerSpeed = 18.0f;
        public float secondaryNoiseSpeed = 35.0f;

        private Light targetLight;
        private float randomOffsetA;
        private float randomOffsetB;

        private void Start()
        {
            targetLight = GetComponent<Light>();
            randomOffsetA = Random.Range(0f, 1000f);
            randomOffsetB = Random.Range(0f, 1000f);
        }

        private void Update()
        {
            if (targetLight == null) return;
            float n1 = Mathf.PerlinNoise(Time.time * flickerSpeed, randomOffsetA);
            float n2 = Mathf.PerlinNoise(Time.time * secondaryNoiseSpeed, randomOffsetB);
            float combined = (n1 * 0.7f + n2 * 0.3f);
            targetLight.intensity = Mathf.Lerp(minIntensity, maxIntensity, combined);
        }
    }
}
