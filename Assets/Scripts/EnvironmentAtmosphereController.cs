using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// EnvironmentAtmosphereController V1.0 — Dynamic Environmental Atmosphere Manager.
    /// Features:
    /// - Procedural floating dust motes particle system in light shafts
    /// - Ground-level volumetric haze that thickens near chemical spill
    /// - Ambient industrial sound bed (hum, ventilation, metal creaks)
    /// - Dynamic ambient light color shift for time-of-day mood
    /// - Random ceiling drip particle bursts near pipe/condensation points
    /// </summary>
    public class EnvironmentAtmosphereController : MonoBehaviour
    {
        public static EnvironmentAtmosphereController Instance { get; private set; }

        [Header("Dust Mote Particles")]
        public ParticleSystem dustMoteSystem;
        public float dustEmissionRate = 25f;
        public Color dustColor = new Color(0.9f, 0.88f, 0.82f, 0.15f);
        public float dustAreaSize = 20f;

        [Header("Ground Fog")]
        public ParticleSystem groundFogSystem;
        public float fogEmissionRate = 12f;
        public float fogNearSpillMultiplier = 3.0f;
        public Color fogColor = new Color(0.75f, 0.8f, 0.65f, 0.25f);

        [Header("Ambient Industrial Sound")]
        public AudioSource ambientHumSource;
        public AudioSource metalCreakSource;
        public AudioClip ambientHumClip;
        public AudioClip[] metalCreakClips;
        public float minCreakInterval = 15f;
        public float maxCreakInterval = 45f;

        [Header("Ambient Light Mood")]
        public Light mainDirectionalLight;
        public Color ambientWarmTint = new Color(1f, 0.95f, 0.85f);
        public Color ambientCoolTint = new Color(0.85f, 0.9f, 1.0f);
        public float moodCycleDuration = 120f;

        [Header("Ceiling Drip Effects")]
        public Transform[] dripPoints;
        public ParticleSystem dripPrefabSystem;

        // Internal State
        private float creakTimer = 0f;
        private float moodTimer = 0f;
        private ParticleSystem[] dripSystems;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else { Destroy(gameObject); return; }
        }

        private void Start()
        {
            creakTimer = Random.Range(minCreakInterval * 0.5f, maxCreakInterval);

            // Auto-generate dust motes if not assigned
            if (dustMoteSystem == null)
            {
                dustMoteSystem = CreateDustMoteSystem();
            }

            // Auto-generate ground fog if not assigned
            if (groundFogSystem == null)
            {
                groundFogSystem = CreateGroundFogSystem();
            }

            // Setup drip systems at specified points
            if (dripPoints != null && dripPrefabSystem != null)
            {
                dripSystems = new ParticleSystem[dripPoints.Length];
                for (int i = 0; i < dripPoints.Length; i++)
                {
                    if (dripPoints[i] != null)
                    {
                        GameObject dripGO = Instantiate(dripPrefabSystem.gameObject, dripPoints[i].position, Quaternion.identity, transform);
                        dripSystems[i] = dripGO.GetComponent<ParticleSystem>();
                    }
                }
            }

            // Start ambient hum
            if (ambientHumSource != null && ambientHumClip != null)
            {
                ambientHumSource.clip = ambientHumClip;
                ambientHumSource.loop = true;
                ambientHumSource.volume = 0.15f;
                ambientHumSource.Play();
            }
        }

        private void Update()
        {
            UpdateAmbientCreaks();
            UpdateMoodLighting();
            UpdateFogDensityNearSpill();
        }

        private void UpdateAmbientCreaks()
        {
            if (metalCreakSource == null || metalCreakClips == null || metalCreakClips.Length == 0) return;

            creakTimer -= Time.deltaTime;
            if (creakTimer <= 0f)
            {
                creakTimer = Random.Range(minCreakInterval, maxCreakInterval);
                AudioClip clip = metalCreakClips[Random.Range(0, metalCreakClips.Length)];
                metalCreakSource.pitch = Random.Range(0.85f, 1.15f);
                metalCreakSource.PlayOneShot(clip, Random.Range(0.2f, 0.5f));
            }
        }

        private void UpdateMoodLighting()
        {
            if (mainDirectionalLight == null) return;

            moodTimer += Time.deltaTime;
            float t = Mathf.PingPong(moodTimer / moodCycleDuration, 1.0f);
            mainDirectionalLight.color = Color.Lerp(ambientWarmTint, ambientCoolTint, t);
        }

        private void UpdateFogDensityNearSpill()
        {
            if (groundFogSystem == null) return;

            // Increase fog emission near the leaking drum
            LeakDrum leakingDrum = null;
            LeakDrum[] drums = FindObjectsByType<LeakDrum>();
            foreach (var d in drums)
            {
                if (d.isLeaking && !d.isContained)
                {
                    leakingDrum = d;
                    break;
                }
            }

            var emission = groundFogSystem.emission;
            if (leakingDrum != null)
            {
                Camera cam = Camera.main;
                if (cam != null)
                {
                    float dist = Vector3.Distance(cam.transform.position, leakingDrum.transform.position);
                    float proximity = Mathf.Clamp01(1.0f - dist / 15f);
                    emission.rateOverTime = fogEmissionRate * Mathf.Lerp(1.0f, fogNearSpillMultiplier, proximity);
                }
            }
            else
            {
                emission.rateOverTime = fogEmissionRate * 0.3f; // Minimal fog after containment
            }
        }

        private ParticleSystem CreateDustMoteSystem()
        {
            GameObject dustGO = new GameObject("VFX_AmbientDustMotes");
            dustGO.transform.SetParent(transform);
            dustGO.transform.position = new Vector3(0f, 3.5f, 0f);

            ParticleSystem ps = dustGO.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.duration = 5f;
            main.loop = true;
            main.startLifetime = new ParticleSystem.MinMaxCurve(8f, 15f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(0.02f, 0.08f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.01f, 0.04f);
            main.startColor = dustColor;
            main.gravityModifier = -0.005f; // Float upward slightly
            main.maxParticles = 500;
            main.simulationSpace = ParticleSystemSimulationSpace.World;

            var emission = ps.emission;
            emission.rateOverTime = dustEmissionRate;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(dustAreaSize, 6f, dustAreaSize);

            var sizeOverLife = ps.sizeOverLifetime;
            sizeOverLife.enabled = true;
            AnimationCurve sizeCurve = new AnimationCurve();
            sizeCurve.AddKey(0f, 0.5f);
            sizeCurve.AddKey(0.5f, 1.0f);
            sizeCurve.AddKey(1f, 0.3f);
            sizeOverLife.size = new ParticleSystem.MinMaxCurve(1f, sizeCurve);

            var noise = ps.noise;
            noise.enabled = true;
            noise.strength = 0.3f;
            noise.frequency = 0.5f;
            noise.scrollSpeed = 0.2f;

            var renderer = dustGO.GetComponent<ParticleSystemRenderer>();
            Shader urpParticleShader = Shader.Find("Universal Render Pipeline/Particles/Unlit");
            if (urpParticleShader != null)
            {
                Material mat = new Material(urpParticleShader);
                mat.SetFloat("_Surface", 1);
                mat.SetFloat("_Blend", 1); // Additive for dust motes
                mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.One);
                mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.One);
                mat.SetInt("_ZWrite", 0);
                mat.renderQueue = 3000;
                renderer.sharedMaterial = mat;
            }

            return ps;
        }

        private ParticleSystem CreateGroundFogSystem()
        {
            GameObject fogGO = new GameObject("VFX_GroundLevelHaze");
            fogGO.transform.SetParent(transform);
            fogGO.transform.position = new Vector3(0f, 0.15f, 2f);

            ParticleSystem ps = fogGO.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.duration = 4f;
            main.loop = true;
            main.startLifetime = new ParticleSystem.MinMaxCurve(6f, 12f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(0.05f, 0.15f);
            main.startSize = new ParticleSystem.MinMaxCurve(2.5f, 5.0f);
            main.startColor = fogColor;
            main.gravityModifier = -0.01f;
            main.maxParticles = 150;
            main.simulationSpace = ParticleSystemSimulationSpace.World;

            var emission = ps.emission;
            emission.rateOverTime = fogEmissionRate;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(16f, 0.3f, 30f);

            var sizeOverLife = ps.sizeOverLifetime;
            sizeOverLife.enabled = true;
            AnimationCurve sizeCurve = new AnimationCurve();
            sizeCurve.AddKey(0f, 0.4f);
            sizeCurve.AddKey(0.3f, 1.0f);
            sizeCurve.AddKey(1f, 1.5f);
            sizeOverLife.size = new ParticleSystem.MinMaxCurve(1f, sizeCurve);

            var colorOverLife = ps.colorOverLifetime;
            colorOverLife.enabled = true;
            Gradient grad = new Gradient();
            grad.SetKeys(
                new GradientColorKey[] { new GradientColorKey(fogColor, 0f), new GradientColorKey(fogColor, 1f) },
                new GradientAlphaKey[] { new GradientAlphaKey(0f, 0f), new GradientAlphaKey(0.25f, 0.3f), new GradientAlphaKey(0f, 1f) }
            );
            colorOverLife.color = grad;

            var renderer = fogGO.GetComponent<ParticleSystemRenderer>();
            Shader urpParticleShader = Shader.Find("Universal Render Pipeline/Particles/Unlit");
            if (urpParticleShader != null)
            {
                Material mat = new Material(urpParticleShader);
                mat.SetFloat("_Surface", 1);
                mat.SetFloat("_Blend", 0); // Alpha blend for fog
                mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
                mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                mat.SetInt("_ZWrite", 0);
                mat.renderQueue = 3000;
                renderer.sharedMaterial = mat;
            }

            return ps;
        }
    }
}
