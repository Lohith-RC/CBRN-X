using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using System.IO;

[InitializeOnLoad]
public class Bay03ChemicalPlantElevator
{
    private const string kSessionKey = "Bay03ChemicalPlantElevator_HasRun";

    static Bay03ChemicalPlantElevator()
    {
        EditorApplication.delayCall += () =>
        {
            if (SessionState.GetBool(kSessionKey, false)) return;
            SessionState.SetBool(kSessionKey, true);
            ElevateChemicalPlantScene();
        };
    }

    [MenuItem("CBRN-X/Elevate Chemical Plant Scene")]
    public static void ElevateChemicalPlantScene()
    {
        string scenePath = "Assets/Scenes/StorageBay03_Training.unity";
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

        Debug.Log("<color=cyan>=== EXECUTING CHEMICAL PLANT VISUAL ELEVATION ===</color>");

        // 1. Root container for chemical plant elevation
        GameObject root = GameObject.Find("--- CHEMICAL_PLANT_ENVIRONMENT ---");
        if (root != null)
        {
            Object.DestroyImmediate(root);
        }
        root = new GameObject("--- CHEMICAL_PLANT_ENVIRONMENT ---");

        // Common Materials
        Material matWallCladding = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_IndustrialWall.mat");
        Material matDarkConcrete = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ConcreteDark.mat");
        Material matFloor = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ConcreteFloor.mat");
        Material matSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SteelBeam.mat");
        Material matStainless = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_StainlessSteel.mat");
        Material matYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyYellow.mat");
        Material matRed = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyRed.mat");
        Material matGreen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyGreen.mat");
        Material matOrange = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_HazmatOrange.mat");
        Material matBlueDrum = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ChemicalDrum.mat");
        Material matGrating = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_CatwalkGrating.mat");
        Material matGlass = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_IbcTote.mat");

        // Helper: Create Primitive
        GameObject CreatePrim(PrimitiveType type, string name, Transform parent, Vector3 pos, Vector3 rot, Vector3 scale, Material mat)
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
            return go;
        }

        // =========================================================================
        // 1. ENVIRONMENT & ARCHITECTURE: GATE, WINDOWS, DOORS, PPE WORKBENCHES
        // =========================================================================
        GameObject archGroup = new GameObject("1_ARCHITECTURE_AND_STRUCTURAL");
        archGroup.transform.SetParent(root.transform);

