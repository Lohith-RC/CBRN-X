using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using TMPro;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using CBRSX.Unity;

public static class RecreateBay03CleanScene
{
    [MenuItem("CBRN-X/Recreate Clean Bay 03 Scene (From Scratch)")]
    [MenuItem("CBRN-X/Enhance Bay 03 (Boundless Lighting & Rough Brown Cargo)")]
    public static void RecreateScene()
    {
        Debug.Log("<color=#00FF66><b>[CBRS-X] Generating Highly Dynamic Storage Bay 03 (Interactive Props, UGV, Forklift, Cranes & Boundless Multi-Color Lighting)...</b></color>");

        // Step 1: Ensure High-Depth Rough Brown Cargo Textures & Materials Exist
        EnsurePbrCargoTexturesAndMaterials();

        // Step 2: Create a brand new, empty scene
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // Core Environment Materials
        Material matFloor = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ConcreteFloor.mat");
        Material matDarkFloor = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ConcreteDark.mat");
        Material matWall = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_IndustrialWall.mat");
        Material matSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SteelBeam.mat");
        Material matStainless = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_StainlessSteel.mat");
        Material matYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyYellow.mat");
        Material matRed = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyRed.mat");
        Material matGreen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyGreen.mat");
        Material matOrange = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_HazmatOrange.mat");
        Material matDrumBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ChemicalDrum.mat");
        Material matDrumLeaking = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_LeakingDrum.mat");
        Material matRackBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_RackBlue.mat");
        Material matRackOrange = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_RackOrange.mat");
        Material matPallet = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PalletWood.mat");
        Material matPipeChlorine = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_Pipe_Chlorine.mat");
        Material matPipeNitrogen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_Pipe_Nitrogen.mat");
        Material matPipeWater = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_Pipe_Water.mat");

        // High-Contrast Disaster Materials
        Material matIBCTote = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_IBCTote.mat");
        Material matChemicalBox = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ChemicalBox.mat");
        Material matCorrosiveCrater = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_CorrosiveCrater.mat");
        Material matPelican = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PelicanCase.mat");
        Material matSCBA = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SCBATank.mat");
        Material matStatusPanel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_StatusPanel.mat");
        Material matTrussSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_TrussSteel.mat");
        Material matBermYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_BermYellow.mat");
        Material matMassiveTank = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_MassiveTank.mat");
        Material matTelemetryScreen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_Bay3_TelemetryScreen.mat");

        // Textured Rough Brown Cargo Material
        Material matCargoRoughBrown = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_CargoRoughBrown.mat");
        if (matCargoRoughBrown == null) matCargoRoughBrown = matChemicalBox;

        // High-Fidelity Metallic Drum Materials (Red, Black, Blue, Yellow, Acid Green)
        Material matDrumMetBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_DrumMetallic_CobaltBlue.mat");
        Material matDrumMetRed = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_DrumMetallic_CrimsonRed.mat");
        Material matDrumMetBlack = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_DrumMetallic_OnyxBlack.mat");
        Material matDrumMetYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_DrumMetallic_HazardYellow.mat");
        Material matDrumMetGreen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_DrumMetallic_AcidGreen.mat");

        if (matDrumMetBlue == null) matDrumMetBlue = matDrumBlue;
        if (matDrumMetRed == null) matDrumMetRed = matRed;
        if (matDrumMetBlack == null) matDrumMetBlack = matDarkFloor;
        if (matDrumMetYellow == null) matDrumMetYellow = matYellow;
        if (matDrumMetGreen == null) matDrumMetGreen = matGreen;

        Material[] metallicDrumPalette = new Material[] {
            matDrumMetBlue,
            matDrumMetRed,
            matDrumMetBlack,
            matDrumMetBlue,
            matDrumMetRed,
            matDrumMetBlack,
            matDrumMetYellow,
            matDrumMetGreen
        };

        // VFX Textured Materials
        Material matDustMotes = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_DustMotes_Textured.mat");

        // Volumetric Light Drum Materials & Geometric Light Cookies
        Material matVolumetricCone = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_VolumetricLight_Cone.mat");
        Material matVolumetricSkylight = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_VolumetricLight_Skylight.mat");
        Material matVolumetricToxic = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_VolumetricLight_ToxicZone.mat");

        Texture2D cookieCage = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Textures/Generated/Tex_LightCookie_IndustrialCage.png");
        Texture2D cookieLouver = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Textures/Generated/Tex_LightCookie_LouverSlats.png");

        // Glowing LED Ribbon Materials (Vibrant Neon Palette)
        Material matLedCyan = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        matLedCyan.name = "Mat_LED_Strip_Cyan";
        matLedCyan.SetColor("_BaseColor", new Color(0.05f, 0.88f, 1.0f));
        matLedCyan.EnableKeyword("_EMISSION");
        matLedCyan.SetColor("_EmissionColor", new Color(0.05f, 0.90f, 1.0f) * 3.8f);

        Material matLedMagenta = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        matLedMagenta.name = "Mat_LED_Strip_Magenta";
        matLedMagenta.SetColor("_BaseColor", new Color(1.0f, 0.15f, 0.85f));
        matLedMagenta.EnableKeyword("_EMISSION");
        matLedMagenta.SetColor("_EmissionColor", new Color(1.0f, 0.15f, 0.85f) * 3.8f);

        Material matLedAmber = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        matLedAmber.name = "Mat_LED_Strip_Amber";
        matLedAmber.SetColor("_BaseColor", new Color(1.0f, 0.70f, 0.15f));
        matLedAmber.EnableKeyword("_EMISSION");
        matLedAmber.SetColor("_EmissionColor", new Color(1.0f, 0.70f, 0.15f) * 3.5f);

        Material matLedLime = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        matLedLime.name = "Mat_LED_Strip_Lime";
        matLedLime.SetColor("_BaseColor", new Color(0.25f, 1.0f, 0.20f));
        matLedLime.EnableKeyword("_EMISSION");
        matLedLime.SetColor("_EmissionColor", new Color(0.25f, 1.0f, 0.20f) * 3.5f);

        // Helper primitive creation
        GameObject CreatePrim(PrimitiveType type, string name, Transform parent, Vector3 pos, Vector3 rot, Vector3 scale, Material mat, bool isTrigger = false, bool removeCollider = false)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = name;
            if (parent != null) go.transform.SetParent(parent, false);
            go.transform.position = pos;
            go.transform.eulerAngles = rot;
            go.transform.localScale = scale;
            if (mat != null)
            {
                go.GetComponent<MeshRenderer>().sharedMaterial = mat;
            }
            Collider col = go.GetComponent<Collider>();
            if (removeCollider && col != null)
            {
                Object.DestroyImmediate(col);
            }
            else if (col != null)
            {
                col.isTrigger = isTrigger;
            }
            return go;
        }

        // Helper for Volumetric Cone Geometry
        GameObject SpawnVolumetricCone(string name, Transform parent, Vector3 pos, float topRadius, float bottomRadius, float height, Material mat, int segments = 28)
        {
            GameObject coneGO = new GameObject(name);
            if (parent != null) coneGO.transform.SetParent(parent, false);
            coneGO.transform.position = pos;

            MeshFilter mf = coneGO.AddComponent<MeshFilter>();
            MeshRenderer mr = coneGO.AddComponent<MeshRenderer>();
            mr.sharedMaterial = mat;

            Mesh mesh = new Mesh();
            mesh.name = $"{name}_Mesh";

            int numVertices = (segments + 1) * 2;
            Vector3[] vertices = new Vector3[numVertices];
            Vector3[] normals = new Vector3[numVertices];
            Vector2[] uvs = new Vector2[numVertices];
            Color[] colors = new Color[numVertices];

            for (int i = 0; i <= segments; i++)
            {
                float u = (float)i / segments;
                float angle = u * Mathf.PI * 2f;
                float cos = Mathf.Cos(angle);
                float sin = Mathf.Sin(angle);

                int topIdx = i * 2;
                vertices[topIdx] = new Vector3(cos * topRadius, 0f, sin * topRadius);
                normals[topIdx] = new Vector3(cos, 0f, sin).normalized;
                uvs[topIdx] = new Vector2(u, 0f);
                colors[topIdx] = new Color(1f, 1f, 1f, 0.95f);

                int botIdx = i * 2 + 1;
                vertices[botIdx] = new Vector3(cos * bottomRadius, -height, sin * bottomRadius);
                normals[botIdx] = new Vector3(cos, 0f, sin).normalized;
                uvs[botIdx] = new Vector2(u, 1f);
                colors[botIdx] = new Color(1f, 1f, 1f, 0.05f);
            }

            int numTris = segments * 6 * 2;
            int[] triangles = new int[numTris];
            int triIdx = 0;

            for (int i = 0; i < segments; i++)
            {
                int top0 = i * 2;
                int bot0 = i * 2 + 1;
                int top1 = (i + 1) * 2;
                int bot1 = (i + 1) * 2 + 1;

                triangles[triIdx++] = top0;
                triangles[triIdx++] = top1;
                triangles[triIdx++] = bot0;

                triangles[triIdx++] = top1;
                triangles[triIdx++] = bot1;
                triangles[triIdx++] = bot0;

                triangles[triIdx++] = top0;
                triangles[triIdx++] = bot0;
                triangles[triIdx++] = top1;

                triangles[triIdx++] = top1;
                triangles[triIdx++] = bot0;
                triangles[triIdx++] = bot1;
            }

            mesh.vertices = vertices;
            mesh.normals = normals;
            mesh.uv = uvs;
            mesh.colors = colors;
            mesh.triangles = triangles;
            mesh.RecalculateBounds();
            mf.sharedMesh = mesh;

            return coneGO;
        }

