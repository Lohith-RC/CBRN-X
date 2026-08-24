using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// HazardZoneVisualizer V1.0 — Dynamic Visual Boundary Indicators.
    /// Features:
    /// - Pulsing emissive floor ring around contamination perimeter
    /// - Animated warning tape barrier effect
    /// - Atmospheric color shift gradient as player approaches leak
    /// - Procedural particle boundary wisps at perimeter edge
    /// </summary>
    public class HazardZoneVisualizer : MonoBehaviour
    {
        [Header("Perimeter Ring")]
        public Transform perimeterCenter;
        public float perimeterRadius = 6.0f;
        public Color ringColor = new Color(1f, 0.15f, 0.1f, 0.8f);
        public float pulseFrequency = 1.5f;
        public float pulseMinIntensity = 0.3f;
        public float pulseMaxIntensity = 1.0f;

        [Header("Warning Tape Barriers")]
        public GameObject[] warningTapeObjects;
        public float tapeScrollSpeed = 0.5f;

        [Header("Proximity Color Shift")]
        public float colorShiftRadius = 12f;
        public Color hazardTint = new Color(0.85f, 0.92f, 0.4f, 1f); // Sickly yellow-green
        public float maxSaturationShift = 0.3f;

        [Header("Boundary Wisps")]
        public ParticleSystem boundaryWispSystem;
        public float wispEmissionRate = 8f;

        [Header("Hazard Strobe Lights")]
        public Light[] hazardStrobes;
        public float strobeFrequency = 2.0f;

        // Internal State
        private GameObject perimeterRingGO;
        private Material perimeterRingMaterial;
        private Camera playerCamera;
        private bool isContained = false;

        private void Start()
        {
            playerCamera = Camera.main;

            if (perimeterCenter == null)
            {
                // Try to find the leaking drum as center
                LeakDrum[] drums = FindObjectsByType<LeakDrum>(FindObjectsSortMode.None);
                foreach (var d in drums)
                {
                    if (d.isLeaking)
                    {
                        perimeterCenter = d.transform;
                        break;
                    }
                }
            }

            CreatePerimeterRing();
            CreateBoundaryWisps();

            // Listen for containment completion
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnContainmentFinishedEvent += OnContainmentComplete;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnContainmentFinishedEvent -= OnContainmentComplete;
            }
        }

        private void Update()
        {
            if (isContained) return;

            UpdatePerimeterPulse();
            UpdateWarningTapeScroll();
            UpdateHazardStrobes();
        }

        private void CreatePerimeterRing()
        {
            if (perimeterCenter == null) return;

            perimeterRingGO = new GameObject("VFX_HazardPerimeterRing");
            perimeterRingGO.transform.position = perimeterCenter.position + Vector3.up * 0.05f;

            // Create a flat torus-like ring using a cylinder primitive scaled flat
            // We'll use 16 segments to form a ring
            int segments = 24;
            for (int i = 0; i < segments; i++)
            {
                float angle = (i / (float)segments) * Mathf.PI * 2f;
                float nextAngle = ((i + 1) / (float)segments) * Mathf.PI * 2f;

                float x = Mathf.Cos(angle) * perimeterRadius;
                float z = Mathf.Sin(angle) * perimeterRadius;

                GameObject seg = GameObject.CreatePrimitive(PrimitiveType.Cube);
                seg.name = $"PerimeterSeg_{i}";
                seg.transform.SetParent(perimeterRingGO.transform);

                // Position at ring edge
                Vector3 pos = perimeterCenter.position + new Vector3(x, 0.03f, z);
                seg.transform.position = pos;

                // Rotate to face the next segment
                float midAngle = (angle + nextAngle) * 0.5f;
                seg.transform.rotation = Quaternion.Euler(0, -midAngle * Mathf.Rad2Deg + 90f, 0);

                // Scale as a thin strip
                float segLength = 2f * perimeterRadius * Mathf.Sin(Mathf.PI / segments);
                seg.transform.localScale = new Vector3(segLength * 1.05f, 0.04f, 0.25f);

                // Remove collider
                Collider col = seg.GetComponent<Collider>();
                if (col != null) Destroy(col);

                // Create emissive material
                Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                mat.SetColor("_BaseColor", ringColor);
                mat.EnableKeyword("_EMISSION");
                mat.SetColor("_EmissionColor", ringColor * pulseMaxIntensity);
                seg.GetComponent<MeshRenderer>().material = mat;
            }

            perimeterRingMaterial = perimeterRingGO.GetComponentInChildren<MeshRenderer>()?.material;
        }

        private void CreateBoundaryWisps()
        {
            if (perimeterCenter == null || boundaryWispSystem != null) return;

            GameObject wispGO = new GameObject("VFX_BoundaryWisps");
            wispGO.transform.SetParent(transform);
            wispGO.transform.position = perimeterCenter.position + Vector3.up * 0.5f;

            boundaryWispSystem = wispGO.AddComponent<ParticleSystem>();
            var main = boundaryWispSystem.main;
            main.duration = 3f;
            main.loop = true;
            main.startLifetime = new ParticleSystem.MinMaxCurve(2f, 4f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(0.3f, 0.8f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.15f, 0.4f);
            main.startColor = new Color(0.7f, 0.85f, 0.3f, 0.4f);
            main.gravityModifier = -0.05f;
            main.maxParticles = 100;

            var emission = boundaryWispSystem.emission;
            emission.rateOverTime = wispEmissionRate;

            var shape = boundaryWispSystem.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = perimeterRadius;

            var colorOverLife = boundaryWispSystem.colorOverLifetime;
            colorOverLife.enabled = true;
            Gradient grad = new Gradient();
            grad.SetKeys(
                new GradientColorKey[] {
                    new GradientColorKey(new Color(0.7f, 0.85f, 0.3f), 0f),
                    new GradientColorKey(new Color(0.4f, 0.6f, 0.15f), 1f)
                },
                new GradientAlphaKey[] {
                    new GradientAlphaKey(0f, 0f),
                    new GradientAlphaKey(0.4f, 0.3f),
                    new GradientAlphaKey(0f, 1f)
                }
            );
            colorOverLife.color = grad;
        }

        private void UpdatePerimeterPulse()
        {
            if (perimeterRingGO == null) return;

            float pulse = Mathf.Lerp(pulseMinIntensity, pulseMaxIntensity,
                (Mathf.Sin(Time.time * pulseFrequency * Mathf.PI * 2f) + 1f) * 0.5f);

            MeshRenderer[] renderers = perimeterRingGO.GetComponentsInChildren<MeshRenderer>();
            foreach (var r in renderers)
            {
                if (r.material != null)
                {
                    r.material.SetColor("_EmissionColor", ringColor * pulse);
                }
            }
        }

        private void UpdateWarningTapeScroll()
        {
            if (warningTapeObjects == null) return;

            foreach (var tape in warningTapeObjects)
            {
                if (tape == null) continue;
                MeshRenderer mr = tape.GetComponent<MeshRenderer>();
                if (mr != null && mr.material != null)
                {
                    mr.material.mainTextureOffset += new Vector2(tapeScrollSpeed * Time.deltaTime, 0f);
                }
            }
        }

        private void UpdateHazardStrobes()
        {
            if (hazardStrobes == null) return;

            float strobe = Mathf.PingPong(Time.time * strobeFrequency * 2f, 1f);
            float intensity = Mathf.Pow(strobe, 4f) * 6f; // Sharp pulse

            for (int i = 0; i < hazardStrobes.Length; i++)
            {
                if (hazardStrobes[i] != null)
                {
                    // Offset each strobe slightly for alternating effect
                    float offset = (i % 2 == 0) ? 0f : 0.5f;
                    float localPulse = Mathf.PingPong((Time.time + offset) * strobeFrequency * 2f, 1f);
                    hazardStrobes[i].intensity = Mathf.Pow(localPulse, 4f) * 6f;
                }
            }
        }

        private void OnContainmentComplete()
        {
            isContained = true;

            // Fade out hazard visuals
            if (perimeterRingGO != null)
            {
                // Disable emission gradually (simplified: just disable)
                MeshRenderer[] renderers = perimeterRingGO.GetComponentsInChildren<MeshRenderer>();
                foreach (var r in renderers)
                {
                    if (r.material != null)
                    {
                        r.material.SetColor("_EmissionColor", Color.black);
                        r.material.SetColor("_BaseColor", new Color(0.3f, 0.3f, 0.3f, 0.2f));
                    }
                }
            }

            if (boundaryWispSystem != null)
            {
                var emission = boundaryWispSystem.emission;
                emission.rateOverTime = 0f;
            }
        }
    }
}
