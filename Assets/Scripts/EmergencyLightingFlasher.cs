using UnityEngine;

namespace CBRSX.Unity
{
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

        private void Update()
        {
            float time = Time.time;

            if (redStrobes != null && redStrobes.Length > 0)
            {
                float strobeWave = Mathf.PingPong(time * strobeFrequency * 2f, 1.0f);
                float sharpPulse = Mathf.Pow(strobeWave, 3.0f);
                float intensity = Mathf.Lerp(minStrobeIntensity, maxStrobeIntensity, sharpPulse);

                for (int i = 0; i < redStrobes.Length; i++)
                {
                    if (redStrobes[i] != null)
                    {
                        redStrobes[i].intensity = intensity;
                    }
                }
            }

            if (amberBeaconTransform != null)
            {
                amberBeaconTransform.Rotate(Vector3.up, beaconRotationSpeed * Time.deltaTime, Space.World);
            }
            if (amberBeaconLight != null)
            {
                float pulse = 0.7f + 0.3f * Mathf.Sin(time * beaconPulseSpeed * Mathf.PI * 2f);
                amberBeaconLight.intensity = 3.5f * pulse;
            }

            if (electricalSparkLight != null)
            {
                if (time > nextSparkTime)
                {
                    electricalSparkLight.intensity = Random.Range(3.0f, 6.5f);
                    nextSparkTime = time + Random.Range(0.08f, 0.25f);

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
        }
    }
}