        GameObject InstantiateVfxPrefab(string path, string name, Transform parent, Vector3 pos, Vector3 rot, Vector3 scale)
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (prefab == null) return null;

            GameObject go = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            if (go == null) go = Object.Instantiate(prefab);

            go.name = name;
            if (parent != null) go.transform.SetParent(parent, false);
            go.transform.position = pos;
            go.transform.eulerAngles = rot;
            go.transform.localScale = scale;

            foreach (var c in go.GetComponentsInChildren<Collider>(true))
            {
                Object.DestroyImmediate(c);
            }
            return go;
        }

        void ApplySmokeTexture(GameObject root, Material mat)
        {
            if (root == null || mat == null) return;
            foreach (var rend in root.GetComponentsInChildren<ParticleSystemRenderer>(true))
            {
                rend.sharedMaterial = mat;
            }
        }

        // =========================================================================
        // A. INDUSTRIAL ARCHITECTURE & HIGH-DETAIL STRUCTURE (BAY 03)
        // =========================================================================
        GameObject envRoot = new GameObject("--- 1_ENVIRONMENT_STRUCTURE ---");

        // 1. Concrete Floors
        CreatePrim(PrimitiveType.Cube, "ENV_Floor_Staging_SafeZone", envRoot.transform,
            new Vector3(0f, -0.25f, -15.5f), Vector3.zero, new Vector3(20f, 0.5f, 11f), matDarkFloor);
        CreatePrim(PrimitiveType.Cube, "ENV_Floor_Bay03_Warehouse", envRoot.transform,
            new Vector3(0f, -0.25f, 7.5f), Vector3.zero, new Vector3(30f, 0.5f, 35f), matFloor);

        // 2. Heavy Perimeter Walls & Roof
        CreatePrim(PrimitiveType.Cube, "ENV_Wall_Staging_South", envRoot.transform,
            new Vector3(0f, 4f, -21f), Vector3.zero, new Vector3(20f, 8f, 0.5f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Wall_Staging_West", envRoot.transform,
            new Vector3(-10f, 4f, -15.5f), Vector3.zero, new Vector3(0.5f, 8f, 11f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Wall_Staging_East", envRoot.transform,
            new Vector3(10f, 4f, -15.5f), Vector3.zero, new Vector3(0.5f, 8f, 11f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Ceiling_Staging", envRoot.transform,
            new Vector3(0f, 8.2f, -15.5f), Vector3.zero, new Vector3(20f, 0.4f, 11f), matSteel, false, true);

        CreatePrim(PrimitiveType.Cube, "ENV_Wall_North_Back", envRoot.transform,
            new Vector3(0f, 4f, 25f), Vector3.zero, new Vector3(30f, 8f, 0.5f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Wall_West", envRoot.transform,
            new Vector3(-15f, 4f, 7.5f), Vector3.zero, new Vector3(0.5f, 8f, 35f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Wall_East", envRoot.transform,
            new Vector3(15f, 4f, 7.5f), Vector3.zero, new Vector3(0.5f, 8f, 35f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Ceiling_Bay03", envRoot.transform,
            new Vector3(0f, 8.2f, 7.5f), Vector3.zero, new Vector3(30f, 0.4f, 35f), matSteel, false, true);

        // 3. Partition Wall with Opening
        CreatePrim(PrimitiveType.Cube, "ENV_Partition_Left", envRoot.transform,
            new Vector3(-9.5f, 4f, -10f), Vector3.zero, new Vector3(11f, 8f, 0.5f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Partition_Right", envRoot.transform,
            new Vector3(9.5f, 4f, -10f), Vector3.zero, new Vector3(11f, 8f, 0.5f), matWall);
        CreatePrim(PrimitiveType.Cube, "ENV_Partition_TopLintel", envRoot.transform,
            new Vector3(0f, 6.5f, -10f), Vector3.zero, new Vector3(8f, 3f, 0.5f), matWall);

        // 4. Yellow Hazard Threshold Stripe on Floor (z = -10)
        CreatePrim(PrimitiveType.Cube, "ENV_HazardThresholdStripe", envRoot.transform,
            new Vector3(0f, 0.01f, -10f), Vector3.zero, new Vector3(8f, 0.02f, 1.2f), matYellow, true);

        // 5. Overhead Roof Trusses & Web Struts
        GameObject trussGroup = new GameObject("OVERHEAD_STRUCTURAL_ROOF_TRUSSES");
        trussGroup.transform.SetParent(envRoot.transform);
        float[] trussZPositions = new float[] { -8f, -1f, 6f, 13f, 20f, 27f };
        foreach (float tz in trussZPositions)
        {
            CreatePrim(PrimitiveType.Cube, $"Truss_Upper_{tz}", trussGroup.transform,
                new Vector3(0f, 8.0f, tz), Vector3.zero, new Vector3(29.6f, 0.25f, 0.35f), matTrussSteel != null ? matTrussSteel : matSteel, false, true);
            CreatePrim(PrimitiveType.Cube, $"Truss_Lower_{tz}", trussGroup.transform,
                new Vector3(0f, 7.3f, tz), Vector3.zero, new Vector3(29.6f, 0.25f, 0.35f), matTrussSteel != null ? matTrussSteel : matSteel, false, true);

            for (float tx = -13.5f; tx <= 13.5f; tx += 3.0f)
            {
                CreatePrim(PrimitiveType.Cube, $"Truss_Post_{tz}_{tx}", trussGroup.transform,
                    new Vector3(tx, 7.65f, tz), Vector3.zero, new Vector3(0.18f, 0.7f, 0.2f), matSteel, false, true);
                CreatePrim(PrimitiveType.Cube, $"Truss_Diag_{tz}_{tx}", trussGroup.transform,
                    new Vector3(tx + 1.5f, 7.65f, tz), new Vector3(0f, 0f, 25f), new Vector3(0.14f, 0.82f, 0.15f), matSteel, false, true);
            }
        }

        // 6. Overhead Industrial Ventilation Ductwork
        GameObject ductGroup = new GameObject("OVERHEAD_HVAC_VENTILATION_NETWORK");
        ductGroup.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cylinder, "Duct_Main_Spine", ductGroup.transform,
            new Vector3(0f, 7.1f, 7.5f), new Vector3(90f, 0f, 0f), new Vector3(0.9f, 17.5f, 0.9f), matSteel, false, true);
        for (float dz = -4f; dz <= 20f; dz += 8f)
        {
            CreatePrim(PrimitiveType.Cube, $"Duct_Exhaust_Louver_{dz}", ductGroup.transform,
                new Vector3(0f, 6.55f, dz), Vector3.zero, new Vector3(1.1f, 0.3f, 1.1f), matDarkFloor, false, true);
        }

        // 7. Facility Signboard (BAY 3: HAZMAT STORAGE & DECONTAMINATION)
        GameObject signGroup = new GameObject("OVERHEAD_BAY3_FACILITY_SIGN");
        signGroup.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cube, "Sign_Panel", signGroup.transform,
            new Vector3(0f, 5.8f, -9.8f), Vector3.zero, new Vector3(9.2f, 1.25f, 0.1f), matWall, false, true);
        CreatePrim(PrimitiveType.Cube, "Sign_Trim_Top", signGroup.transform,
            new Vector3(0f, 6.45f, -9.8f), Vector3.zero, new Vector3(9.4f, 0.1f, 0.15f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Sign_Trim_Bottom", signGroup.transform,
            new Vector3(0f, 5.15f, -9.8f), Vector3.zero, new Vector3(9.4f, 0.1f, 0.15f), matSteel, false, true);

        GameObject signTextGO = new GameObject("Sign_Text_TMPro");
        signTextGO.transform.SetParent(signGroup.transform);
        signTextGO.transform.position = new Vector3(0f, 5.8f, -9.9f);
        signTextGO.transform.rotation = Quaternion.Euler(0, 180, 0);
        var signTmp = signTextGO.AddComponent<TextMeshPro>();
        signTmp.text = "BAY 3: HAZMAT STORAGE & DECONTAMINATION";
        signTmp.fontSize = 5.8f;
        signTmp.alignment = TextAlignmentOptions.Center;
        signTmp.color = new Color(0.95f, 0.95f, 0.95f, 1f);
        signTmp.fontStyle = FontStyles.Bold;

        // Large Real-Time Telemetry Monitor Screen on Wall
        CreatePrim(PrimitiveType.Cube, "STATUS_PANEL_REALTIME_TELEMETRY_SCREEN", envRoot.transform,
            new Vector3(4.5f, 2.4f, -9.75f), Vector3.zero, new Vector3(2.4f, 1.35f, 0.12f), matTelemetryScreen != null ? matTelemetryScreen : matStatusPanel);

        // Airlock Access & Biometric Terminal
        GameObject airlockTerminal = new GameObject("AIRLOCK_SECURITY_BIOMETRIC_TERMINAL");
        airlockTerminal.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cube, "Terminal_Pedestal", airlockTerminal.transform,
            new Vector3(-4.5f, 1.1f, -9.75f), Vector3.zero, new Vector3(0.35f, 1.2f, 0.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Terminal_Keypad", airlockTerminal.transform,
            new Vector3(-4.5f, 1.45f, -9.85f), new Vector3(25f, 0f, 0f), new Vector3(0.28f, 0.35f, 0.05f), matDarkFloor);
        CreatePrim(PrimitiveType.Cube, "Biometric_Scanner_Glow", airlockTerminal.transform,
            new Vector3(-4.5f, 1.55f, -9.88f), new Vector3(25f, 0f, 0f), new Vector3(0.08f, 0.08f, 0.02f), matLedCyan);

        // 8. Roll-Up Shutter Frame & Panel
        GameObject doorFrame = new GameObject("DOOR_Corrugated_RollUp_Shutter");
        doorFrame.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cube, "Door_Frame_L", doorFrame.transform,
            new Vector3(-4.2f, 3.0f, -9.9f), Vector3.zero, new Vector3(0.4f, 6.0f, 0.3f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Door_Frame_R", doorFrame.transform,
            new Vector3(4.2f, 3.0f, -9.9f), Vector3.zero, new Vector3(0.4f, 6.0f, 0.3f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Door_Frame_Top", doorFrame.transform,
            new Vector3(0f, 6.0f, -9.9f), Vector3.zero, new Vector3(8.8f, 0.5f, 0.4f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "RollUp_Door_Panel", doorFrame.transform,
            new Vector3(0f, 8.5f, -9.9f), Vector3.zero, new Vector3(8.0f, 5.0f, 0.1f), matSteel, true);

        // =========================================================================
        // B. DETAILED HIGH-FIDELITY METALLIC DRUM BUILDER
        // =========================================================================
        GameObject drumMasterGroup = new GameObject("--- 2_METALLIC_DRUMS_STORAGE_ARRAY ---");
        drumMasterGroup.transform.SetParent(envRoot.transform);

        GameObject SpawnDetailedMetallicDrum(string name, Transform parent, Vector3 pos, Vector3 rot, Material matDrum)
        {
            GameObject drumRoot = new GameObject(name);
            if (parent != null) drumRoot.transform.SetParent(parent, false);
            drumRoot.transform.position = pos;
            drumRoot.transform.eulerAngles = rot;

            // 1. Main Drum Body Cylinder
            CreatePrim(PrimitiveType.Cylinder, "Drum_Body_Main", drumRoot.transform,
                pos + new Vector3(0f, 0.45f, 0f), rot, new Vector3(0.60f, 0.45f, 0.60f), matDrum);

            // 2. Rolling Chimes / Reinforcement Flange Hoops (Chrome/Steel)
            CreatePrim(PrimitiveType.Cylinder, "Drum_Chime_Lower", drumRoot.transform,
                pos + new Vector3(0f, 0.30f, 0f), rot, new Vector3(0.625f, 0.025f, 0.625f), matSteel, false, true);
            CreatePrim(PrimitiveType.Cylinder, "Drum_Chime_Upper", drumRoot.transform,
                pos + new Vector3(0f, 0.60f, 0f), rot, new Vector3(0.625f, 0.025f, 0.625f), matSteel, false, true);

            // 3. Top and Bottom Rim Lips
            CreatePrim(PrimitiveType.Cylinder, "Drum_Rim_Bottom", drumRoot.transform,
                pos + new Vector3(0f, 0.02f, 0f), rot, new Vector3(0.615f, 0.02f, 0.615f), matSteel, false, true);
            CreatePrim(PrimitiveType.Cylinder, "Drum_Rim_Top", drumRoot.transform,
                pos + new Vector3(0f, 0.88f, 0f), rot, new Vector3(0.615f, 0.02f, 0.615f), matSteel, false, true);

            // 4. Bung Plugs on Top Lid
            CreatePrim(PrimitiveType.Cylinder, "Drum_Bung_Main", drumRoot.transform,
                pos + new Vector3(0.16f, 0.905f, 0.06f), rot, new Vector3(0.09f, 0.03f, 0.09f), matStainless, false, true);
            CreatePrim(PrimitiveType.Cylinder, "Drum_Bung_Vent", drumRoot.transform,
                pos + new Vector3(-0.16f, 0.905f, -0.06f), rot, new Vector3(0.06f, 0.03f, 0.06f), matStainless, false, true);

            // 5. Hazmat Warning Placard Decal
            CreatePrim(PrimitiveType.Cube, "Drum_Hazmat_Decal", drumRoot.transform,
                pos + new Vector3(0f, 0.45f, 0.305f), rot + new Vector3(0f, 0f, 45f), new Vector3(0.18f, 0.18f, 0.005f), matYellow, false, true);

            return drumRoot;
        }

        void SpawnQuadMetallicDrumPallet(string name, Transform parent, Vector3 pos, float rotY, Material matD1, Material matD2, Material matD3, Material matD4)
        {
            GameObject quadRoot = new GameObject(name);
            if (parent != null) quadRoot.transform.SetParent(parent, false);
            quadRoot.transform.position = pos;
            quadRoot.transform.eulerAngles = new Vector3(0f, rotY, 0f);

            CreatePrim(PrimitiveType.Cube, "Pallet_Base", quadRoot.transform,
                pos + new Vector3(0f, 0.08f, 0f), new Vector3(0f, rotY, 0f), new Vector3(1.35f, 0.15f, 1.35f), matPallet, false, true);

            Vector3[] offsets = new Vector3[] {
                new Vector3(-0.32f, 0.15f, -0.32f),
                new Vector3(0.32f, 0.15f, -0.32f),
                new Vector3(-0.32f, 0.15f, 0.32f),
                new Vector3(0.32f, 0.15f, 0.32f)
            };
            Material[] mats = new Material[] { matD1, matD2, matD3, matD4 };

            for (int i = 0; i < 4; i++)
            {
                Vector3 rotOffset = Quaternion.Euler(0f, rotY, 0f) * offsets[i];
                SpawnDetailedMetallicDrum($"{name}_Drum_{i}", quadRoot.transform, pos + rotOffset, new Vector3(0f, rotY + i * 90f, 0f), mats[i]);
            }

            CreatePrim(PrimitiveType.Cube, "Pallet_Steel_Banding", quadRoot.transform,
                pos + new Vector3(0f, 0.65f, 0f), new Vector3(0f, rotY, 0f), new Vector3(1.36f, 0.04f, 1.36f), matStainless, false, true);
        }

        // =========================================================================
        // C. PALLET RACKING WITH METALLIC DRUMS & ROUGH BROWN CARGO
        // =========================================================================
        GameObject racksGroup = new GameObject("WAREHOUSE_PALLET_RACKING_ARRAY");
        racksGroup.transform.SetParent(envRoot.transform);

        void SpawnPalletRackWithMetallicDrums(Vector3 basePos, float length, int tiers)
        {
            int cols = Mathf.CeilToInt(length / 2.8f) + 1;
            for (int c = 0; c < cols; c++)
            {
                float z = basePos.z + c * 2.8f;
                CreatePrim(PrimitiveType.Cube, $"RackPost_F_{c}", racksGroup.transform, new Vector3(basePos.x, basePos.y + (tiers * 1.5f) / 2f, z), Vector3.zero, new Vector3(0.12f, tiers * 1.5f, 0.12f), matRackBlue, false, true);
                CreatePrim(PrimitiveType.Cube, $"RackPost_B_{c}", racksGroup.transform, new Vector3(basePos.x - 1.2f, basePos.y + (tiers * 1.5f) / 2f, z), Vector3.zero, new Vector3(0.12f, tiers * 1.5f, 0.12f), matRackBlue, false, true);
            }
            for (int t = 1; t <= tiers; t++)
            {
                float y = basePos.y + t * 1.4f;
                CreatePrim(PrimitiveType.Cube, $"RackBeam_F_T{t}", racksGroup.transform, new Vector3(basePos.x, y, basePos.z + length / 2f), Vector3.zero, new Vector3(0.1f, 0.15f, length), matRackOrange, false, true);
                CreatePrim(PrimitiveType.Cube, $"RackBeam_B_T{t}", racksGroup.transform, new Vector3(basePos.x - 1.2f, y, basePos.z + length / 2f), Vector3.zero, new Vector3(0.1f, 0.15f, length), matRackOrange, false, true);

                for (int c = 0; c < cols - 1; c++)
                {
                    float pz = basePos.z + c * 2.8f + 1.4f;
                    CreatePrim(PrimitiveType.Cube, $"Pallet_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.08f, pz), Vector3.zero, new Vector3(1.1f, 0.14f, 1.2f), matPallet, false, true);

                    int pattern = (c * 3 + t) % 6;
                    if (pattern == 0)
                    {
                        SpawnDetailedMetallicDrum($"Drum_Rack_RedA_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz - 0.28f), Vector3.zero, matDrumMetRed);
                        SpawnDetailedMetallicDrum($"Drum_Rack_RedB_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz + 0.28f), Vector3.zero, matDrumMetRed);
                    }
                    else if (pattern == 1)
                    {
                        SpawnDetailedMetallicDrum($"Drum_Rack_BlueA_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz - 0.28f), Vector3.zero, matDrumMetBlue);
                        SpawnDetailedMetallicDrum($"Drum_Rack_BlueB_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz + 0.28f), Vector3.zero, matDrumMetBlue);
                    }
                    else if (pattern == 2)
                    {
                        SpawnDetailedMetallicDrum($"Drum_Rack_BlackA_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz - 0.28f), Vector3.zero, matDrumMetBlack);
                        SpawnDetailedMetallicDrum($"Drum_Rack_BlackB_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz + 0.28f), Vector3.zero, matDrumMetBlack);
                    }
                    else if (pattern == 3)
                    {
                        SpawnDetailedMetallicDrum($"Drum_Rack_Yellow_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz - 0.28f), Vector3.zero, matDrumMetYellow);
                        SpawnDetailedMetallicDrum($"Drum_Rack_Blue_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.15f, pz + 0.28f), Vector3.zero, matDrumMetBlue);
                    }
                    else
                    {
                        CreatePrim(PrimitiveType.Cube, $"RoughBrownCargo_T{t}_{c}", racksGroup.transform,
                            new Vector3(basePos.x - 0.6f, y + 0.60f, pz), Vector3.zero, new Vector3(0.92f, 0.88f, 0.92f), matCargoRoughBrown, false, true);
                    }
                }
            }

            CreatePrim(PrimitiveType.Cylinder, $"Bollard_Front_{basePos.x}", racksGroup.transform,
                new Vector3(basePos.x + 0.4f, 0.5f, basePos.z - 0.4f), Vector3.zero, new Vector3(0.25f, 0.5f, 0.25f), matBermYellow != null ? matBermYellow : matYellow);
            CreatePrim(PrimitiveType.Cylinder, $"Bollard_Back_{basePos.x}", racksGroup.transform,
                new Vector3(basePos.x + 0.4f, 0.5f, basePos.z + length + 0.4f), Vector3.zero, new Vector3(0.25f, 0.5f, 0.25f), matBermYellow != null ? matBermYellow : matYellow);
        }

        SpawnPalletRackWithMetallicDrums(new Vector3(-12.5f, 0f, -4f), 20f, 3);
        SpawnPalletRackWithMetallicDrums(new Vector3(13.7f, 0f, -4f), 20f, 3);

        // =========================================================================
        // D. DENSE FLOOR-LEVEL METALLIC DRUM ARRAYS & MULTI-TIER PALLET STACKS
        // =========================================================================
        GameObject drumFloorArrays = new GameObject("FLOOR_METALLIC_DRUMS_CLUSTERS");
        drumFloorArrays.transform.SetParent(drumMasterGroup.transform);

        SpawnQuadMetallicDrumPallet("QuadPallet_West_01", drumFloorArrays.transform, new Vector3(-6.5f, 0f, -1.0f), 10f, matDrumMetRed, matDrumMetRed, matDrumMetBlack, matDrumMetBlack);
        SpawnQuadMetallicDrumPallet("QuadPallet_West_02", drumFloorArrays.transform, new Vector3(-6.5f, 0f, 2.0f), -5f, matDrumMetBlue, matDrumMetBlue, matDrumMetBlue, matDrumMetRed);
        SpawnQuadMetallicDrumPallet("QuadPallet_West_03", drumFloorArrays.transform, new Vector3(-6.5f, 0f, 13.5f), 15f, matDrumMetBlack, matDrumMetBlack, matDrumMetBlack, matDrumMetYellow);

        GameObject stack2Tier = new GameObject("QuadPallet_West_2TierStacked");
        stack2Tier.transform.SetParent(drumFloorArrays.transform, false);
        SpawnQuadMetallicDrumPallet("Quad_Bottom_Tier", stack2Tier.transform, new Vector3(-6.5f, 0f, 16.5f), 0f, matDrumMetRed, matDrumMetBlue, matDrumMetRed, matDrumMetBlue);
        CreatePrim(PrimitiveType.Cube, "Pallet_Tier2_Base", stack2Tier.transform, new Vector3(-6.5f, 1.15f, 16.5f), Vector3.zero, new Vector3(1.35f, 0.15f, 1.35f), matPallet, false, true);
        SpawnDetailedMetallicDrum("Tier2_Drum_0", stack2Tier.transform, new Vector3(-6.82f, 1.25f, 16.18f), Vector3.zero, matDrumMetBlack);
        SpawnDetailedMetallicDrum("Tier2_Drum_1", stack2Tier.transform, new Vector3(-6.18f, 1.25f, 16.18f), Vector3.zero, matDrumMetBlack);
        SpawnDetailedMetallicDrum("Tier2_Drum_2", stack2Tier.transform, new Vector3(-6.82f, 1.25f, 16.82f), Vector3.zero, matDrumMetRed);
        SpawnDetailedMetallicDrum("Tier2_Drum_3", stack2Tier.transform, new Vector3(-6.18f, 1.25f, 16.82f), Vector3.zero, matDrumMetBlue);

        SpawnQuadMetallicDrumPallet("QuadPallet_East_01", drumFloorArrays.transform, new Vector3(6.5f, 0f, -1.0f), -12f, matDrumMetBlue, matDrumMetBlue, matDrumMetRed, matDrumMetRed);
        SpawnQuadMetallicDrumPallet("QuadPallet_East_02", drumFloorArrays.transform, new Vector3(6.5f, 0f, 2.0f), 8f, matDrumMetRed, matDrumMetBlack, matDrumMetBlue, matDrumMetBlack);
        SpawnQuadMetallicDrumPallet("QuadPallet_East_03", drumFloorArrays.transform, new Vector3(6.5f, 0f, 13.5f), -18f, matDrumMetBlack, matDrumMetBlue, matDrumMetRed, matDrumMetBlack);

        for (int i = 0; i < 14; i++)
        {
            float dx = -11.0f + i * 1.7f;
            Material dm = metallicDrumPalette[i % metallicDrumPalette.Length];
            SpawnDetailedMetallicDrum($"Rear_Perimeter_Drum_{i}", drumFloorArrays.transform, new Vector3(dx, 0f, 23.5f), new Vector3(0f, i * 35f, 0f), dm);
            if (i % 3 == 0)
            {
                SpawnDetailedMetallicDrum($"Rear_Perimeter_Drum_Top_{i}", drumFloorArrays.transform, new Vector3(dx, 0.92f, 23.5f), new Vector3(0f, i * 45f, 0f), metallicDrumPalette[(i + 2) % metallicDrumPalette.Length]);
            }
        }

        SpawnDetailedMetallicDrum("Quarantine_Drum_Red_1", drumFloorArrays.transform, new Vector3(-1.8f, 0f, -6.5f), Vector3.zero, matDrumMetRed);
        SpawnDetailedMetallicDrum("Quarantine_Drum_Black_2", drumFloorArrays.transform, new Vector3(-1.8f, 0f, -7.5f), Vector3.zero, matDrumMetBlack);
        SpawnDetailedMetallicDrum("Quarantine_Drum_Blue_3", drumFloorArrays.transform, new Vector3(-1.0f, 0f, -7.0f), Vector3.zero, matDrumMetBlue);
        SpawnDetailedMetallicDrum("Quarantine_Drum_Yellow_4", drumFloorArrays.transform, new Vector3(-1.0f, 0f, -8.0f), Vector3.zero, matDrumMetYellow);

        SpawnDetailedMetallicDrum("Fallen_Drum_Red_Hazard", drumFloorArrays.transform,
            new Vector3(1.8f, 0.28f, 5.2f), new Vector3(90f, 45f, 0f), matDrumMetRed);
        SpawnDetailedMetallicDrum("Tilted_Drum_Black_Hazard", drumFloorArrays.transform,
            new Vector3(-1.2f, 0.15f, 5.5f), new Vector3(18f, 25f, -12f), matDrumMetBlack);
        SpawnDetailedMetallicDrum("Upright_Drum_Blue_Hazard", drumFloorArrays.transform,
            new Vector3(2.2f, 0f, 9.2f), Vector3.zero, matDrumMetBlue);
        SpawnDetailedMetallicDrum("Upright_Drum_Red_Hazard", drumFloorArrays.transform,
            new Vector3(-1.4f, 0f, 9.5f), Vector3.zero, matDrumMetRed);

        // =========================================================================
        // E. HIGH-TECH INDUSTRIAL FORKLIFT TRUCK (YELLOW & STEEL)
        // =========================================================================
        GameObject forkliftGO = new GameObject("VEHICLE_Industrial_Forklift_Truck");
        forkliftGO.transform.SetParent(envRoot.transform, false);
        Vector3 fkPos = new Vector3(-3.2f, 0f, 1.0f);
        float fkRot = -20f;
        forkliftGO.transform.position = fkPos;
        forkliftGO.transform.eulerAngles = new Vector3(0f, fkRot, 0f);

        // 1. Chassis & Heavy Counterweight
        CreatePrim(PrimitiveType.Cube, "Forklift_Chassis", forkliftGO.transform, fkPos + new Vector3(0f, 0.55f, 0f), new Vector3(0f, fkRot, 0f), new Vector3(1.4f, 0.6f, 2.2f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Forklift_Counterweight", forkliftGO.transform, fkPos + new Vector3(0f, 0.75f, -0.9f), new Vector3(0f, fkRot, 0f), new Vector3(1.35f, 0.7f, 0.6f), matDarkFloor);

        // 2. Heavy Rubber Wheels
        Vector3[] wheelOffsets = new Vector3[] {
            new Vector3(-0.75f, 0.35f, 0.75f),
            new Vector3(0.75f, 0.35f, 0.75f),
            new Vector3(-0.65f, 0.3f, -0.75f),
            new Vector3(0.65f, 0.3f, -0.75f)
        };
        for (int w = 0; w < 4; w++)
        {
            Vector3 wRotOff = Quaternion.Euler(0f, fkRot, 0f) * wheelOffsets[w];
            CreatePrim(PrimitiveType.Cylinder, $"Forklift_Wheel_{w}", forkliftGO.transform,
                fkPos + wRotOff, new Vector3(0f, fkRot, 90f), new Vector3(0.7f, 0.2f, 0.7f), matDarkFloor);
        }

        // 3. Operator Roll Cage & Overhead Warning Light
        CreatePrim(PrimitiveType.Cube, "Forklift_Cage_Post_FL", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(-0.55f, 1.35f, 0.3f), new Vector3(0f, fkRot, 0f), new Vector3(0.08f, 1.4f, 0.08f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Forklift_Cage_Post_FR", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0.55f, 1.35f, 0.3f), new Vector3(0f, fkRot, 0f), new Vector3(0.08f, 1.4f, 0.08f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Forklift_Cage_Post_BL", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(-0.55f, 1.35f, -0.5f), new Vector3(0f, fkRot, 0f), new Vector3(0.08f, 1.4f, 0.08f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Forklift_Cage_Post_BR", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0.55f, 1.35f, -0.5f), new Vector3(0f, fkRot, 0f), new Vector3(0.08f, 1.4f, 0.08f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Forklift_Cage_Roof", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0f, 2.05f, -0.1f), new Vector3(0f, fkRot, 0f), new Vector3(1.2f, 0.06f, 0.9f), matDarkFloor, false, true);

        // Amber Beacon on Forklift Roof
        CreatePrim(PrimitiveType.Cylinder, "Forklift_Roof_Beacon", forkliftGO.transform,
            fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0f, 2.15f, -0.1f), new Vector3(0f, fkRot, 0f), new Vector3(0.18f, 0.12f, 0.18f), matOrange);

        // 4. Hydraulic Mast & Lift Carriage
        CreatePrim(PrimitiveType.Cube, "Forklift_Mast_L", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(-0.45f, 1.4f, 1.15f), new Vector3(0f, fkRot, 0f), new Vector3(0.1f, 2.2f, 0.1f), matDarkFloor);
        CreatePrim(PrimitiveType.Cube, "Forklift_Mast_R", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0.45f, 1.4f, 1.15f), new Vector3(0f, fkRot, 0f), new Vector3(0.1f, 2.2f, 0.1f), matDarkFloor);

        // 5. Dual Steel Fork Tines lifting a Drum Pallet
        CreatePrim(PrimitiveType.Cube, "Fork_Tine_L", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(-0.35f, 0.22f, 1.8f), new Vector3(0f, fkRot, 0f), new Vector3(0.1f, 0.05f, 1.3f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Fork_Tine_R", forkliftGO.transform, fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0.35f, 0.22f, 1.8f), new Vector3(0f, fkRot, 0f), new Vector3(0.1f, 0.05f, 1.3f), matSteel);

        // Loaded Pallet on Forklift
        Vector3 palletFkPos = fkPos + Quaternion.Euler(0f, fkRot, 0f) * new Vector3(0f, 0.28f, 1.8f);
        SpawnQuadMetallicDrumPallet("Forklift_Loaded_Pallet", forkliftGO.transform, palletFkPos, fkRot, matDrumMetRed, matDrumMetBlack, matDrumMetRed, matDrumMetBlack);

        // =========================================================================
        // F. AUTONOMOUS TACTICAL CBRN RECON ROVER (UGV)
        // =========================================================================
        GameObject ugvRoot = new GameObject("ROBOT_Autonomous_CBRN_Recon_UGV");
        ugvRoot.transform.SetParent(envRoot.transform, false);
        Vector3 ugvPos = new Vector3(3.2f, 0f, 8.5f);
        float ugvRot = -135f;
        ugvRoot.transform.position = ugvPos;
        ugvRoot.transform.eulerAngles = new Vector3(0f, ugvRot, 0f);

        // Armored Chassis & Track Treads
        CreatePrim(PrimitiveType.Cube, "UGV_Chassis_Armored", ugvRoot.transform, ugvPos + new Vector3(0f, 0.35f, 0f), new Vector3(0f, ugvRot, 0f), new Vector3(0.9f, 0.35f, 1.3f), matDarkFloor);
        CreatePrim(PrimitiveType.Cube, "UGV_Track_Left", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(-0.52f, 0.25f, 0f), new Vector3(0f, ugvRot, 0f), new Vector3(0.18f, 0.45f, 1.4f), matSteel);
        CreatePrim(PrimitiveType.Cube, "UGV_Track_Right", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0.52f, 0.25f, 0f), new Vector3(0f, ugvRot, 0f), new Vector3(0.18f, 0.45f, 1.4f), matSteel);

        // Sensor Mast & Rotating LiDAR Puck
        CreatePrim(PrimitiveType.Cylinder, "UGV_Sensor_Mast", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0f, 0.75f, -0.3f), new Vector3(0f, ugvRot, 0f), new Vector3(0.08f, 0.5f, 0.08f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cylinder, "UGV_LiDAR_Puck", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0f, 1.05f, -0.3f), new Vector3(0f, ugvRot, 0f), new Vector3(0.2f, 0.08f, 0.2f), matDarkFloor, false, true);
        CreatePrim(PrimitiveType.Sphere, "UGV_FLIR_Camera_Dome", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0f, 0.6f, 0.5f), new Vector3(0f, ugvRot, 0f), new Vector3(0.22f, 0.22f, 0.22f), matLedCyan, false, true);

        // Articulated 3-Axis Sampling Arm
        CreatePrim(PrimitiveType.Cylinder, "UGV_Arm_Base", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0.28f, 0.55f, 0.25f), new Vector3(0f, ugvRot, 0f), new Vector3(0.12f, 0.12f, 0.12f), matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "UGV_Arm_Segment_1", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0.28f, 0.8f, 0.35f), new Vector3(30f, ugvRot, 0f), new Vector3(0.06f, 0.45f, 0.06f), matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "UGV_Arm_Segment_2", ugvRoot.transform, ugvPos + Quaternion.Euler(0f, ugvRot, 0f) * new Vector3(0.28f, 0.95f, 0.65f), new Vector3(-45f, ugvRot, 0f), new Vector3(0.05f, 0.45f, 0.05f), matSteel, false, true);

        // =========================================================================
        // G. SUSPENDED OVERHEAD BRIDGE CRANE & DRUM HOIST GANTRY
        // =========================================================================
        GameObject craneRoot = new GameObject("STRUCTURE_Overhead_Bridge_Crane_Gantry");
        craneRoot.transform.SetParent(envRoot.transform);

        // Crane Bridge Girder (Yellow steel spanning full bay width at Y = 7.7)
        CreatePrim(PrimitiveType.Cube, "Crane_Bridge_Beam_Front", craneRoot.transform,
            new Vector3(0f, 7.7f, 6.0f), Vector3.zero, new Vector3(29.4f, 0.45f, 0.2f), matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "Crane_Bridge_Beam_Back", craneRoot.transform,
            new Vector3(0f, 7.7f, 6.8f), Vector3.zero, new Vector3(29.4f, 0.45f, 0.2f), matYellow, false, true);

        // Motorized Hoist Trolley
        Vector3 trolleyPos = new Vector3(0f, 7.6f, 6.4f);
        CreatePrim(PrimitiveType.Cube, "Crane_Hoist_Trolley", craneRoot.transform,
            trolleyPos, Vector3.zero, new Vector3(1.2f, 0.5f, 1.2f), matDarkFloor, false, true);

        // Steel Wire Cables hanging down to Y = 4.2
        CreatePrim(PrimitiveType.Cylinder, "Crane_Cable_FL", craneRoot.transform,
            new Vector3(-0.35f, 5.8f, 6.1f), Vector3.zero, new Vector3(0.02f, 1.6f, 0.02f), matStainless, false, true);
        CreatePrim(PrimitiveType.Cylinder, "Crane_Cable_FR", craneRoot.transform,
            new Vector3(0.35f, 5.8f, 6.1f), Vector3.zero, new Vector3(0.02f, 1.6f, 0.02f), matStainless, false, true);

        // Pneumatic Drum Spreader Frame & Suspended Metallic Blue Drum
        Vector3 spreaderPos = new Vector3(0f, 4.2f, 6.4f);
        CreatePrim(PrimitiveType.Cube, "Crane_Spreader_Frame", craneRoot.transform,
            spreaderPos, Vector3.zero, new Vector3(0.9f, 0.12f, 0.9f), matYellow, false, true);

        SpawnDetailedMetallicDrum("Crane_Suspended_Metallic_Blue_Drum", craneRoot.transform,
            spreaderPos + new Vector3(0f, -0.92f, 0f), Vector3.zero, matDrumMetBlue);

        // =========================================================================
        // H. CHEMICAL SPILL HAZARD & LEAKAGE ZONE WITH ABSORBENT BOOMS
        // =========================================================================
        GameObject spillGroup = new GameObject("CHEMICAL_SPILL_HAZARD_ZONE");
        spillGroup.transform.SetParent(envRoot.transform);
        Vector3 spillPos = new Vector3(0.5f, 0.02f, 7.0f);

        CreatePrim(PrimitiveType.Cylinder, "Spill_Puddle_Corrosive", spillGroup.transform,
            spillPos, Vector3.zero, new Vector3(3.8f, 0.02f, 3.8f), matCorrosiveCrater != null ? matCorrosiveCrater : matGreen, true);

        // Yellow Absorbent Containment Booms
        float boomRadius = 2.4f;
        for (int b = 0; b < 16; b++)
        {
            float ang = b * (Mathf.PI * 2f / 16f);
            Vector3 bPos = spillPos + new Vector3(Mathf.Cos(ang) * boomRadius, 0.06f, Mathf.Sin(ang) * boomRadius);
            CreatePrim(PrimitiveType.Cylinder, $"Absorbent_Boom_Segment_{b}", spillGroup.transform,
                bPos, new Vector3(0f, -ang * Mathf.Rad2Deg + 90f, 90f), new Vector3(0.12f, 0.45f, 0.12f), matYellow, false, true);
        }

        // Breached Leaking chemical drum
        GameObject leakDrumGO = CreatePrim(PrimitiveType.Cylinder, "DRUM-02_Leaking_Chemical_Breach", spillGroup.transform,
            spillPos + new Vector3(0.6f, 0.45f, 0.3f), new Vector3(15f, 25f, -10f), new Vector3(0.65f, 0.48f, 0.65f), matDrumLeaking != null ? matDrumLeaking : matDrumMetBlue);
        var leakComp = leakDrumGO.AddComponent<LeakDrum>();
        var leakCol = leakDrumGO.GetComponent<Collider>();
        if (leakCol != null) leakCol.isTrigger = true;

        // Spill Kit & Gas Detector
        GameObject spillKitGO = CreatePrim(PrimitiveType.Cube, "Spill_Containment_Kit_Case", spillGroup.transform,
            spillPos + new Vector3(-1.8f, 0.35f, -1.8f), Vector3.zero, new Vector3(0.7f, 0.65f, 0.5f), matBermYellow != null ? matBermYellow : matYellow);
        spillKitGO.AddComponent<ContainmentKit>();

        GameObject detectorGO = CreatePrim(PrimitiveType.Cube, "GasDetector_Handheld_Unit", envRoot.transform,
            new Vector3(-2.0f, 1.05f, -13.6f), Vector3.zero, new Vector3(0.18f, 0.25f, 0.12f), matYellow, true);
        detectorGO.AddComponent<GasDetector>();

        GameObject civilianGO = CreatePrim(PrimitiveType.Capsule, "Civilian_Worker_Casualty", envRoot.transform,
            new Vector3(7.5f, 0.9f, -14.0f), Vector3.zero, new Vector3(0.7f, 0.85f, 0.7f), matOrange);
        civilianGO.AddComponent<Civilian>();

        // =========================================================================
        // I. CINEMATIC DISASTER VFX (SPARKS, STEAM JETS, POISON GAS, SHOWER)
        // =========================================================================
        GameObject vfxRoot = new GameObject("--- 3_CINEMATIC_VFX ---");

        // 1. Live Electrical Conduit Sparks on South Partition Wall
        GameObject sparkGO = InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/ElectricalSparks.prefab",
            "VFX_Electrical_Sparks_Conduit_Breach", vfxRoot.transform, new Vector3(-9.2f, 2.8f, -9.8f), new Vector3(0f, 0f, 45f), Vector3.one);
        if (sparkGO == null)
        {
            InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/ElectricalSparksEffect.prefab",
                "VFX_Electrical_Sparks_Conduit_Breach", vfxRoot.transform, new Vector3(-9.2f, 2.8f, -9.8f), new Vector3(0f, 0f, 45f), Vector3.one);
        }

        // 2. High-Pressure Pressurized Steam Jet on TK-03A Pressure Relief Valve
        InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/PressurisedSteam.prefab",
            "VFX_Pressurized_Steam_PRV_Vent", vfxRoot.transform, new Vector3(10.8f, 7.45f, 19.5f), new Vector3(-45f, 90f, 0f), new Vector3(0.8f, 0.8f, 0.8f));

        // 3. Poison Gas Vapor Cloud over Chemical Leak
        InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/PoisonGas.prefab",
            "VFX_Poison_Gas_Vapor_Swirl", vfxRoot.transform, new Vector3(0.5f, 0.8f, 7.0f), Vector3.zero, new Vector3(1.2f, 1.2f, 1.2f));

        // 4. Heat Distortion Refraction Shimmer over Fire Rupture
        InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/HeatDistortion.prefab",
            "VFX_Heat_Distortion_Shimmer", vfxRoot.transform, new Vector3(1.6f, 0.8f, 8.2f), Vector3.zero, new Vector3(1.5f, 1.5f, 1.5f));

        // 5. Active Water Shower in Decontamination Station
        InstantiateVfxPrefab("Assets/EffectExamples/WaterEffects/Prefabs/Shower.prefab",
            "VFX_Decon_Active_Shower_Spray", vfxRoot.transform, new Vector3(4.0f, 2.8f, -5.0f), Vector3.zero, new Vector3(0.7f, 0.7f, 0.7f));

        // 6. Ground Fog & Dust Motes
        InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/GroundFog.prefab",
            "VFX_GroundFog_Bay03_Center", vfxRoot.transform, new Vector3(0f, 0.05f, 8f), Vector3.zero, new Vector3(3f, 1f, 2.5f));

        GameObject dustW = InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/DustMotesEffect.prefab",
            "VFX_DustMotes_Bay03_Warehouse", vfxRoot.transform, new Vector3(0f, 3.5f, 7.5f), Vector3.zero, new Vector3(3f, 2.5f, 3.5f));
        if (dustW != null) ApplySmokeTexture(dustW, matDustMotes);

        InstantiateVfxPrefab("Assets/EffectExamples/FireExplosionEffects/Prefabs/MediumFlames.prefab",
            "VFX_Flames_ChemicalRupture", vfxRoot.transform, new Vector3(1.6f, 0.05f, 8.2f), Vector3.zero, new Vector3(0.85f, 0.85f, 0.85f));

        // =========================================================================
        // J. BOUNDLESS MULTI-COLOR VIBRANT LIGHTING ARCHITECTURE (BAY 03)
        // =========================================================================
        GameObject lightGroup = new GameObject("--- 4_BOUNDLESS_VIBRANT_LIGHTING ---");

        // 1. Primary Directional Sun Light
        GameObject sunGO = new GameObject("Directional_Primary_Sunlight");
        sunGO.transform.SetParent(lightGroup.transform);
        var sunLight = sunGO.AddComponent<Light>();
        sunLight.type = LightType.Directional;
        sunLight.intensity = 1.15f;
        sunLight.color = new Color(0.92f, 0.95f, 1.0f);
        sunLight.shadows = LightShadows.Soft;
        sunLight.shadowStrength = 0.65f;
        sunGO.transform.rotation = Quaternion.Euler(52f, -32f, 0f);

        // 2. Boundless Upward Ambient Bounce Fill Light
        GameObject bounceGO = new GameObject("Directional_Boundless_Ambient_Bounce");
        bounceGO.transform.SetParent(lightGroup.transform);
        var bounceLight = bounceGO.AddComponent<Light>();
        bounceLight.type = LightType.Directional;
        bounceLight.intensity = 0.55f;
        bounceLight.color = new Color(0.85f, 0.88f, 0.95f);
        bounceLight.shadows = LightShadows.None;
        bounceGO.transform.rotation = Quaternion.Euler(-60f, 145f, 0f);

        // 3. Full-Grid High-Bay Volumetric Conical Luminaires Matrix (10 Fixtures covering all 4 quadrants)
        GameObject luminairesGroup = new GameObject("HIGH_BAY_BOUNDLESS_VOLUMETRIC_LUMINAIRES");
        luminairesGroup.transform.SetParent(lightGroup.transform);

        void SpawnHighBayLuminaire(string name, Vector3 pos, Color color, float intensity, float spotAngle, Texture2D cookie, Material coneMat)
        {
            GameObject lumGO = new GameObject(name);
            lumGO.transform.SetParent(luminairesGroup.transform, false);
            lumGO.transform.position = pos;
            lumGO.transform.rotation = Quaternion.Euler(90f, 0f, 0f);

            CreatePrim(PrimitiveType.Cylinder, $"{name}_Bell_Housing", lumGO.transform,
                pos + new Vector3(0f, 0.25f, 0f), Vector3.zero, new Vector3(0.75f, 0.25f, 0.75f), matDarkFloor, false, true);
            CreatePrim(PrimitiveType.Cylinder, $"{name}_Emissive_Lens", lumGO.transform,
                pos + new Vector3(0f, 0.12f, 0f), Vector3.zero, new Vector3(0.60f, 0.04f, 0.60f), matStainless, false, true);

            var spotLight = lumGO.AddComponent<Light>();
            spotLight.type = LightType.Spot;
            spotLight.spotAngle = spotAngle;
            spotLight.innerSpotAngle = spotAngle * 0.65f;
            spotLight.range = 16f;
            spotLight.intensity = intensity;
            spotLight.color = color;
            spotLight.shadows = LightShadows.Soft;
            spotLight.shadowStrength = 0.75f;
            if (cookie != null) spotLight.cookie = cookie;

            if (coneMat != null)
            {
                float botRad = Mathf.Tan(spotAngle * 0.5f * Mathf.Deg2Rad) * 7.2f;
                SpawnVolumetricCone($"{name}_Volumetric_Cone", lumGO.transform,
                    pos, topRadius: 0.38f, bottomRadius: Mathf.Max(botRad, 2.9f), height: 7.2f, coneMat, segments: 28);
            }
        }

        SpawnHighBayLuminaire("Luminaire_Staging_West", new Vector3(-6.0f, 7.3f, -14.0f), new Color(1.0f, 0.88f, 0.65f), 4.2f, 62f, cookieLouver, matVolumetricCone);
        SpawnHighBayLuminaire("Luminaire_Staging_East", new Vector3(6.0f, 7.3f, -14.0f), new Color(0.92f, 0.96f, 1.0f), 4.2f, 62f, cookieLouver, matVolumetricSkylight);

        SpawnHighBayLuminaire("Luminaire_Threshold_West", new Vector3(-8.0f, 7.3f, -4.0f), new Color(0.15f, 0.85f, 1.0f), 4.8f, 60f, cookieCage, matVolumetricSkylight);
        SpawnHighBayLuminaire("Luminaire_Threshold_East", new Vector3(8.0f, 7.3f, -4.0f), new Color(0.95f, 0.25f, 0.85f), 4.8f, 60f, cookieCage, matVolumetricSkylight);

        SpawnHighBayLuminaire("Luminaire_MidBay_West_Drums", new Vector3(-8.0f, 7.3f, 6.0f), new Color(0.10f, 0.90f, 1.0f), 5.2f, 64f, cookieCage, matVolumetricSkylight);
        SpawnHighBayLuminaire("Luminaire_MidBay_CoreHazard", new Vector3(0.0f, 7.3f, 6.0f), new Color(0.55f, 1.0f, 0.15f), 5.4f, 68f, cookieLouver, matVolumetricToxic);
        SpawnHighBayLuminaire("Luminaire_MidBay_East_Drums", new Vector3(8.0f, 7.3f, 6.0f), new Color(1.0f, 0.35f, 0.15f), 5.2f, 64f, cookieCage, matVolumetricCone);

        SpawnHighBayLuminaire("Luminaire_DeepBay_West", new Vector3(-8.0f, 7.3f, 16.0f), new Color(0.20f, 0.85f, 1.0f), 4.8f, 60f, cookieCage, matVolumetricSkylight);
        SpawnHighBayLuminaire("Luminaire_DeepBay_East_TK03A", new Vector3(8.0f, 7.3f, 16.0f), new Color(0.70f, 0.30f, 1.0f), 5.2f, 66f, cookieLouver, matVolumetricCone);
        SpawnHighBayLuminaire("Luminaire_RearPerimeter_Center", new Vector3(0.0f, 7.3f, 24.0f), new Color(0.95f, 0.85f, 0.35f), 4.6f, 64f, cookieLouver, matVolumetricCone);

        // 4. Overhead Perimeter Glowing Multi-Color Neon LED Ribbons
        GameObject ribbonGroup = new GameObject("OVERHEAD_PERIMETER_NEON_LED_RIBBONS");
        ribbonGroup.transform.SetParent(lightGroup.transform);

        void SpawnLedStrip(string name, Vector3 pos, Vector3 rot, Vector3 scale, Material stripMat, Color lightCol, float lightIntensity)
        {
            GameObject stripGO = CreatePrim(PrimitiveType.Cube, name, ribbonGroup.transform, pos, rot, scale, stripMat, false, true);
            GameObject ptLightGO = new GameObject($"{name}_GlowLight");
            ptLightGO.transform.SetParent(stripGO.transform, false);
            ptLightGO.transform.position = pos;
            var pt = ptLightGO.AddComponent<Light>();
            pt.type = LightType.Point;
            pt.range = 9.0f;
            pt.intensity = lightIntensity;
            pt.color = lightCol;
        }

        SpawnLedStrip("LED_Strip_West_Wall_Cyan", new Vector3(-14.7f, 7.5f, 7.5f), Vector3.zero, new Vector3(0.12f, 0.08f, 34f), matLedCyan, new Color(0.05f, 0.88f, 1.0f), 1.8f);
        SpawnLedStrip("LED_Strip_East_Wall_Magenta", new Vector3(14.7f, 7.5f, 7.5f), Vector3.zero, new Vector3(0.12f, 0.08f, 34f), matLedMagenta, new Color(1.0f, 0.15f, 0.85f), 1.8f);
        SpawnLedStrip("LED_Strip_North_Wall_Amber", new Vector3(0.0f, 7.5f, 24.7f), Vector3.zero, new Vector3(29f, 0.08f, 0.12f), matLedAmber, new Color(1.0f, 0.70f, 0.15f), 2.0f);
        SpawnLedStrip("LED_Strip_South_Partition_Lime", new Vector3(0.0f, 7.5f, -9.7f), Vector3.zero, new Vector3(20f, 0.08f, 0.12f), matLedLime, new Color(0.25f, 1.0f, 0.20f), 2.0f);

        // 5. Rich Multi-Color Accent Highlights
        GameObject tankUplightGO = new GameObject("Light_TK03A_Indigo_Uplight");
        tankUplightGO.transform.SetParent(lightGroup.transform);
        var tUp = tankUplightGO.AddComponent<Light>();
        tUp.type = LightType.Spot;
        tUp.spotAngle = 75f;
        tUp.range = 14f;
        tUp.intensity = 4.5f;
        tUp.color = new Color(0.60f, 0.10f, 1.0f);
        tankUplightGO.transform.position = new Vector3(10.5f, 0.6f, 16.5f);
        tankUplightGO.transform.rotation = Quaternion.Euler(-55f, 0f, 0f);

        GameObject trussLightGO = new GameObject("Light_RoofTruss_Magenta_Accent");
        trussLightGO.transform.SetParent(lightGroup.transform);
        var trLight = trussLightGO.AddComponent<Light>();
        trLight.type = LightType.Point;
        trLight.range = 32f;
        trLight.intensity = 2.6f;
        trLight.color = new Color(0.95f, 0.10f, 0.80f);
        trussLightGO.transform.position = new Vector3(0f, 7.2f, 7.5f);

        GameObject spillGlowGO = new GameObject("Light_ChemicalReaction_CoreGlow");
        spillGlowGO.transform.SetParent(lightGroup.transform);
        var spLight = spillGlowGO.AddComponent<Light>();
        spLight.type = LightType.Point;
        spLight.range = 12.0f;
        spLight.intensity = 3.8f;
        spLight.color = new Color(0.40f, 1.0f, 0.05f);
        spillGlowGO.transform.position = new Vector3(0.5f, 0.4f, 7.0f);

        // Electrical Spark Arc Light
        GameObject sparkLightGO = new GameObject("Light_ElectricalArc_Flicker");
        sparkLightGO.transform.SetParent(lightGroup.transform);
        var sLight = sparkLightGO.AddComponent<Light>();
        sLight.type = LightType.Point;
        sLight.range = 10f;
        sLight.intensity = 3.5f;
        sLight.color = new Color(0.3f, 0.7f, 1.0f);
        sparkLightGO.transform.position = new Vector3(-9.2f, 2.8f, -9.8f);
        sparkLightGO.AddComponent<LightFlicker>();

        // 6. Real-Time High-Fidelity Reflection Probes Array
        GameObject probeGroup = new GameObject("ENVIRONMENT_REFLECTION_PROBES");
        probeGroup.transform.SetParent(lightGroup.transform);

        void SpawnReflectionProbe(string name, Vector3 pos, Vector3 size)
        {
            GameObject pGO = new GameObject(name);
            pGO.transform.SetParent(probeGroup.transform, false);
            pGO.transform.position = pos;
            var probe = pGO.AddComponent<ReflectionProbe>();
            probe.mode = ReflectionProbeMode.Realtime;
            probe.refreshMode = ReflectionProbeRefreshMode.OnAwake;
            probe.timeSlicingMode = ReflectionProbeTimeSlicingMode.AllFacesAtOnce;
            probe.size = size;
            probe.intensity = 1.2f;
        }

        SpawnReflectionProbe("Probe_Bay03_Warehouse_Center", new Vector3(0f, 2.5f, 7.5f), new Vector3(32f, 9f, 36f));
        SpawnReflectionProbe("Probe_PPE_Staging_SafeZone", new Vector3(0f, 2.5f, -15.5f), new Vector3(22f, 9f, 13f));
        SpawnReflectionProbe("Probe_Hazard_ChemicalSpill", new Vector3(0.5f, 1.5f, 7.0f), new Vector3(10f, 5f, 10f));
        SpawnReflectionProbe("Probe_Decon_DelugePlatform", new Vector3(4.0f, 2.0f, -5.0f), new Vector3(8f, 6f, 8f));

        // 7. Post-Processing Cinematic Volume
        GameObject ppGO = new GameObject("System_PostProcessing");
        ppGO.transform.SetParent(lightGroup.transform);
        ppGO.AddComponent<PostProcessingController>();
        var ppVol = ppGO.AddComponent<Volume>();
        ppVol.isGlobal = true;

        // =========================================================================
        // K. FIRST-PERSON RESPONDER PLAYER CHARACTER (WITH SHOULDER WORKLIGHT)
        // =========================================================================
        GameObject playerRoot = new GameObject("Player_FirstPersonResponder");
        playerRoot.transform.position = new Vector3(0f, 1.0f, -18.0f);
        playerRoot.transform.rotation = Quaternion.identity;

        var cc = playerRoot.AddComponent<CharacterController>();
        cc.radius = 0.3f;
        cc.height = 1.8f;
        cc.center = new Vector3(0f, 0.9f, 0f);
        cc.stepOffset = 0.5f;
        cc.slopeLimit = 60f;
        cc.skinWidth = 0.03f;
        cc.minMoveDistance = 0f;

        GameObject headGO = new GameObject("Player_Head_CameraRig");
        headGO.transform.SetParent(playerRoot.transform, false);
        headGO.transform.localPosition = new Vector3(0f, 1.65f, 0f);

        var playerCam = headGO.AddComponent<Camera>();
        playerCam.nearClipPlane = 0.05f;
        playerCam.farClipPlane = 120f;
        playerCam.fieldOfView = 75f;
        playerCam.clearFlags = CameraClearFlags.Skybox;
        headGO.AddComponent<AudioListener>();

        var urpCamData = headGO.AddComponent<UniversalAdditionalCameraData>();
        urpCamData.renderPostProcessing = true;

        // High-CRI Tactical Worklight / Shoulder Headlamp mounted on Player Rig
        GameObject playerWorklightGO = new GameObject("Player_Tactical_Shoulder_Worklight");
        playerWorklightGO.transform.SetParent(headGO.transform, false);
        playerWorklightGO.transform.localPosition = new Vector3(0.2f, -0.1f, 0.2f);
        var worklight = playerWorklightGO.AddComponent<Light>();
        worklight.type = LightType.Spot;
        worklight.spotAngle = 55f;
        worklight.innerSpotAngle = 35f;
        worklight.range = 22f;
        worklight.intensity = 2.4f;
        worklight.color = new Color(0.96f, 0.98f, 1.0f);
        worklight.shadows = LightShadows.Soft;
        worklight.shadowStrength = 0.65f;

        var charCtrl = playerRoot.AddComponent<FirstPersonResponderController>();
        charCtrl.walkSpeed = 4.2f;
        charCtrl.sprintSpeed = 6.8f;
        charCtrl.mouseSensitivity = 2.4f;

        var pAudio = playerRoot.AddComponent<AudioSource>();
        pAudio.playOnAwake = false;
        pAudio.spatialBlend = 0f;
        charCtrl.respiratorBreathingSource = pAudio;

        // HUD Tactical Manager
        GameObject hudGO = new GameObject("HUD_Tactical_Manager");
        hudGO.AddComponent<HudManager>();

        // Game Manager & Event Logger
        GameObject gmGO = new GameObject("GameManager_System");
        gmGO.AddComponent<GameManager>();
        gmGO.AddComponent<CbrsEventLogger>();

        // =========================================================================
        // L. TACTICAL MULTI-CAMERA RIG SYSTEM (CCTV & FACILITY ANGLES)
        // =========================================================================
        GameObject multiCamRoot = new GameObject("--- 5_TACTICAL_MULTI_CAMERA_SYSTEM ---");
        var multiCamCtrl = multiCamRoot.AddComponent<MultiCameraController>();

        Camera CreateCctvCamera(string name, Vector3 pos, Vector3 targetPos, float fov)
        {
            GameObject cCamGO = new GameObject(name);
            cCamGO.transform.SetParent(multiCamRoot.transform, false);
            cCamGO.transform.position = pos;
            cCamGO.transform.LookAt(targetPos);

            var cam = cCamGO.AddComponent<Camera>();
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 110f;
            cam.fieldOfView = fov;
            cam.clearFlags = CameraClearFlags.Skybox;

            var camUrp = cCamGO.AddComponent<UniversalAdditionalCameraData>();
            camUrp.renderPostProcessing = true;

            CreatePrim(PrimitiveType.Sphere, $"{name}_Housing_Dome", cCamGO.transform,
                pos, Vector3.zero, new Vector3(0.28f, 0.28f, 0.28f), matDarkFloor, false, true);
            CreatePrim(PrimitiveType.Cylinder, $"{name}_Mount_Arm", cCamGO.transform,
                pos + new Vector3(0f, 0.18f, 0f), Vector3.zero, new Vector3(0.08f, 0.35f, 0.08f), matSteel, false, true);

            return cam;
        }

        multiCamCtrl.playerFpsCamera = playerCam;

        multiCamCtrl.cctvOverviewCamera = CreateCctvCamera("CCTV_01_StorageBay03_Overview",
            new Vector3(-13.0f, 6.8f, -7.5f), new Vector3(0f, 1.2f, 8.0f), 72f);

        multiCamCtrl.cctvHazardCloseupCamera = CreateCctvCamera("CCTV_02_Hazard_Spill_Closeup",
            new Vector3(3.4f, 2.6f, 4.2f), new Vector3(0.5f, 0.7f, 7.0f), 60f);

        multiCamCtrl.cctvDeconCamera = CreateCctvCamera("CCTV_03_Decon_Deluge_Station",
            new Vector3(4.0f, 4.4f, -2.0f), new Vector3(4.0f, 1.4f, -5.0f), 65f);

        multiCamCtrl.cctvHighBayCamera = CreateCctvCamera("CCTV_04_HighBay_Crane_Panoramic",
            new Vector3(0.0f, 7.8f, 7.5f), new Vector3(0.0f, 0.0f, 8.0f), 85f);

        multiCamCtrl.cctvStagingCamera = CreateCctvCamera("CCTV_05_PPE_Staging_Depot",
            new Vector3(-0.8f, 3.4f, -11.5f), new Vector3(-3.3f, 1.0f, -14.0f), 65f);

        multiCamCtrl.RefreshCameraList();

        // Save Clean Bay 03 Scene
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene, "Assets/Scenes/StorageBay03_Training.unity");
        Debug.Log("<color=#00FF66><b>[CBRS-X] Highly Dynamic Bay 03 Scene Recreated & Saved to Assets/Scenes/StorageBay03_Training.unity!</b></color>");
    }

    /// <summary>
    /// Ensures Textured Rough Brown Cargo PBR material is configured and ready.
    /// </summary>
    public static void EnsurePbrCargoTexturesAndMaterials()
    {
        string matCargoPath = "Assets/Mat_CargoRoughBrown.mat";
        Material matCargo = AssetDatabase.LoadAssetAtPath<Material>(matCargoPath);
        if (matCargo == null)
        {
            matCargo = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            AssetDatabase.CreateAsset(matCargo, matCargoPath);
        }

        Texture2D albedoTex = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Textures/Generated/Tex_CargoRoughBrown_Albedo.png");
        Texture2D normalTex = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/Textures/Generated/Tex_CargoRoughBrown_Normal.png");

        if (albedoTex != null) matCargo.SetTexture("_BaseMap", albedoTex);
        if (normalTex != null)
        {
            matCargo.SetTexture("_BumpMap", normalTex);
            matCargo.EnableKeyword("_NORMALMAP");
            matCargo.SetFloat("_BumpScale", 1.35f);
        }
        matCargo.SetFloat("_Smoothness", 0.28f);
        matCargo.SetFloat("_Metallic", 0.02f);
        EditorUtility.SetDirty(matCargo);
        AssetDatabase.SaveAssets();
    }
}
