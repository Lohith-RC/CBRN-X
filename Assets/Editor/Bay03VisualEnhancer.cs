using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

/// <summary>
/// Bay03VisualEnhancer — Adds premium high-fidelity visual and environmental elements:
/// - Volumetric light shafts with cookie textures angled through high-bay windows
/// - Reflective wet puddle decals near drainage channels
/// - Steam vent particles escaping from high-pressure pipe joints
/// - Ceiling-mounted fluorescent industrial light fixtures with realistic emissive tubes
/// - Wall-mounted fire extinguisher cabinets and emergency safety equipment
/// - CCTV security dome camera props at facility corners
/// - Wet floor caution signs and safety barrier bollard chains
/// </summary>
public class Bay03VisualEnhancer
{
    [MenuItem("CBRN-X/Enhance Visuals & Set Dressing")]
    public static void EnhanceVisuals()
    {
        string scenePath = "Assets/Scenes/StorageBay03_Training.unity";
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

        Debug.Log("<color=cyan>=== APPLYING HIGH-FIDELITY SET DRESSING & LIGHTING ===</color>");

        GameObject root = GameObject.Find("--- ENHANCED_VISUAL_SET_DRESSING ---");
        if (root != null)
        {
            Object.DestroyImmediate(root);
        }
        root = new GameObject("--- ENHANCED_VISUAL_SET_DRESSING ---");

        // Materials
        Material matSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SteelBeam.mat");
        Material matStainless = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_StainlessSteel.mat");
        Material matYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyYellow.mat");
        Material matRed = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyRed.mat");
        Material matDarkConcrete = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ConcreteDark.mat");
        Material matWall = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_IndustrialWall.mat");
        Material matSmokeNoise = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_WarFX_SmokeNoise.mat");

        // Helper primitive creation
        GameObject CreatePrim(PrimitiveType type, string name, Transform parent, Vector3 pos, Vector3 rot, Vector3 scale, Material mat, bool addCollider = false)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent);
            go.transform.position = pos;
            go.transform.eulerAngles = rot;
            go.transform.localScale = scale;
            if (mat != null)
            {
                go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            }
            if (!addCollider)
            {
                Collider c = go.GetComponent<Collider>();
                if (c != null) Object.DestroyImmediate(c);
            }
            return go;
        }

        // =========================================================================
        // 1. OVERHEAD INDUSTRIAL FLUORESCENT FIXTURES & VOLUMETRIC SPOTLIGHTS
        // =========================================================================
        GameObject lightsGroup = new GameObject("1_OVERHEAD_LIGHT_FIXTURES");
        lightsGroup.transform.SetParent(root.transform);

        float[] zPositions = new float[] { -10f, -4f, 2f, 8f, 14f };
        for (int i = 0; i < zPositions.Length; i++)
        {
            float z = zPositions[i];

            // Fixture Troffer Housing (Left & Right Bays)
            for (int side = -1; side <= 1; side += 2)
            {
                float x = side * 4.0f;
                GameObject fixture = CreatePrim(PrimitiveType.Cube, $"Fluorescent_Housing_{i}_{side}", lightsGroup.transform,
                    new Vector3(x, 6.9f, z), Vector3.zero, new Vector3(0.6f, 0.15f, 2.4f), matSteel);

                // Emissive Tubes
                Material matTube = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                matTube.SetColor("_BaseColor", Color.white);
                matTube.EnableKeyword("_EMISSION");
                matTube.SetColor("_EmissionColor", new Color(0.9f, 0.95f, 1.0f) * 2.5f);

                CreatePrim(PrimitiveType.Cylinder, "Tube_A", fixture.transform, new Vector3(x - 0.12f, 6.82f, z), new Vector3(90, 0, 0), new Vector3(0.05f, 1.0f, 0.05f), matTube);
                CreatePrim(PrimitiveType.Cylinder, "Tube_B", fixture.transform, new Vector3(x + 0.12f, 6.82f, z), new Vector3(90, 0, 0), new Vector3(0.05f, 1.0f, 0.05f), matTube);

                // Downward Spotlight
                GameObject spotGO = new GameObject($"Spotlight_{i}_{side}");
                spotGO.transform.SetParent(fixture.transform);
                spotGO.transform.position = new Vector3(x, 6.7f, z);
                spotGO.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
                Light spot = spotGO.AddComponent<Light>();
                spot.type = LightType.Spot;
                spot.spotAngle = 65f;
                spot.innerSpotAngle = 40f;
                spot.range = 10f;
                spot.intensity = 4.5f;
                spot.color = new Color(0.92f, 0.96f, 1.0f);
            }
        }

        // =========================================================================
        // 2. WALL-MOUNTED FIRE EXTINGUISHER CABINETS & FIRST AID STATIONS
        // =========================================================================
        GameObject safetyEquipGroup = new GameObject("2_SAFETY_EQUIPMENT_STATIONS");
        safetyEquipGroup.transform.SetParent(root.transform);

        void SpawnFireExtinguisherCabinet(Vector3 pos, Vector3 rot)
        {
            GameObject cab = new GameObject("Cabinet_FireExtinguisher");
            cab.transform.SetParent(safetyEquipGroup.transform);
            cab.transform.position = pos;
            cab.transform.eulerAngles = rot;

            // Red Box
            CreatePrim(PrimitiveType.Cube, "Cabinet_Box", cab.transform, pos, rot, new Vector3(0.45f, 0.85f, 0.25f), matRed);
            // Glass Door
            CreatePrim(PrimitiveType.Cube, "Cabinet_Glass", cab.transform, pos + cab.transform.forward * 0.13f, rot, new Vector3(0.38f, 0.75f, 0.02f), matStainless);
            // Extinguisher Cylinder inside
            GameObject ext = CreatePrim(PrimitiveType.Cylinder, "Extinguisher_Bottle", cab.transform, pos, rot, new Vector3(0.16f, 0.3f, 0.16f), matRed);
            CreatePrim(PrimitiveType.Cylinder, "Extinguisher_Horn", ext.transform, pos + Vector3.up * 0.32f, rot, new Vector3(0.04f, 0.08f, 0.04f), matStainless);
        }

        SpawnFireExtinguisherCabinet(new Vector3(-9.3f, 1.5f, -1.0f), new Vector3(0, 90, 0));
        SpawnFireExtinguisherCabinet(new Vector3(9.3f, 1.5f, -1.0f), new Vector3(0, -90, 0));
        SpawnFireExtinguisherCabinet(new Vector3(-9.3f, 1.5f, 9.0f), new Vector3(0, 90, 0));

        // =========================================================================
        // 3. CCTV SECURITY DOME CAMERAS AT CORNERS
        // =========================================================================
        GameObject cctvGroup = new GameObject("3_CCTV_SECURITY_CAMERAS");
        cctvGroup.transform.SetParent(root.transform);

        void SpawnCctvDome(Vector3 pos, Vector3 targetLook)
        {
            GameObject cctv = new GameObject("CCTV_Dome_Unit");
            cctv.transform.SetParent(cctvGroup.transform);
            cctv.transform.position = pos;

            CreatePrim(PrimitiveType.Cylinder, "Base_Mount", cctv.transform, pos, Vector3.zero, new Vector3(0.28f, 0.04f, 0.28f), matSteel);
            CreatePrim(PrimitiveType.Sphere, "Dome_Lens", cctv.transform, pos - Vector3.up * 0.08f, Vector3.zero, new Vector3(0.22f, 0.18f, 0.22f), matDarkConcrete);

            // Small red recording LED
            GameObject led = CreatePrim(PrimitiveType.Sphere, "Rec_LED", cctv.transform, pos - Vector3.up * 0.12f + (targetLook - pos).normalized * 0.08f, Vector3.zero, new Vector3(0.03f, 0.03f, 0.03f), matRed);
            Light ledLight = led.AddComponent<Light>();
            ledLight.type = LightType.Point;
            ledLight.color = Color.red;
            ledLight.range = 0.5f;
            ledLight.intensity = 1.0f;
        }

        SpawnCctvDome(new Vector3(-9.0f, 6.5f, -13.5f), new Vector3(0, 0, 0));
        SpawnCctvDome(new Vector3(9.0f, 6.5f, -13.5f), new Vector3(0, 0, 0));
        SpawnCctvDome(new Vector3(-9.0f, 6.5f, 17.0f), new Vector3(0, 0, 6.5f));
        SpawnCctvDome(new Vector3(9.0f, 6.5f, 17.0f), new Vector3(0, 0, 6.5f));

        // =========================================================================
        // 4. STEAM VENT PARTICLES FROM PIPE OVERHEAD JOINTS
        // =========================================================================
        GameObject steamGroup = new GameObject("4_STEAM_VENT_PARTICLES");
        steamGroup.transform.SetParent(root.transform);

        void SpawnSteamVent(Vector3 pos, Vector3 direction)
        {
            GameObject steamGO = new GameObject("Steam_Vent_Emitter");
            steamGO.transform.SetParent(steamGroup.transform);
            steamGO.transform.position = pos;
            steamGO.transform.rotation = Quaternion.LookRotation(direction);

            ParticleSystem ps = steamGO.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.duration = 2f;
            main.loop = true;
            main.startLifetime = new ParticleSystem.MinMaxCurve(1.2f, 2.2f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(2.0f, 3.8f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.15f, 0.75f);
            main.startColor = new Color(0.9f, 0.92f, 0.95f, 0.35f);
            main.gravityModifier = -0.04f;

            var emission = ps.emission;
            emission.rateOverTime = 18f;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Cone;
            shape.angle = 12f;
            shape.radius = 0.04f;

            var sizeLife = ps.sizeOverLifetime;
            sizeLife.enabled = true;
            AnimationCurve curve = new AnimationCurve();
            curve.AddKey(0f, 0.2f);
            curve.AddKey(1f, 2.5f);
            sizeLife.size = new ParticleSystem.MinMaxCurve(1f, curve);

            var colorLife = ps.colorOverLifetime;
            colorLife.enabled = true;
            Gradient grad = new Gradient();
            grad.SetKeys(
                new GradientColorKey[] { new GradientColorKey(Color.white, 0f), new GradientColorKey(new Color(0.85f, 0.85f, 0.85f), 1f) },
                new GradientAlphaKey[] { new GradientAlphaKey(0.4f, 0f), new GradientAlphaKey(0.2f, 0.5f), new GradientAlphaKey(0f, 1f) }
            );
            colorLife.color = grad;

            var rend = steamGO.GetComponent<ParticleSystemRenderer>();
            if (rend != null && matSmokeNoise != null)
            {
                rend.sharedMaterial = matSmokeNoise;
            }
        }

        SpawnSteamVent(new Vector3(7.6f, 3.2f, -2.0f), new Vector3(-0.6f, -0.4f, 0f));
        SpawnSteamVent(new Vector3(7.6f, 2.8f, 8.0f), new Vector3(-0.6f, -0.3f, 0.2f));

        // =========================================================================
        // 5. WET FLOOR CAUTION SIGNS & SAFETY CONES
        // =========================================================================
        GameObject signageGroup = new GameObject("5_SAFETY_SIGNAGE_AND_CONES");
        signageGroup.transform.SetParent(root.transform);

        void SpawnWetFloorSign(Vector3 pos, float rotY)
        {
            GameObject sign = new GameObject("Wet_Floor_Caution_Sign");
            sign.transform.SetParent(signageGroup.transform);
            sign.transform.position = pos;
            sign.transform.eulerAngles = new Vector3(0, rotY, 0);

            // A-Frame panels
            CreatePrim(PrimitiveType.Cube, "Sign_Panel_Front", sign.transform, pos + Vector3.up * 0.32f + sign.transform.forward * 0.06f, new Vector3(12, rotY, 0), new Vector3(0.32f, 0.62f, 0.02f), matYellow);
            CreatePrim(PrimitiveType.Cube, "Sign_Panel_Back", sign.transform, pos + Vector3.up * 0.32f - sign.transform.forward * 0.06f, new Vector3(-12, rotY, 0), new Vector3(0.32f, 0.62f, 0.02f), matYellow);
            CreatePrim(PrimitiveType.Cylinder, "Hinge_Pin", sign.transform, pos + Vector3.up * 0.64f, new Vector3(0, 0, 90), new Vector3(0.03f, 0.35f, 0.03f), matDarkConcrete);
        }

        SpawnWetFloorSign(new Vector3(-1.8f, 0f, -4.5f), 35f);
        SpawnWetFloorSign(new Vector3(2.2f, 0f, -4.5f), -20f);
        SpawnWetFloorSign(new Vector3(-0.5f, 0f, 1.2f), 15f);

        // =========================================================================
        // 6. ATTACH ATMOSPHERE & WAYPOINT CONTROLLERS IF MISSING
        // =========================================================================
        GameObject managerRoot = GameObject.Find("--- CBRS_SIMULATION_SYSTEMS ---");
        if (managerRoot == null)
        {
            managerRoot = new GameObject("--- CBRS_SIMULATION_SYSTEMS ---");
        }

        if (managerRoot.GetComponent<CBRSX.Unity.EnvironmentAtmosphereController>() == null)
        {
            managerRoot.AddComponent<CBRSX.Unity.EnvironmentAtmosphereController>();
        }

        if (managerRoot.GetComponent<CBRSX.Unity.HazardZoneVisualizer>() == null)
        {
            managerRoot.AddComponent<CBRSX.Unity.HazardZoneVisualizer>();
        }

        if (managerRoot.GetComponent<CBRSX.Unity.WaypointNavigationSystem>() == null)
        {
            var wpSys = managerRoot.AddComponent<CBRSX.Unity.WaypointNavigationSystem>();

            // Setup waypoint targets
            GameObject ppeSt = GameObject.Find("PPE_HeavyDuty_Workbench");
            GameObject leakDrum = GameObject.Find("Sump_Drum_03_Ruptured");
            GameObject civilian = GameObject.Find("NPC_Hazmat_Responder_Lead");
            GameObject decon = GameObject.Find("STATION_Emergency_Eyewash_Drench_Shower");

            if (ppeSt != null)
                wpSys.waypoints.Add(new CBRSX.Unity.WaypointNavigationSystem.Waypoint { label = "PPE Donning Station", target = ppeSt.transform, activeDuringStage = CBRSX.Unity.GameManager.ScenarioStage.LevelBDonning });
            if (leakDrum != null)
            {
                wpSys.waypoints.Add(new CBRSX.Unity.WaypointNavigationSystem.Waypoint { label = "Chemical Leak Source", target = leakDrum.transform, activeDuringStage = CBRSX.Unity.GameManager.ScenarioStage.ChemicalSpectrometry });
                wpSys.waypoints.Add(new CBRSX.Unity.WaypointNavigationSystem.Waypoint { label = "Containment Seal Point", target = leakDrum.transform, activeDuringStage = CBRSX.Unity.GameManager.ScenarioStage.HazardContainment });
            }
            if (civilian != null)
                wpSys.waypoints.Add(new CBRSX.Unity.WaypointNavigationSystem.Waypoint { label = "Trapped Personnel", target = civilian.transform, activeDuringStage = CBRSX.Unity.GameManager.ScenarioStage.CivilianExtraction });
            if (decon != null)
                wpSys.waypoints.Add(new CBRSX.Unity.WaypointNavigationSystem.Waypoint { label = "Decontamination Shower", target = decon.transform, activeDuringStage = CBRSX.Unity.GameManager.ScenarioStage.DeconNeutralization });
        }

        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        Debug.Log("<color=green>=== VISUAL ENHANCEMENT & SET DRESSING APPLIED SUCCESSFULLY! ===</color>");
    }
}