        // --- A. Industrial Main Entry Security Gate ---
        GameObject gateGroup = new GameObject("GATE_Industrial_Sliding_Security");
        gateGroup.transform.SetParent(archGroup.transform);
        // Heavy Yellow Gate Posts
        CreatePrim(PrimitiveType.Cube, "Gate_Post_Left", gateGroup.transform, new Vector3(-5.2f, 2.5f, -14.2f), Vector3.zero, new Vector3(0.5f, 5.0f, 0.5f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Gate_Post_Right", gateGroup.transform, new Vector3(5.8f, 2.5f, -14.2f), Vector3.zero, new Vector3(0.5f, 5.0f, 0.5f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Gate_Overhead_Track", gateGroup.transform, new Vector3(0.3f, 4.9f, -14.2f), Vector3.zero, new Vector3(11.5f, 0.35f, 0.4f), matSteel);
        // Steel Mesh Gate Leaves (Partially open)
        CreatePrim(PrimitiveType.Cube, "Gate_Leaf_Left", gateGroup.transform, new Vector3(-3.2f, 2.3f, -14.15f), Vector3.zero, new Vector3(3.6f, 4.4f, 0.12f), matGrating);
        CreatePrim(PrimitiveType.Cube, "Gate_Leaf_Right", gateGroup.transform, new Vector3(3.8f, 2.3f, -14.15f), Vector3.zero, new Vector3(3.6f, 4.4f, 0.12f), matGrating);
        // Hazard chevrons on gate bottom
        CreatePrim(PrimitiveType.Cube, "Gate_Hazard_Bar_L", gateGroup.transform, new Vector3(-3.2f, 0.35f, -14.1f), Vector3.zero, new Vector3(3.6f, 0.6f, 0.14f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Gate_Hazard_Bar_R", gateGroup.transform, new Vector3(3.8f, 0.35f, -14.1f), Vector3.zero, new Vector3(3.6f, 0.6f, 0.14f), matYellow);

        // --- B. High-Bay Clerestory Windows with Safety Grating ---
        GameObject winGroup = new GameObject("WINDOWS_HighBay_Industrial_Panels");
        winGroup.transform.SetParent(archGroup.transform);
        for (int w = 0; w < 6; w++)
        {
            float z = -8f + w * 4.5f;
            // West Wall Window
            CreatePrim(PrimitiveType.Cube, $"Window_West_{w}", winGroup.transform, new Vector3(-9.45f, 5.5f, z), Vector3.zero, new Vector3(0.1f, 1.6f, 3.2f), matGlass);
            CreatePrim(PrimitiveType.Cube, $"WinFrame_W_T_{w}", winGroup.transform, new Vector3(-9.4f, 6.35f, z), Vector3.zero, new Vector3(0.2f, 0.12f, 3.4f), matSteel);
            CreatePrim(PrimitiveType.Cube, $"WinFrame_W_B_{w}", winGroup.transform, new Vector3(-9.4f, 4.65f, z), Vector3.zero, new Vector3(0.2f, 0.12f, 3.4f), matSteel);
            // East Wall Window
            CreatePrim(PrimitiveType.Cube, $"Window_East_{w}", winGroup.transform, new Vector3(9.45f, 5.5f, z), Vector3.zero, new Vector3(0.1f, 1.6f, 3.2f), matGlass);
            CreatePrim(PrimitiveType.Cube, $"WinFrame_E_T_{w}", winGroup.transform, new Vector3(9.4f, 6.35f, z), Vector3.zero, new Vector3(0.2f, 0.12f, 3.4f), matSteel);
            CreatePrim(PrimitiveType.Cube, $"WinFrame_E_B_{w}", winGroup.transform, new Vector3(9.4f, 4.65f, z), Vector3.zero, new Vector3(0.2f, 0.12f, 3.4f), matSteel);
        }

        // --- C. Emergency Personnel Fire Exit Doors ---
        GameObject doorGroup = new GameObject("DOORS_Emergency_Personnel_Exits");
        doorGroup.transform.SetParent(archGroup.transform);
        // West Emergency Exit
        CreatePrim(PrimitiveType.Cube, "Door_Frame_West", doorGroup.transform, new Vector3(-9.4f, 1.4f, -4.0f), Vector3.zero, new Vector3(0.25f, 2.7f, 1.4f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Door_Panel_West", doorGroup.transform, new Vector3(-9.42f, 1.35f, -4.0f), Vector3.zero, new Vector3(0.12f, 2.5f, 1.2f), matRed);
        CreatePrim(PrimitiveType.Cube, "Door_PanicBar_West", doorGroup.transform, new Vector3(-9.3f, 1.1f, -4.0f), Vector3.zero, new Vector3(0.1f, 0.08f, 0.9f), matStainless);
        CreatePrim(PrimitiveType.Cube, "Door_ExitSign_West", doorGroup.transform, new Vector3(-9.3f, 2.85f, -4.0f), Vector3.zero, new Vector3(0.1f, 0.35f, 0.8f), matGreen);

        // East Emergency Exit
        CreatePrim(PrimitiveType.Cube, "Door_Frame_East", doorGroup.transform, new Vector3(9.4f, 1.4f, -4.0f), Vector3.zero, new Vector3(0.25f, 2.7f, 1.4f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Door_Panel_East", doorGroup.transform, new Vector3(9.42f, 1.35f, -4.0f), Vector3.zero, new Vector3(0.12f, 2.5f, 1.2f), matRed);
        CreatePrim(PrimitiveType.Cube, "Door_PanicBar_East", doorGroup.transform, new Vector3(9.3f, 1.1f, -4.0f), Vector3.zero, new Vector3(0.1f, 0.08f, 0.9f), matStainless);
        CreatePrim(PrimitiveType.Cube, "Door_ExitSign_East", doorGroup.transform, new Vector3(9.3f, 2.85f, -4.0f), Vector3.zero, new Vector3(0.1f, 0.35f, 0.8f), matGreen);

        // --- D. Industrial-Grade PPE Storage Workbenches (Helmets, Vests, Gloves) ---
        GameObject ppeGroup = new GameObject("PPE_EQUIPMENT_STAGING_BENCHES");
        ppeGroup.transform.SetParent(archGroup.transform);

        void SpawnPPEWorkbench(Vector3 tablePos)
        {
            GameObject bench = new GameObject("PPE_HeavyDuty_Workbench");
            bench.transform.SetParent(ppeGroup.transform);

            // Table Frame & Stainless Top
            CreatePrim(PrimitiveType.Cube, "Table_Top_Stainless", bench.transform, new Vector3(tablePos.x, tablePos.y + 0.92f, tablePos.z), Vector3.zero, new Vector3(2.4f, 0.08f, 1.0f), matStainless);
            CreatePrim(PrimitiveType.Cube, "Table_Lower_Shelf", bench.transform, new Vector3(tablePos.x, tablePos.y + 0.25f, tablePos.z), Vector3.zero, new Vector3(2.3f, 0.05f, 0.9f), matSteel);
            // 4 Steel Legs
            CreatePrim(PrimitiveType.Cube, "Leg_0", bench.transform, new Vector3(tablePos.x - 1.1f, tablePos.y + 0.45f, tablePos.z - 0.4f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);
            CreatePrim(PrimitiveType.Cube, "Leg_1", bench.transform, new Vector3(tablePos.x + 1.1f, tablePos.y + 0.45f, tablePos.z - 0.4f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);
            CreatePrim(PrimitiveType.Cube, "Leg_2", bench.transform, new Vector3(tablePos.x - 1.1f, tablePos.y + 0.45f, tablePos.z + 0.4f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);
            CreatePrim(PrimitiveType.Cube, "Leg_3", bench.transform, new Vector3(tablePos.x + 1.1f, tablePos.y + 0.45f, tablePos.z + 0.4f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);

            // PPE Equipment on Table Top:
            // 1. Safety Helmets (Hard Hats - Yellow & White)
            CreatePrim(PrimitiveType.Sphere, "HardHat_Yellow_1", bench.transform, new Vector3(tablePos.x - 0.8f, tablePos.y + 1.05f, tablePos.z - 0.15f), Vector3.zero, new Vector3(0.32f, 0.24f, 0.36f), matYellow);
            CreatePrim(PrimitiveType.Sphere, "HardHat_White_2", bench.transform, new Vector3(tablePos.x - 0.4f, tablePos.y + 1.05f, tablePos.z - 0.15f), Vector3.zero, new Vector3(0.32f, 0.24f, 0.36f), matWallCladding);
            CreatePrim(PrimitiveType.Sphere, "HardHat_Red_3", bench.transform, new Vector3(tablePos.x + 0.0f, tablePos.y + 1.05f, tablePos.z - 0.15f), Vector3.zero, new Vector3(0.32f, 0.24f, 0.36f), matRed);

            // 2. Chemical Resistant Gloves (Nitrile / Butyl Pairs)
            CreatePrim(PrimitiveType.Cube, "ChemicalGloves_Pair_1", bench.transform, new Vector3(tablePos.x + 0.5f, tablePos.y + 0.98f, tablePos.z - 0.15f), new Vector3(0, 15, 0), new Vector3(0.35f, 0.06f, 0.28f), matOrange);
            CreatePrim(PrimitiveType.Cube, "ChemicalGloves_Pair_2", bench.transform, new Vector3(tablePos.x + 0.9f, tablePos.y + 0.98f, tablePos.z - 0.15f), new Vector3(0, -10, 0), new Vector3(0.35f, 0.06f, 0.28f), matBlueDrum);

            // 3. High-Vis Hazmat Vests (Folded on table & lower shelf)
            CreatePrim(PrimitiveType.Cube, "HazmatVest_Folded_1", bench.transform, new Vector3(tablePos.x - 0.6f, tablePos.y + 0.98f, tablePos.z + 0.25f), Vector3.zero, new Vector3(0.45f, 0.08f, 0.35f), matYellow);
            CreatePrim(PrimitiveType.Cube, "HazmatVest_Folded_2", bench.transform, new Vector3(tablePos.x + 0.4f, tablePos.y + 0.98f, tablePos.z + 0.25f), Vector3.zero, new Vector3(0.45f, 0.08f, 0.35f), matOrange);

            // 4. Respirator Half-Masks on Lower Shelf
            CreatePrim(PrimitiveType.Sphere, "Respirator_Mask_1", bench.transform, new Vector3(tablePos.x - 0.5f, tablePos.y + 0.38f, tablePos.z), Vector3.zero, new Vector3(0.25f, 0.2f, 0.25f), matSteel);
            CreatePrim(PrimitiveType.Sphere, "Respirator_Mask_2", bench.transform, new Vector3(tablePos.x + 0.5f, tablePos.y + 0.38f, tablePos.z), Vector3.zero, new Vector3(0.25f, 0.2f, 0.25f), matSteel);
        }

        // Place PPE Workbenches in Staging Safe Zones
        SpawnPPEWorkbench(new Vector3(-4.5f, 0f, -11.0f));
        SpawnPPEWorkbench(new Vector3(4.5f, 0f, -11.0f));

        // =========================================================================
        // 2. ATMOSPHERE & EFFECTS: EXPLOSIONS, FIRE, DENSE SMOKE, SPARKS
        // =========================================================================
        GameObject vfxGroup = new GameObject("2_HIGH_INTENSITY_ATMOSPHERE_VFX");
        vfxGroup.transform.SetParent(root.transform);

        // Load URP Particle Material
        Material matSmokeNoise = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_WarFX_SmokeNoise.mat");
        Material matSmokeAlpha = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_WarFX_SmokeAlpha.mat");

        // --- A. High-Intensity Chemical Jet Fire at Ruptured Joint ---
        GameObject fireGO = new GameObject("VFX_Chemical_Joint_Jet_Fire");
        fireGO.transform.SetParent(vfxGroup.transform);
        fireGO.transform.position = new Vector3(2.8f, 0.8f, 7.8f);
        fireGO.transform.rotation = Quaternion.Euler(-30f, 35f, 0f);

        ParticleSystem psFire = fireGO.AddComponent<ParticleSystem>();
        var fMain = psFire.main;
        fMain.duration = 3f;
        fMain.loop = true;
        fMain.startLifetime = new ParticleSystem.MinMaxCurve(0.8f, 1.6f);
        fMain.startSpeed = new ParticleSystem.MinMaxCurve(2.8f, 4.5f);
        fMain.startSize = new ParticleSystem.MinMaxCurve(0.5f, 1.4f);
        fMain.startColor = new ParticleSystem.MinMaxGradient(new Color(1f, 0.65f, 0.1f, 0.9f), new Color(1f, 0.25f, 0.05f, 0.95f));
        fMain.gravityModifier = -0.15f;

        var fEmission = psFire.emission;
        fEmission.rateOverTime = 35f;

        var fShape = psFire.shape;
        fShape.shapeType = ParticleSystemShapeType.Cone;
        fShape.angle = 14f;
        fShape.radius = 0.12f;

        var fColorLife = psFire.colorOverLifetime;
        fColorLife.enabled = true;
        Gradient fGrad = new Gradient();
        fGrad.SetKeys(
            new GradientColorKey[] { new GradientColorKey(new Color(1f, 0.9f, 0.4f), 0f), new GradientColorKey(new Color(1f, 0.3f, 0.05f), 0.6f), new GradientColorKey(new Color(0.2f, 0.2f, 0.2f), 1f) },
            new GradientAlphaKey[] { new GradientAlphaKey(0.9f, 0f), new GradientAlphaKey(0.8f, 0.5f), new GradientAlphaKey(0f, 1f) }
        );
        fColorLife.color = fGrad;

        var fRenderer = fireGO.GetComponent<ParticleSystemRenderer>();
        if (fRenderer != null && matSmokeAlpha != null)
        {
            fRenderer.sharedMaterial = matSmokeAlpha;
        }

        // Dynamic Flickering Fire Light
        GameObject fireLightGO = new GameObject("Light_Chemical_Fire_Flicker");
        fireLightGO.transform.SetParent(fireGO.transform);
        fireLightGO.transform.position = fireGO.transform.position + Vector3.up * 0.5f;
        Light fireLight = fireLightGO.AddComponent<Light>();
        fireLight.type = LightType.Point;
        fireLight.color = new Color(1f, 0.55f, 0.1f);
        fireLight.intensity = 12f;
        fireLight.range = 14f;

        // --- B. Explosion Blast Crater & Dense Smoldering Grey/Black Smoke Column ---
        GameObject blastGroup = new GameObject("VFX_Explosion_Blast_Smoldering_Column");
        blastGroup.transform.SetParent(vfxGroup.transform);
        blastGroup.transform.position = new Vector3(-2.8f, 0.05f, 6.5f);

        // Scorched crater decal mesh
        CreatePrim(PrimitiveType.Cylinder, "Blast_Scorch_Crater", blastGroup.transform, new Vector3(-2.8f, 0.03f, 6.5f), Vector3.zero, new Vector3(2.6f, 0.02f, 2.6f), matDarkConcrete);

        // Billowy Grey Smoke Column Rising from Blast
        ParticleSystem psBlastSmoke = blastGroup.AddComponent<ParticleSystem>();
        var bMain = psBlastSmoke.main;
        bMain.duration = 4f;
        bMain.loop = true;
        bMain.startLifetime = new ParticleSystem.MinMaxCurve(4.5f, 7.5f);
        bMain.startSpeed = new ParticleSystem.MinMaxCurve(0.6f, 1.4f);
        bMain.startSize = new ParticleSystem.MinMaxCurve(1.5f, 4.2f);
        bMain.startColor = new ParticleSystem.MinMaxGradient(new Color(0.45f, 0.46f, 0.48f, 0.65f), new Color(0.70f, 0.72f, 0.75f, 0.45f));
        bMain.gravityModifier = -0.06f;

        var bEmission = psBlastSmoke.emission;
        bEmission.rateOverTime = 22f;

        var bShape = psBlastSmoke.shape;
        bShape.shapeType = ParticleSystemShapeType.Circle;
        bShape.radius = 1.0f;

        var bSizeLife = psBlastSmoke.sizeOverLifetime;
        bSizeLife.enabled = true;
        AnimationCurve bCurve = new AnimationCurve();
        bCurve.AddKey(0f, 0.4f);
        bCurve.AddKey(0.4f, 1.4f);
        bCurve.AddKey(1f, 3.2f);
        bSizeLife.size = new ParticleSystem.MinMaxCurve(1f, bCurve);

        var bRenderer = blastGroup.GetComponent<ParticleSystemRenderer>();
        if (bRenderer != null && matSmokeNoise != null)
        {
            bRenderer.sharedMaterial = matSmokeNoise;
        }

        // =========================================================================
        // 3. CHARACTERS: 3 REALISTIC INDUSTRIAL HAZMAT RESPONDERS & OPERATORS
        // =========================================================================
        GameObject npcGroup = new GameObject("3_CHARACTERS_HAZMAT_RESPONDERS_AND_NPCS");
        npcGroup.transform.SetParent(root.transform);

        GameObject CreateHumanoidNPC(string npcName, Vector3 pos, float rotY, Material suitMat, Material helmetMat, string roleTitle)
        {
            GameObject npc = new GameObject(npcName);
            npc.transform.SetParent(npcGroup.transform);
            npc.transform.position = pos;
            npc.transform.eulerAngles = new Vector3(0, rotY, 0);

            // Body / Protective Suit
            GameObject torso = CreatePrim(PrimitiveType.Capsule, "NPC_Torso_Suit", npc.transform, pos + Vector3.up * 1.05f, Vector3.zero, new Vector3(0.5f, 0.65f, 0.35f), suitMat);
            // Legs
            CreatePrim(PrimitiveType.Cylinder, "Leg_L", npc.transform, pos + Vector3.up * 0.45f + Vector3.left * 0.12f, Vector3.zero, new Vector3(0.18f, 0.45f, 0.18f), suitMat);
            CreatePrim(PrimitiveType.Cylinder, "Leg_R", npc.transform, pos + Vector3.up * 0.45f + Vector3.right * 0.12f, Vector3.zero, new Vector3(0.18f, 0.45f, 0.18f), suitMat);
            // Safety Boots (Heavy black protective boots)
            CreatePrim(PrimitiveType.Cube, "Boot_L", npc.transform, pos + Vector3.up * 0.08f + Vector3.left * 0.12f + Vector3.forward * 0.05f, Vector3.zero, new Vector3(0.2f, 0.16f, 0.32f), matDarkConcrete);
            CreatePrim(PrimitiveType.Cube, "Boot_R", npc.transform, pos + Vector3.up * 0.08f + Vector3.right * 0.12f + Vector3.forward * 0.05f, Vector3.zero, new Vector3(0.2f, 0.16f, 0.32f), matDarkConcrete);

            // Arms in active operational pose
            CreatePrim(PrimitiveType.Cylinder, "Arm_L", npc.transform, pos + Vector3.up * 1.05f + Vector3.left * 0.32f, new Vector3(15, 0, -10), new Vector3(0.15f, 0.42f, 0.15f), suitMat);
            CreatePrim(PrimitiveType.Cylinder, "Arm_R", npc.transform, pos + Vector3.up * 1.05f + Vector3.right * 0.32f, new Vector3(25, 0, 10), new Vector3(0.15f, 0.42f, 0.15f), suitMat);

            // Head / Respirator Hood / Helmet
            CreatePrim(PrimitiveType.Sphere, "Head_Hood", npc.transform, pos + Vector3.up * 1.6f, Vector3.zero, new Vector3(0.32f, 0.34f, 0.32f), suitMat);
            CreatePrim(PrimitiveType.Sphere, "Safety_Helmet", npc.transform, pos + Vector3.up * 1.72f, Vector3.zero, new Vector3(0.36f, 0.22f, 0.40f), helmetMat);
            // Respirator Visor
            CreatePrim(PrimitiveType.Cube, "Respirator_Visor", npc.transform, pos + Vector3.up * 1.58f + Vector3.forward * 0.16f, Vector3.zero, new Vector3(0.22f, 0.12f, 0.06f), matGlass);

            // Back SCBA Oxygen Tank
            GameObject scba = CreatePrim(PrimitiveType.Cylinder, "SCBA_Oxygen_Tank", npc.transform, pos + Vector3.up * 1.1f - Vector3.forward * 0.22f, Vector3.zero, new Vector3(0.22f, 0.45f, 0.22f), matYellow);
            CreatePrim(PrimitiveType.Cube, "SCBA_Valve", scba.transform, pos + Vector3.up * 1.58f - Vector3.forward * 0.22f, Vector3.zero, new Vector3(0.08f, 0.08f, 0.08f), matStainless);

            // Role Badge Overhead
            GameObject badge = new GameObject("Role_Badge");
            badge.transform.SetParent(npc.transform);
            badge.transform.position = pos + Vector3.up * 2.1f;
            var tmpRole = badge.AddComponent<TMPro.TextMeshPro>();
            tmpRole.text = roleTitle;
            tmpRole.fontSize = 2.4f;
            tmpRole.alignment = TMPro.TextAlignmentOptions.Center;
            tmpRole.color = Color.yellow;

            return npc;
        }

        // NPC 1: Lead Hazmat Responder with Gas Detector near Containment Sump
        GameObject npc1 = CreateHumanoidNPC("NPC_Hazmat_Responder_Lead", new Vector3(1.2f, 0f, 4.8f), 25f, matOrange, matYellow, "LEAD RESPONDER\n[HAZMAT LEVEL-B]");
        // Held Gas Detector device
        CreatePrim(PrimitiveType.Cube, "Held_PID_Detector", npc1.transform, new Vector3(1.4f, 1.1f, 5.3f), new Vector3(20, 30, 0), new Vector3(0.12f, 0.25f, 0.08f), matYellow);

        // NPC 2: Chemical Plant Control Operator at Right Utility Station
        CreateHumanoidNPC("NPC_Plant_Operator_Panel", new Vector3(6.2f, 0f, -0.5f), -75f, matWallCladding, matWallCladding, "PLANT OPERATOR\n[TELEMETRY / ESD]");

        // NPC 3: Safety Officer coordinating at PPE Staging Table
        CreateHumanoidNPC("NPC_Safety_Officer_Staging", new Vector3(-4.5f, 0f, -9.5f), 175f, matWallCladding, matRed, "SAFETY COORDINATOR\n[PPE STAGING]");

        // =========================================================================
        // 4. DETAILING: CHEMICAL REACTORS, ESD STATIONS, PRESSURE GAUGES, OVERPACKS
        // =========================================================================
        GameObject detailGroup = new GameObject("4_CHEMICAL_PLANT_FUNCTIONAL_DETAILS");
        detailGroup.transform.SetParent(root.transform);

        // --- A. Vertical Chemical Reactor Tank / Pressure Vessel ---
        GameObject reactor = new GameObject("STRUCT_Chemical_Reactor_Vessel_10kL");
        reactor.transform.SetParent(detailGroup.transform);
        reactor.transform.position = new Vector3(-7.5f, 0f, 12.0f);
        // Main Tank Body
        CreatePrim(PrimitiveType.Cylinder, "Reactor_Body", reactor.transform, new Vector3(-7.5f, 3.2f, 12.0f), Vector3.zero, new Vector3(2.4f, 2.8f, 2.4f), matStainless);
        CreatePrim(PrimitiveType.Sphere, "Reactor_TopDome", reactor.transform, new Vector3(-7.5f, 5.9f, 12.0f), Vector3.zero, new Vector3(2.4f, 1.2f, 2.4f), matStainless);
        // Steel Support Legs
        for (int leg = 0; leg < 4; leg++)
        {
            float ang = leg * 90f * Mathf.Deg2Rad;
            Vector3 lPos = new Vector3(-7.5f + Mathf.Cos(ang) * 1.1f, 0.9f, 12.0f + Mathf.Sin(ang) * 1.1f);
            CreatePrim(PrimitiveType.Cube, $"Leg_{leg}", reactor.transform, lPos, Vector3.zero, new Vector3(0.18f, 1.8f, 0.18f), matSteel);
        }
        // Analog Pressure Gauge & Sight Glass on Reactor
        CreatePrim(PrimitiveType.Cylinder, "Analog_Pressure_Gauge", reactor.transform, new Vector3(-6.25f, 3.6f, 12.0f), new Vector3(0, 0, 90), new Vector3(0.35f, 0.08f, 0.35f), matWallCladding);
        CreatePrim(PrimitiveType.Cylinder, "Sight_Level_Glass", reactor.transform, new Vector3(-6.25f, 2.8f, 12.8f), Vector3.zero, new Vector3(0.08f, 1.2f, 0.08f), matGlass);

        // --- B. Emergency Shutdown (ESD) Pushbutton Stations ---
        void SpawnESDStation(Vector3 pos, Vector3 rot)
        {
            GameObject esd = new GameObject("ESD_Emergency_Shutdown_Station");
            esd.transform.SetParent(detailGroup.transform);
            esd.transform.position = pos;
            esd.transform.eulerAngles = rot;

            // Bright Yellow Enclosure
            CreatePrim(PrimitiveType.Cube, "ESD_Box", esd.transform, pos, rot, new Vector3(0.45f, 0.6f, 0.22f), matYellow);
            // Large Red Mushroom Push Button
            CreatePrim(PrimitiveType.Cylinder, "ESD_Mushroom_Button", esd.transform, pos + esd.transform.forward * 0.14f, rot + new Vector3(90, 0, 0), new Vector3(0.22f, 0.08f, 0.22f), matRed);
            // Overhead Warning Siren Strobe
            GameObject siren = CreatePrim(PrimitiveType.Cylinder, "ESD_Siren_Strobe", esd.transform, pos + Vector3.up * 0.45f, rot, new Vector3(0.18f, 0.16f, 0.18f), matRed);
            Light sirenLight = siren.AddComponent<Light>();
            sirenLight.type = LightType.Point;
            sirenLight.color = Color.red;
            sirenLight.intensity = 3.5f;
            sirenLight.range = 8.0f;
        }

        SpawnESDStation(new Vector3(7.4f, 1.5f, 2.5f), new Vector3(0, -90, 0));
        SpawnESDStation(new Vector3(-5.0f, 1.5f, -13.8f), new Vector3(0, 0, 0));

        // --- C. Emergency Eyewash & Safety Drench Shower ---
        GameObject eyewash = new GameObject("STATION_Emergency_Eyewash_Drench_Shower");
        eyewash.transform.SetParent(detailGroup.transform);
        eyewash.transform.position = new Vector3(-8.8f, 0f, -2.5f);
        // Green Standpipe
        CreatePrim(PrimitiveType.Cylinder, "Standpipe_Green", eyewash.transform, new Vector3(-8.8f, 1.5f, -2.5f), Vector3.zero, new Vector3(0.08f, 1.5f, 0.08f), matGreen);
        CreatePrim(PrimitiveType.Cylinder, "Drench_Showerhead", eyewash.transform, new Vector3(-8.5f, 2.8f, -2.5f), new Vector3(180, 0, 0), new Vector3(0.35f, 0.1f, 0.35f), matStainless);
        CreatePrim(PrimitiveType.Sphere, "Eyewash_Bowl", eyewash.transform, new Vector3(-8.5f, 1.05f, -2.5f), Vector3.zero, new Vector3(0.42f, 0.2f, 0.42f), matStainless);
        CreatePrim(PrimitiveType.Cube, "Eyewash_Sign", eyewash.transform, new Vector3(-8.8f, 3.2f, -2.5f), Vector3.zero, new Vector3(0.05f, 0.4f, 0.4f), matGreen);

        // --- D. Chemical Spill Kit Overpack Drums & Absorbent Sock Booms ---
        GameObject spillKitGroup = new GameObject("PROP_Spill_Response_Overpacks_And_Booms");
        spillKitGroup.transform.SetParent(detailGroup.transform);
        // Yellow 95-Gallon Overpack Spill Drums
        CreatePrim(PrimitiveType.Cylinder, "Spill_Overpack_Drum_1", spillKitGroup.transform, new Vector3(-4.0f, 0.65f, -6.5f), Vector3.zero, new Vector3(0.85f, 0.62f, 0.85f), matYellow);
        CreatePrim(PrimitiveType.Cylinder, "Spill_Overpack_Drum_2", spillKitGroup.transform, new Vector3(5.5f, 0.65f, -6.5f), Vector3.zero, new Vector3(0.85f, 0.62f, 0.85f), matYellow);

        // Absorbent Boom Sock Ring surrounding the chemical puddle
        for (int sock = 0; sock < 8; sock++)
        {
            float ang = sock * 45f * Mathf.Deg2Rad;
            Vector3 sockPos = new Vector3(2.6f + Mathf.Cos(ang) * 1.6f, 0.08f, 6.5f + Mathf.Sin(ang) * 1.6f);
            CreatePrim(PrimitiveType.Cylinder, $"Absorbent_Boom_{sock}", spillKitGroup.transform, sockPos, new Vector3(0, sock * 45f, 90), new Vector3(0.14f, 0.65f, 0.14f), matYellow);
        }

        // =========================================================================
        // SAVE & UPDATE SCENEVIEW
        // =========================================================================
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        if (SceneView.lastActiveSceneView != null)
        {
            SceneView.lastActiveSceneView.pivot = new Vector3(0.5f, 2.4f, -3.0f);
            SceneView.lastActiveSceneView.rotation = Quaternion.Euler(12f, 0f, 0f);
            SceneView.lastActiveSceneView.size = 10.0f;
            SceneView.lastActiveSceneView.Repaint();
        }

        Debug.Log("<color=green>=== COMPLETE CHEMICAL PLANT ELEVATION COMPLETED & SAVED! ===</color>");
    }
}
