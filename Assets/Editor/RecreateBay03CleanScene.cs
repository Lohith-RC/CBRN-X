using System.Collections.Generic;
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
    public static void RecreateScene()
    {
        Debug.Log("<color=#00FF66><b>[CBRS-X] Recreating Clean Storage Bay 03 Training Scene (Cinematic Chemical Disaster Overhaul)...</b></color>");

        // 1. Create a brand new, empty scene
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

        // VFX Textured Materials
        Material matSmokeRising = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_Smoke_RisingPlume.mat");
        Material matSmokeWispy = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_Smoke_WispyDrift.mat");
        Material matSmokeToxic = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_Smoke_ToxicHazard.mat");
        Material matSmokeDark = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_TexturedSmoke_Dark.mat");
        Material matDustMotes = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_DustMotes_Textured.mat");
        Material matWarFxSmoke = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_URP_WarFX_SmokeAlpha.mat");

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

        GameObject InstantiateVfxPrefab(string path, string name, Transform parent, Vector3 pos, Vector3 rot, Vector3 scale)
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (prefab == null)
            {
                Debug.LogWarning($"[CBRS-X VFX] Prefab missing at {path}");
                return null;
            }

            GameObject go = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            if (go == null)
            {
                go = Object.Instantiate(prefab);
            }

            go.name = name;
            if (parent != null) go.transform.SetParent(parent, false);
            go.transform.position = pos;
            go.transform.eulerAngles = rot;
            go.transform.localScale = scale;

            // Strip any colliders from VFX so they never block player movement
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
        // A. INDUSTRIAL ARCHITECTURE & HIGH-DETAIL STRUCTURE
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

        // 5. Overhead Roof Trusses & Triangular Web Struts (High Geometric Detail)
        GameObject trussGroup = new GameObject("OVERHEAD_STRUCTURAL_ROOF_TRUSSES");
        trussGroup.transform.SetParent(envRoot.transform);
        float[] trussZPositions = new float[] { -8f, -1f, 6f, 13f, 20f, 27f };
        foreach (float tz in trussZPositions)
        {
            // Upper Chord
            CreatePrim(PrimitiveType.Cube, $"Truss_Upper_{tz}", trussGroup.transform,
                new Vector3(0f, 8.0f, tz), Vector3.zero, new Vector3(29.6f, 0.25f, 0.35f), matTrussSteel != null ? matTrussSteel : matSteel, false, true);
            // Lower Chord
            CreatePrim(PrimitiveType.Cube, $"Truss_Lower_{tz}", trussGroup.transform,
                new Vector3(0f, 7.3f, tz), Vector3.zero, new Vector3(29.6f, 0.25f, 0.35f), matTrussSteel != null ? matTrussSteel : matSteel, false, true);
            // Vertical & Diagonal Struts
            for (float tx = -13.5f; tx <= 13.5f; tx += 3.0f)
            {
                CreatePrim(PrimitiveType.Cube, $"Truss_Post_{tz}_{tx}", trussGroup.transform,
                    new Vector3(tx, 7.65f, tz), Vector3.zero, new Vector3(0.18f, 0.7f, 0.2f), matSteel, false, true);
                CreatePrim(PrimitiveType.Cube, $"Truss_Diag_{tz}_{tx}", trussGroup.transform,
                    new Vector3(tx + 1.5f, 7.65f, tz), new Vector3(0f, 0f, 25f), new Vector3(0.14f, 0.82f, 0.15f), matSteel, false, true);
            }
        }

        // 6. Overhead Industrial Ventilation Ductwork with Exhaust Louvers
        GameObject ductGroup = new GameObject("OVERHEAD_HVAC_VENTILATION_NETWORK");
        ductGroup.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cylinder, "Duct_Main_Spine", ductGroup.transform,
            new Vector3(0f, 7.1f, 7.5f), new Vector3(90f, 0f, 0f), new Vector3(0.9f, 17.5f, 0.9f), matSteel, false, true);
        for (float dz = -4f; dz <= 20f; dz += 8f)
        {
            CreatePrim(PrimitiveType.Cube, $"Duct_Exhaust_Louver_{dz}", ductGroup.transform,
                new Vector3(0f, 6.55f, dz), Vector3.zero, new Vector3(1.1f, 0.3f, 1.1f), matDarkFloor, false, true);
        }

        // 7. Facility Signboard & Digital LED Hazard Status Telemetry Panel
        GameObject signGroup = new GameObject("OVERHEAD_BAY3_FACILITY_SIGN");
        signGroup.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cube, "Sign_Panel", signGroup.transform,
            new Vector3(0f, 5.8f, -9.8f), Vector3.zero, new Vector3(9.0f, 1.2f, 0.1f), matWall, false, true);
        CreatePrim(PrimitiveType.Cube, "Sign_Trim_Top", signGroup.transform,
            new Vector3(0f, 6.45f, -9.8f), Vector3.zero, new Vector3(9.2f, 0.1f, 0.15f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Sign_Trim_Bottom", signGroup.transform,
            new Vector3(0f, 5.15f, -9.8f), Vector3.zero, new Vector3(9.2f, 0.1f, 0.15f), matSteel, false, true);

        GameObject signTextGO = new GameObject("Sign_Text_TMPro");
        signTextGO.transform.SetParent(signGroup.transform);
        signTextGO.transform.position = new Vector3(0f, 5.8f, -9.9f);
        signTextGO.transform.rotation = Quaternion.Euler(0, 180, 0);
        var signTmp = signTextGO.AddComponent<TextMeshPro>();
        signTmp.text = "BAY 3: HAZMAT STORAGE & DECONTAMINATION";
        signTmp.fontSize = 6.2f;
        signTmp.alignment = TextAlignmentOptions.Center;
        signTmp.color = new Color(0.1f, 0.1f, 0.1f, 1f);
        signTmp.fontStyle = FontStyles.Bold;

        // Digital LED Hazard Telemetry Status Panel on Entry Wall
        GameObject statusPanelGO = CreatePrim(PrimitiveType.Cube, "STATUS_PANEL_DIGITAL_MONITOR", envRoot.transform,
            new Vector3(4.5f, 2.2f, -9.75f), Vector3.zero, new Vector3(1.8f, 1.0f, 0.12f), matStatusPanel != null ? matStatusPanel : matSteel);

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

        // 9. Pallet Racking with Diverse Cargo & Heavy Protection Bollards
        GameObject racksGroup = new GameObject("WAREHOUSE_PALLET_RACKING");
        racksGroup.transform.SetParent(envRoot.transform);
        void SpawnPalletRack(Vector3 basePos, float length, int tiers)
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
                    
                    // Cargo variety: Chemical Boxes vs Drums
                    if ((c + t) % 2 == 0)
                    {
                        CreatePrim(PrimitiveType.Cube, $"CargoBox_Rack_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.60f, pz), Vector3.zero, new Vector3(0.85f, 0.85f, 0.85f), matChemicalBox != null ? matChemicalBox : matOrange, false, true);
                    }
                    else
                    {
                        CreatePrim(PrimitiveType.Cylinder, $"Drum_Rack_T{t}_{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.60f, pz), Vector3.zero, new Vector3(0.6f, 0.45f, 0.6f), matDrumBlue, false, true);
                    }
                }
            }

            // Safety Yellow Steel Protection Bollards at Rack Corners
            CreatePrim(PrimitiveType.Cylinder, $"Bollard_Front_{basePos.x}", racksGroup.transform,
                new Vector3(basePos.x + 0.4f, 0.5f, basePos.z - 0.4f), Vector3.zero, new Vector3(0.25f, 0.5f, 0.25f), matBermYellow != null ? matBermYellow : matYellow);
            CreatePrim(PrimitiveType.Cylinder, $"Bollard_Back_{basePos.x}", racksGroup.transform,
                new Vector3(basePos.x + 0.4f, 0.5f, basePos.z + length + 0.4f), Vector3.zero, new Vector3(0.25f, 0.5f, 0.25f), matBermYellow != null ? matBermYellow : matYellow);
        }
        SpawnPalletRack(new Vector3(-12.5f, 0f, -4f), 20f, 3);
        SpawnPalletRack(new Vector3(13.7f, 0f, -4f), 20f, 3);

        // 10. 1000L Chemical IBC Tote Bulk Containers
        GameObject ibcGroup = new GameObject("BULK_IBC_TOTE_CONTAINERS");
        ibcGroup.transform.SetParent(envRoot.transform);
        void SpawnIBCTote(Vector3 pos, float rotY)
        {
            GameObject tote = new GameObject("IBC_1000L_Container");
            tote.transform.SetParent(ibcGroup.transform);
            tote.transform.position = pos;
            tote.transform.eulerAngles = new Vector3(0f, rotY, 0f);

            CreatePrim(PrimitiveType.Cube, "Tote_PalletBase", tote.transform, pos + new Vector3(0f, 0.08f, 0f), new Vector3(0f, rotY, 0f), new Vector3(1.25f, 0.15f, 1.25f), matPallet, false, true);
            CreatePrim(PrimitiveType.Cube, "Tote_CagedTank", tote.transform, pos + new Vector3(0f, 0.72f, 0f), new Vector3(0f, rotY, 0f), new Vector3(1.15f, 1.15f, 1.15f), matIBCTote != null ? matIBCTote : matGreen);
            CreatePrim(PrimitiveType.Cylinder, "Tote_TopLid", tote.transform, pos + new Vector3(0f, 1.32f, 0f), new Vector3(0f, rotY, 0f), new Vector3(0.35f, 0.05f, 0.35f), matRed, false, true);
            CreatePrim(PrimitiveType.Cylinder, "Tote_DrainValve", tote.transform, pos + new Vector3(0f, 0.25f, 0.6f), new Vector3(90f, rotY, 0f), new Vector3(0.12f, 0.1f, 0.12f), matSteel, false, true);
        }
        SpawnIBCTote(new Vector3(10.5f, 0f, 11.5f), 15f);
        SpawnIBCTote(new Vector3(10.5f, 0f, 13.2f), -10f);
        SpawnIBCTote(new Vector3(-9.5f, 0f, 17.5f), 45f);

        // 11. Overhead Industrial Piping Network
        GameObject pipeGroup = new GameObject("OVERHEAD_PIPING_NETWORK");
        pipeGroup.transform.SetParent(envRoot.transform);
        CreatePrim(PrimitiveType.Cylinder, "Pipe_Chlorine_Yellow", pipeGroup.transform,
            new Vector3(-6.0f, 6.8f, 7.5f), new Vector3(90f, 0f, 0f), new Vector3(0.25f, 17.5f, 0.25f), matPipeChlorine != null ? matPipeChlorine : matYellow, false, true);
        CreatePrim(PrimitiveType.Cylinder, "Pipe_Nitrogen_Red", pipeGroup.transform,
            new Vector3(-5.5f, 6.8f, 7.5f), new Vector3(90f, 0f, 0f), new Vector3(0.20f, 17.5f, 0.20f), matPipeNitrogen != null ? matPipeNitrogen : matRed, false, true);
        CreatePrim(PrimitiveType.Cylinder, "Pipe_Water_Green", pipeGroup.transform,
            new Vector3(6.0f, 6.8f, 7.5f), new Vector3(90f, 0f, 0f), new Vector3(0.25f, 17.5f, 0.25f), matPipeWater != null ? matPipeWater : matGreen, false, true);

        // =========================================================================
        // B. LEVEL-B PPE STAGING WORKBENCH & ADVANCED RESCUE GEAR DEPOT
        // =========================================================================
        GameObject ppeStationGroup = new GameObject("PPE_HeavyDuty_Workbench");
        ppeStationGroup.transform.SetParent(envRoot.transform);
        ppeStationGroup.transform.position = new Vector3(-3.30f, 0f, -14.0f);

        CreatePrim(PrimitiveType.Cube, "Table_Top_Stainless", ppeStationGroup.transform,
            new Vector3(-3.30f, 0.92f, -14.0f), Vector3.zero, new Vector3(2.8f, 0.1f, 1.2f), matStainless);
        CreatePrim(PrimitiveType.Cube, "Table_Lower_Shelf", ppeStationGroup.transform,
            new Vector3(-3.30f, 0.25f, -14.0f), Vector3.zero, new Vector3(2.6f, 0.06f, 1.0f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Table_Leg_FL", ppeStationGroup.transform,
            new Vector3(-4.50f, 0.45f, -14.50f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Table_Leg_FR", ppeStationGroup.transform,
            new Vector3(-2.10f, 0.45f, -14.50f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Table_Leg_BL", ppeStationGroup.transform,
            new Vector3(-4.50f, 0.45f, -13.50f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Table_Leg_BR", ppeStationGroup.transform,
            new Vector3(-2.10f, 0.45f, -13.50f), Vector3.zero, new Vector3(0.08f, 0.9f, 0.08f), matSteel);

        var ppeComp = ppeStationGroup.AddComponent<PpeStation>();
        var ppeAudio = ppeStationGroup.AddComponent<AudioSource>();
        ppeAudio.playOnAwake = false;
        ppeAudio.spatialBlend = 0.5f;
        ppeComp.ppeAudioSource = ppeAudio;

        // Visual PPE Items on Workbench
        CreatePrim(PrimitiveType.Cube, "PPE_HazmatSuit_Vest", ppeStationGroup.transform,
            new Vector3(-4.0f, 1.05f, -14.0f), new Vector3(0f, 20f, 0f), new Vector3(0.45f, 0.15f, 0.4f), matOrange, true);
        CreatePrim(PrimitiveType.Sphere, "PPE_CBRN_RespiratorMask", ppeStationGroup.transform,
            new Vector3(-3.3f, 1.08f, -14.0f), new Vector3(0f, 0f, 0f), new Vector3(0.28f, 0.28f, 0.25f), matSteel, true);
        CreatePrim(PrimitiveType.Cube, "PPE_ChemicalGloves", ppeStationGroup.transform,
            new Vector3(-2.6f, 1.02f, -14.0f), new Vector3(0f, -15f, 0f), new Vector3(0.35f, 0.08f, 0.3f), matGreen, true);

        // High-Tech SCBA Air Tanks with Gauges on lower shelf
        CreatePrim(PrimitiveType.Cylinder, "SCBA_Tank_01", ppeStationGroup.transform,
            new Vector3(-4.0f, 0.40f, -14.0f), new Vector3(0f, 0f, 90f), new Vector3(0.22f, 0.45f, 0.22f), matSCBA != null ? matSCBA : matYellow, false, true);
        CreatePrim(PrimitiveType.Cylinder, "SCBA_Tank_02", ppeStationGroup.transform,
            new Vector3(-4.0f, 0.40f, -13.7f), new Vector3(0f, 0f, 90f), new Vector3(0.22f, 0.45f, 0.22f), matSCBA != null ? matSCBA : matYellow, false, true);

        // Rugged Yellow Pelican Tactical Gear Cases
        CreatePrim(PrimitiveType.Cube, "Pelican_Case_Tactical_Open", ppeStationGroup.transform,
            new Vector3(-2.6f, 0.42f, -13.9f), new Vector3(0f, 15f, 0f), new Vector3(0.55f, 0.3f, 0.45f), matPelican != null ? matPelican : matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "Pelican_Case_Floor_Stack", ppeStationGroup.transform,
            new Vector3(-1.3f, 0.22f, -14.0f), new Vector3(0f, -5f, 0f), new Vector3(0.65f, 0.42f, 0.5f), matPelican != null ? matPelican : matYellow, false, true);

        // Hanging Suit Stand Rack Next to Table
        GameObject suitRack = new GameObject("PPE_Hanging_Suit_Rack");
        suitRack.transform.SetParent(ppeStationGroup.transform);
        CreatePrim(PrimitiveType.Cube, "SuitRack_Post_L", suitRack.transform, new Vector3(-0.9f, 1.2f, -14.5f), Vector3.zero, new Vector3(0.06f, 2.4f, 0.06f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "SuitRack_Post_R", suitRack.transform, new Vector3(-0.9f, 1.2f, -13.5f), Vector3.zero, new Vector3(0.06f, 2.4f, 0.06f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "SuitRack_Bar", suitRack.transform, new Vector3(-0.9f, 2.3f, -14.0f), Vector3.zero, new Vector3(0.06f, 0.06f, 1.1f), matSteel, false, true);
        CreatePrim(PrimitiveType.Cube, "Hanging_Hazmat_Suit_01", suitRack.transform, new Vector3(-0.9f, 1.6f, -14.2f), Vector3.zero, new Vector3(0.2f, 1.2f, 0.35f), matOrange, false, true);
        CreatePrim(PrimitiveType.Cube, "Hanging_Hazmat_Suit_02", suitRack.transform, new Vector3(-0.9f, 1.6f, -13.8f), Vector3.zero, new Vector3(0.2f, 1.2f, 0.35f), matOrange, false, true);

        // Sign above workbench
        GameObject ppeSignTextGO = new GameObject("PPE_Bench_Text_TMPro");
        ppeSignTextGO.transform.SetParent(ppeStationGroup.transform);
        ppeSignTextGO.transform.position = new Vector3(-3.3f, 2.2f, -14.0f);
        ppeSignTextGO.transform.rotation = Quaternion.Euler(0, 180, 0);
        var ppeSignTmp = ppeSignTextGO.AddComponent<TextMeshPro>();
        ppeSignTmp.text = "<color=#FFCC00>DON LEVEL-B CBRN PPE</color>\n[E] / [CLICK] TO EQUIP";
        ppeSignTmp.fontSize = 3.5f;
        ppeSignTmp.alignment = TextAlignmentOptions.Center;

        // =========================================================================
        // C. CHEMICAL HAZARD DISASTER ZONE: SPILL BERM & 3D CORROSIVE CRATER
        // =========================================================================
        GameObject hazardZoneGroup = new GameObject("--- 2_CHEMICAL_HAZARD_ZONE ---");

        // Spill Containment Berm Enclosure (Bright Yellow Barrier)
        GameObject bermGroup = new GameObject("Spill_Containment_Berm_Barrier");
        bermGroup.transform.SetParent(hazardZoneGroup.transform);
        CreatePrim(PrimitiveType.Cube, "Berm_South", bermGroup.transform, new Vector3(0.5f, 0.06f, 4.8f), Vector3.zero, new Vector3(4.8f, 0.12f, 0.15f), matBermYellow != null ? matBermYellow : matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "Berm_North", bermGroup.transform, new Vector3(0.5f, 0.06f, 9.4f), Vector3.zero, new Vector3(4.8f, 0.12f, 0.15f), matBermYellow != null ? matBermYellow : matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "Berm_West", bermGroup.transform, new Vector3(-1.9f, 0.06f, 7.1f), Vector3.zero, new Vector3(0.15f, 0.12f, 4.6f), matBermYellow != null ? matBermYellow : matYellow, false, true);
        CreatePrim(PrimitiveType.Cube, "Berm_East", bermGroup.transform, new Vector3(2.9f, 0.06f, 7.1f), Vector3.zero, new Vector3(0.15f, 0.12f, 4.6f), matBermYellow != null ? matBermYellow : matYellow, false, true);

        // Leaking Primary Drum DRUM-02
        GameObject leakDrumGO = CreatePrim(PrimitiveType.Cylinder, "DRUM-02", hazardZoneGroup.transform,
            new Vector3(0.5f, 0.6f, 7.0f), Vector3.zero, new Vector3(0.7f, 0.6f, 0.7f), matDrumLeaking, true);

        CreatePrim(PrimitiveType.Cylinder, "BungCap", leakDrumGO.transform,
            new Vector3(0.5f, 1.22f, 7.15f), Vector3.zero, new Vector3(0.12f, 0.04f, 0.12f), matSteel, true);

        // Multi-Layered 3D Caustic Corrosive Chemical Reaction Spill Crater (Emissive)
        GameObject puddleGO = CreatePrim(PrimitiveType.Cylinder, "Chemical_Puddle_Decal", hazardZoneGroup.transform,
            new Vector3(0.5f, 0.02f, 7.0f), Vector3.zero, new Vector3(3.2f, 0.01f, 3.2f), matCorrosiveCrater != null ? matCorrosiveCrater : matDrumLeaking, true);

        // Inner Glowing Bioluminescent Reaction Core
        CreatePrim(PrimitiveType.Cylinder, "Chemical_Reaction_Core", hazardZoneGroup.transform,
            new Vector3(0.5f, 0.03f, 7.0f), Vector3.zero, new Vector3(1.6f, 0.01f, 1.6f), matCorrosiveCrater != null ? matCorrosiveCrater : matDrumLeaking, true);

        var drumAudio = leakDrumGO.AddComponent<AudioSource>();
        drumAudio.playOnAwake = true;
        drumAudio.loop = true;
        drumAudio.spatialBlend = 0.95f;
        drumAudio.maxDistance = 18f;

        var leakComp = leakDrumGO.AddComponent<LeakDrum>();
        leakComp.drumId = "DRUM-02";
        leakComp.isLeaking = true;
        leakComp.isContained = false;
        leakComp.chemicalPuddleDecal = puddleGO.transform;
        leakComp.ventingAudioSource = drumAudio;
        leakComp.drumRenderer = leakDrumGO.GetComponent<Renderer>();

        // Volumetric Poison Gas Plume Asset
        GameObject poisonGasVfx = InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/PoisonGas.prefab",
            "VFX_ToxicGas_Plume_Asset", leakDrumGO.transform, new Vector3(0.5f, 0.75f, 7.0f), Vector3.zero, new Vector3(0.9f, 0.9f, 0.9f));
        if (poisonGasVfx != null)
        {
            ApplySmokeTexture(poisonGasVfx, matSmokeToxic);
            var ps = poisonGasVfx.GetComponentInChildren<ParticleSystem>();
            if (ps != null)
            {
                leakComp.gasCloudParticleSystem = ps;
            }
        }

        // Secondary Surrounding Drums & Toppled Chemical Barrel
        CreatePrim(PrimitiveType.Cube, "Pallet_InertDrums", hazardZoneGroup.transform,
            new Vector3(2.6f, 0.08f, 7.0f), Vector3.zero, new Vector3(1.6f, 0.15f, 1.6f), matPallet, false, true);
        CreatePrim(PrimitiveType.Cylinder, "DRUM-01", hazardZoneGroup.transform,
            new Vector3(2.2f, 0.65f, 6.6f), Vector3.zero, new Vector3(0.65f, 0.55f, 0.65f), matDrumBlue);
        CreatePrim(PrimitiveType.Cylinder, "DRUM-03", hazardZoneGroup.transform,
            new Vector3(3.0f, 0.65f, 6.6f), Vector3.zero, new Vector3(0.65f, 0.55f, 0.65f), matDrumBlue);
        CreatePrim(PrimitiveType.Cylinder, "DRUM-04", hazardZoneGroup.transform,
            new Vector3(2.6f, 0.65f, 7.4f), Vector3.zero, new Vector3(0.65f, 0.55f, 0.65f), matDrumBlue);

        // Toppled Drum Rolled on side
        CreatePrim(PrimitiveType.Cylinder, "DRUM-Toppled-Over", hazardZoneGroup.transform,
            new Vector3(-0.9f, 0.32f, 6.2f), new Vector3(0f, 35f, 90f), new Vector3(0.65f, 0.55f, 0.65f), matDrumBlue, false, true);

        // Dynamic Glowing Chemical Reaction Light (Pulsing chartreuse glow on floor)
        GameObject chemGlowGO = new GameObject("Light_ChemicalReaction_Glow");
        chemGlowGO.transform.SetParent(hazardZoneGroup.transform);
        var chemLight = chemGlowGO.AddComponent<Light>();
        chemLight.type = LightType.Point;
        chemLight.range = 7.5f;
        chemLight.intensity = 2.2f;
        chemLight.color = new Color(0.65f, 1.0f, 0.15f);
        chemGlowGO.transform.position = new Vector3(0.5f, 0.4f, 7.0f);

        // =========================================================================
        // D. INCAPACITATED WORKER (CIVILIAN NPC)
        // =========================================================================
        GameObject civRoot = new GameObject("Civilian_Worker_Injured");
        civRoot.transform.SetParent(hazardZoneGroup.transform);
        civRoot.transform.position = new Vector3(-2.5f, 0.25f, 7.5f);

        CreatePrim(PrimitiveType.Capsule, "Civ_Torso", civRoot.transform,
            new Vector3(-2.5f, 0.35f, 7.5f), new Vector3(75f, 30f, 0f), new Vector3(0.35f, 0.45f, 0.35f), matOrange, true);
        CreatePrim(PrimitiveType.Sphere, "Civ_Head", civRoot.transform,
            new Vector3(-2.2f, 0.42f, 7.2f), Vector3.zero, new Vector3(0.28f, 0.28f, 0.28f), matSteel, true);
        CreatePrim(PrimitiveType.Capsule, "Civ_Legs", civRoot.transform,
            new Vector3(-2.8f, 0.2f, 7.8f), new Vector3(85f, 20f, 0f), new Vector3(0.25f, 0.5f, 0.25f), matOrange, true);

        var civComp = civRoot.AddComponent<Civilian>();
        civComp.civilianId = "CIV-WORKER-01";
        civComp.currentState = Civilian.TraumaState.DistressedTrapped;
        var civAudio = civRoot.AddComponent<AudioSource>();
        civAudio.spatialBlend = 0.85f;
        civComp.vocalAudioSource = civAudio;

        // =========================================================================
        // E. CONTAINMENT SEALANT TOOL STAND
        // =========================================================================
        GameObject kitStand = new GameObject("Containment_Tool_Stand");
        kitStand.transform.SetParent(envRoot.transform);
        kitStand.transform.position = new Vector3(3.5f, 0f, 5.5f);
        CreatePrim(PrimitiveType.Cube, "Stand_Base", kitStand.transform,
            new Vector3(3.5f, 0.45f, 5.5f), Vector3.zero, new Vector3(0.8f, 0.9f, 0.8f), matSteel);

        GameObject kitProp = CreatePrim(PrimitiveType.Cube, "ContainmentKit_Tool", kitStand.transform,
            new Vector3(3.5f, 1.0f, 5.5f), new Vector3(0f, 45f, 0f), new Vector3(0.35f, 0.2f, 0.25f), matRed, true);
        kitProp.AddComponent<ContainmentKit>();

        // =========================================================================
        // F. DECONTAMINATION DELUGE SHOWER STATION
        // =========================================================================
        GameObject deconGroup = new GameObject("Decontamination_Shower_Station");
        deconGroup.transform.SetParent(envRoot.transform);
        deconGroup.transform.position = new Vector3(4.0f, 0f, -5.0f);

        CreatePrim(PrimitiveType.Cube, "Decon_Arch_L", deconGroup.transform,
            new Vector3(2.5f, 1.8f, -5.0f), Vector3.zero, new Vector3(0.25f, 3.6f, 0.25f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Decon_Arch_R", deconGroup.transform,
            new Vector3(5.5f, 1.8f, -5.0f), Vector3.zero, new Vector3(0.25f, 3.6f, 0.25f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Decon_Arch_Top", deconGroup.transform,
            new Vector3(4.0f, 3.6f, -5.0f), Vector3.zero, new Vector3(3.25f, 0.25f, 0.35f), matYellow);
        CreatePrim(PrimitiveType.Cylinder, "Decon_ShowerHead", deconGroup.transform,
            new Vector3(4.0f, 3.4f, -5.0f), Vector3.zero, new Vector3(0.45f, 0.08f, 0.45f), matStainless);
        CreatePrim(PrimitiveType.Cube, "Decon_Platform_Grate", deconGroup.transform,
            new Vector3(4.0f, 0.04f, -5.0f), Vector3.zero, new Vector3(2.6f, 0.08f, 2.6f), matDarkFloor, false, true);

        GameObject deconTriggerGO = CreatePrim(PrimitiveType.Cube, "Decon_Trigger_Zone", deconGroup.transform,
            new Vector3(4.0f, 1.5f, -5.0f), Vector3.zero, new Vector3(2.8f, 3.0f, 2.8f), null, true, true);
        var deconCol = deconTriggerGO.AddComponent<BoxCollider>();
        deconCol.isTrigger = true;
        deconCol.size = new Vector3(2.8f, 3.0f, 2.8f);

        var deconComp = deconGroup.AddComponent<DeconStation>();
        var deconAudio = deconGroup.AddComponent<AudioSource>();
        deconComp.showerAudioSource = deconAudio;

        // Shower Deluge VFX from Project Assets
        GameObject showerVfx = InstantiateVfxPrefab("Assets/EffectExamples/WaterEffects/Prefabs/Shower.prefab",
            "VFX_DeconShower_Deluge", deconGroup.transform, new Vector3(4.0f, 3.35f, -5.0f), new Vector3(90f, 0f, 0f), Vector3.one);
        if (showerVfx != null)
        {
            var ps = showerVfx.GetComponentInChildren<ParticleSystem>();
            if (ps != null)
            {
                deconComp.overheadMistDelugeParticles = ps;
                ps.Stop();
            }
        }

        // =========================================================================
        // G. CINEMATIC ATMOSPHERIC VFX & SWIRLING SMOKE DISASTER VORTICES
        // =========================================================================
        GameObject vfxRoot = new GameObject("--- 3_VFX_ATMOSPHERE_AND_HAZARDS ---");

        // 1. Volumetric Low-Lying Ground Fog across Storage Bay 03
        GameObject fogF = InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/GroundFog.prefab",
            "VFX_GroundFog_Bay03_Front", vfxRoot.transform, new Vector3(0f, 0.05f, -2f), Vector3.zero, new Vector3(2.5f, 1f, 2f));
        GameObject fogC = InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/GroundFog.prefab",
            "VFX_GroundFog_Bay03_Center", vfxRoot.transform, new Vector3(0f, 0.05f, 8f), Vector3.zero, new Vector3(3f, 1f, 2.5f));
        GameObject fogB = InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/GroundFog.prefab",
            "VFX_GroundFog_Bay03_Back", vfxRoot.transform, new Vector3(0f, 0.05f, 18f), Vector3.zero, new Vector3(3f, 1f, 2.5f));

        // 2. Ambient Industrial Dust Motes & Airborne Floating Particulates
        GameObject dustS = InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/DustMotesEffect.prefab",
            "VFX_DustMotes_StagingArea", vfxRoot.transform, new Vector3(0f, 2.5f, -16.5f), Vector3.zero, new Vector3(2f, 2f, 2f));
        if (dustS != null) ApplySmokeTexture(dustS, matDustMotes);

        GameObject dustW = InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/DustMotesEffect.prefab",
            "VFX_DustMotes_Bay03_Warehouse", vfxRoot.transform, new Vector3(0f, 3.5f, 7.5f), Vector3.zero, new Vector3(3f, 2.5f, 3.5f));
        if (dustW != null) ApplySmokeTexture(dustW, matDustMotes);

        // 3. Chemical Flame & Fire Hazards
        InstantiateVfxPrefab("Assets/EffectExamples/FireExplosionEffects/Prefabs/MediumFlames.prefab",
            "VFX_Flames_ChemicalRupture", vfxRoot.transform, new Vector3(1.6f, 0.05f, 8.2f), Vector3.zero, new Vector3(0.85f, 0.85f, 0.85f));
        InstantiateVfxPrefab("Assets/EffectExamples/FireExplosionEffects/Prefabs/FlamesEffects.prefab",
            "VFX_Flames_PalletCorner", vfxRoot.transform, new Vector3(-2.8f, 0.05f, 9.5f), Vector3.zero, new Vector3(0.7f, 0.7f, 0.7f));
        InstantiateVfxPrefab("Assets/EffectExamples/FireExplosionEffects/Prefabs/WallFlames.prefab",
            "VFX_WallFlames_BackSpill", vfxRoot.transform, new Vector3(0.5f, 0.1f, 24.5f), Vector3.zero, new Vector3(0.9f, 0.9f, 0.9f));
        GameObject warFire = InstantiateVfxPrefab("Assets/JMO Assets/WarFX/_Effects/Fire/Gray Smoke/WFX_Fire Natural (Gray Smoke).prefab",
            "VFX_WarFire_IndustrialBurn", vfxRoot.transform, new Vector3(-5.0f, 0.05f, 14.0f), Vector3.zero, new Vector3(0.8f, 0.8f, 0.8f));
        if (warFire != null)
        {
            ApplySmokeTexture(warFire, matWarFxSmoke);
        }

        // 4. Heat Distortion & Thermal Mirage over Chemical Spill & Flames
        InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/HeatDistortion.prefab",
            "VFX_HeatDistortion_ChemicalSpill", vfxRoot.transform, new Vector3(0.5f, 1.2f, 7.0f), Vector3.zero, new Vector3(1.6f, 1.6f, 1.6f));
        InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/HeatDistortion.prefab",
            "VFX_HeatDistortion_FlameSource", vfxRoot.transform, new Vector3(1.6f, 1.0f, 8.2f), Vector3.zero, new Vector3(1.3f, 1.3f, 1.3f));

        // 5. Pressurized Overhead Steam & Chemical Line Vents
        InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/PressurisedSteam.prefab",
            "VFX_PressurizedSteam_OverheadPipe", vfxRoot.transform, new Vector3(-6.0f, 6.8f, 4.0f), new Vector3(90f, 0f, 0f), new Vector3(0.85f, 0.85f, 0.85f));
        InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/RisingSteam.prefab",
            "VFX_RisingSteam_SpillFloor", vfxRoot.transform, new Vector3(-1.2f, 0.05f, 6.5f), Vector3.zero, new Vector3(1.1f, 1.1f, 1.1f));

        // 6. Dense Ceiling Smoke Billowing with Textured Dark Smoke Material
        GameObject ceilingSmoke = InstantiateVfxPrefab("Assets/EffectExamples/Smoke & Steam Effects/Prefabs/SmokeEffect.prefab",
            "VFX_Smoke_CeilingAccumulation", vfxRoot.transform, new Vector3(0.5f, 6.8f, 10.0f), Vector3.zero, new Vector3(2.2f, 1.4f, 2.2f));
        if (ceilingSmoke != null)
        {
            ApplySmokeTexture(ceilingSmoke, matSmokeDark);
        }

        // 7. Electrical Sparks from Damaged Industrial Junction Box
        InstantiateVfxPrefab("Assets/EffectExamples/Misc Effects/Prefabs/ElectricalSparksEffect.prefab",
            "VFX_ElectricalSparks_WallBox", vfxRoot.transform, new Vector3(-12.8f, 2.8f, 0.0f), new Vector3(0f, 90f, 0f), Vector3.one);

        // 8. CINEMATIC SWIRLING SMOKE VORTICES & TORNADO-LIKE CHEMICAL PLUMES
        GameObject CreateSwirlingVortexSmoke(string name, Transform parent, Vector3 pos, float rate, float minSize, float maxSize, float speedY, Material smokeMat, float vortexTwist)
        {
            GameObject go = new GameObject(name);
            if (parent != null) go.transform.SetParent(parent, false);
            go.transform.position = pos;

            var pSys = go.AddComponent<ParticleSystem>();
            var pMain = pSys.main;
            pMain.maxParticles = 200;
            pMain.startLifetime = 8.5f;
            pMain.startSpeed = speedY;
            pMain.startSize = new ParticleSystem.MinMaxCurve(minSize, maxSize);
            pMain.startRotation = new ParticleSystem.MinMaxCurve(0f, 360f * Mathf.Deg2Rad);
            pMain.startColor = new Color(0.92f, 0.92f, 0.95f, 0.8f);
            pMain.simulationSpace = ParticleSystemSimulationSpace.World;
            pMain.loop = true;

            var pEmission = pSys.emission;
            pEmission.rateOverTime = rate;

            var pShape = pSys.shape;
            pShape.shapeType = ParticleSystemShapeType.Cone;
            pShape.angle = 18f;
            pShape.radius = 0.6f;

            // Velocity over Lifetime: Swirling Vortex with Orbital Physics & Upward Draft
            var pVelocity = pSys.velocityOverLifetime;
            pVelocity.enabled = true;
            pVelocity.y = new ParticleSystem.MinMaxCurve(0.9f, 1.8f);
            pVelocity.orbitalY = new ParticleSystem.MinMaxCurve(vortexTwist * 0.8f, vortexTwist * 1.5f);
            pVelocity.radial = new ParticleSystem.MinMaxCurve(0.1f, 0.4f);

            // High turbulence Brownian noise
            var pNoise = pSys.noise;
            pNoise.enabled = true;
            pNoise.strength = 0.55f;
            pNoise.frequency = 0.4f;
            pNoise.scrollSpeed = 0.3f;
            pNoise.damping = true;

            // High rotational angular spin
            var pRot = pSys.rotationOverLifetime;
            pRot.enabled = true;
            pRot.z = new ParticleSystem.MinMaxCurve(-65f * Mathf.Deg2Rad, 65f * Mathf.Deg2Rad);

            // Smooth fade-in & fade-out
            var pColorOverLifetime = pSys.colorOverLifetime;
            pColorOverLifetime.enabled = true;
            Gradient grad = new Gradient();
            grad.SetKeys(
                new GradientColorKey[] { new GradientColorKey(new Color(0.9f, 0.92f, 0.95f), 0f), new GradientColorKey(new Color(0.55f, 0.58f, 0.62f), 1f) },
                new GradientAlphaKey[] { new GradientAlphaKey(0f, 0f), new GradientAlphaKey(0.85f, 0.15f), new GradientAlphaKey(0.70f, 0.70f), new GradientAlphaKey(0f, 1f) }
            );
            pColorOverLifetime.color = grad;

            // Billowing expansion curve
            var pSizeOverLifetime = pSys.sizeOverLifetime;
            pSizeOverLifetime.enabled = true;
            AnimationCurve sizeCurve = new AnimationCurve();
            sizeCurve.AddKey(0f, 0.5f);
            sizeCurve.AddKey(0.35f, 1.6f);
            sizeCurve.AddKey(1f, 3.2f);
            pSizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1f, sizeCurve);

            var pRenderer = go.GetComponent<ParticleSystemRenderer>();
            if (smokeMat != null)
            {
                pRenderer.sharedMaterial = smokeMat;
            }
            pRenderer.renderMode = ParticleSystemRenderMode.Billboard;

            return go;
        }

        // A. Tornado-Like Swirling Smoke Vortex over Primary Breach
        CreateSwirlingVortexSmoke("VFX_Smoke_SwirlingVortex_Breach", vfxRoot.transform,
            new Vector3(0.5f, 0.5f, 7.0f), 28f, 0.9f, 2.2f, 1.2f, matSmokeRising, 2.5f);

        // B. Secondary Counter-Swirling Toxic Vapor Plume
        CreateSwirlingVortexSmoke("VFX_Smoke_CounterSwirl_Toxic", vfxRoot.transform,
            new Vector3(-0.8f, 0.4f, 6.5f), 20f, 0.7f, 1.8f, 0.9f, matSmokeToxic, -2.0f);

        // C. Ambient Wispy Smoke & Haze Drifting across Bay 03
        CreateSwirlingVortexSmoke("VFX_Smoke_AmbientDriftHaze", vfxRoot.transform,
            new Vector3(0f, 1.5f, 8.0f), 18f, 1.4f, 3.0f, 0.4f, matSmokeWispy, 0.6f);

        // =========================================================================
        // H. CINEMATIC DISASTER LIGHTING & ATMOSPHERE
        // =========================================================================
        GameObject lightGroup = new GameObject("--- 4_LIGHTING_AND_ATMOSPHERE ---");

        // Directional Sun Light (Cool Moody Industrial Day/Dusk)
        GameObject sunGO = new GameObject("Directional_SunLight");
        sunGO.transform.SetParent(lightGroup.transform);
        var sunLight = sunGO.AddComponent<Light>();
        sunLight.type = LightType.Directional;
        sunLight.intensity = 0.95f;
        sunLight.color = new Color(0.88f, 0.92f, 1.0f);
        sunGO.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        // Warm Staging Area Light
        GameObject stageLightGO = new GameObject("Light_StagingArea_Warm");
        stageLightGO.transform.SetParent(lightGroup.transform);
        var stageLight = stageLightGO.AddComponent<Light>();
        stageLight.type = LightType.Point;
        stageLight.range = 22f;
        stageLight.intensity = 1.6f;
        stageLight.color = new Color(1.0f, 0.92f, 0.80f);
        stageLightGO.transform.position = new Vector3(0f, 6.2f, -15.5f);

        // Main Warehouse Overhead Light
        GameObject bayLightGO = new GameObject("Light_Bay03_Main");
        bayLightGO.transform.SetParent(lightGroup.transform);
        var bayLight = bayLightGO.AddComponent<Light>();
        bayLight.type = LightType.Point;
        bayLight.range = 35f;
        bayLight.intensity = 1.8f;
        bayLight.color = new Color(0.85f, 0.90f, 0.98f);
        bayLightGO.transform.position = new Vector3(0f, 6.8f, 7.5f);

        // Dynamic High-Contrast Chemical Fire Light Flicker (Orange/Red inferno illumination)
        GameObject flameLightGO = new GameObject("Light_ChemicalFlames_Flicker");
        flameLightGO.transform.SetParent(lightGroup.transform);
        var flameLight = flameLightGO.AddComponent<Light>();
        flameLight.type = LightType.Point;
        flameLight.range = 16f;
        flameLight.intensity = 3.2f;
        flameLight.color = new Color(1.0f, 0.42f, 0.05f);
        flameLightGO.transform.position = new Vector3(1.6f, 1.4f, 8.2f);
        flameLightGO.AddComponent<LightFlicker>();

        // Emergency Flashing Alarm Beacon
        GameObject beaconGO = new GameObject("Emergency_Beacon_Flasher");
        beaconGO.transform.SetParent(lightGroup.transform);
        var beaconLight = beaconGO.AddComponent<Light>();
        beaconLight.type = LightType.Point;
        beaconLight.range = 20f;
        beaconLight.intensity = 3.5f;
        beaconLight.color = new Color(1.0f, 0.2f, 0.05f);
        beaconGO.transform.position = new Vector3(0f, 5.2f, -9.5f);
        beaconGO.AddComponent<EmergencyLightingFlasher>();

        // Environment Atmosphere Manager (Wired to avoid untextured procedural spawns)
        GameObject atmosGO = new GameObject("System_EnvironmentAtmosphere");
        atmosGO.transform.SetParent(lightGroup.transform);
        var atmosCtrl = atmosGO.AddComponent<EnvironmentAtmosphereController>();
        if (dustW != null) atmosCtrl.dustMoteSystem = dustW.GetComponentInChildren<ParticleSystem>();
        if (fogC != null) atmosCtrl.groundFogSystem = fogC.GetComponentInChildren<ParticleSystem>();

        // Post-Processing Cinematic Volume
        GameObject ppGO = new GameObject("System_PostProcessing");
        ppGO.transform.SetParent(lightGroup.transform);
        ppGO.AddComponent<PostProcessingController>();
        var ppVol = ppGO.AddComponent<Volume>();
        ppVol.isGlobal = true;

        // =========================================================================
        // I. FIRST-PERSON RESPONDER PLAYER CHARACTER
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

        var charCtrl = playerRoot.AddComponent<FirstPersonResponderController>();
        charCtrl.walkSpeed = 4.2f;
        charCtrl.sprintSpeed = 6.8f;
        charCtrl.mouseSensitivity = 2.4f;

        var pAudio = playerRoot.AddComponent<AudioSource>();
        pAudio.playOnAwake = false;
        pAudio.spatialBlend = 0f;
        charCtrl.respiratorBreathingSource = pAudio;

        // HUD Tactical Overlay
        GameObject hudGO = new GameObject("HUD_Tactical_Manager");
        var hudManager = hudGO.AddComponent<HudManager>();

        // =========================================================================
        // J. TACTICAL MULTI-CAMERA RIG SYSTEM (CCTV & FACILITY ANGLES)
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
            cam.farClipPlane = 100f;
            cam.fieldOfView = fov;
            cam.clearFlags = CameraClearFlags.Skybox;

            var camUrp = cCamGO.AddComponent<UniversalAdditionalCameraData>();
            camUrp.renderPostProcessing = true;

            // Visual CCTV Dome Housing Mesh
            CreatePrim(PrimitiveType.Sphere, $"{name}_Housing_Dome", cCamGO.transform,
                pos, Vector3.zero, new Vector3(0.28f, 0.28f, 0.28f), matDarkFloor, false, true);
            CreatePrim(PrimitiveType.Cylinder, $"{name}_Mount_Arm", cCamGO.transform,
                pos + new Vector3(0f, 0.18f, 0f), Vector3.zero, new Vector3(0.08f, 0.35f, 0.08f), matSteel, false, true);

            return cam;
        }

        // Camera 0: Responder First-Person Helmet Cam (Assigned to player)
        multiCamCtrl.playerFpsCamera = playerCam;

        // Camera 1: CCTV-01 Storage Bay Overview (High corner vantage point)
        multiCamCtrl.cctvOverviewCamera = CreateCctvCamera("CCTV_01_StorageBay_Overview",
            new Vector3(-13.0f, 6.8f, -7.5f), new Vector3(0f, 1.2f, 8.0f), 72f);

        // Camera 2: CCTV-02 Chemical Hazard & Leak Breach Closeup
        multiCamCtrl.cctvHazardCloseupCamera = CreateCctvCamera("CCTV_02_Hazard_Spill_Closeup",
            new Vector3(3.4f, 2.6f, 4.2f), new Vector3(0.5f, 0.7f, 7.0f), 60f);

        // Camera 3: CCTV-03 Decontamination Shower & Washdown Station
        multiCamCtrl.cctvDeconCamera = CreateCctvCamera("CCTV_03_Decon_Deluge_Station",
            new Vector3(4.0f, 4.4f, -2.0f), new Vector3(4.0f, 1.4f, -5.0f), 65f);

        // Camera 4: CCTV-04 High-Bay Ceiling Crane (Bird's Eye Panoramic View)
        multiCamCtrl.cctvHighBayCamera = CreateCctvCamera("CCTV_04_HighBay_Crane_Panoramic",
            new Vector3(0.0f, 7.8f, 7.5f), new Vector3(0.0f, 0.0f, 8.0f), 85f);

        // Camera 5: CCTV-05 Level-B PPE Staging Area Depot
        multiCamCtrl.cctvStagingCamera = CreateCctvCamera("CCTV_05_PPE_Staging_Depot",
            new Vector3(-0.8f, 3.4f, -11.5f), new Vector3(-3.3f, 1.0f, -14.0f), 65f);

        multiCamCtrl.RefreshCameraList();

        // Save Scene
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene, "Assets/Scenes/StorageBay03_Training.unity");
        Debug.Log("<color=#00FF66><b>[CBRS-X] Cinematic Chemical Disaster Bay 03 Scene Recreated & Saved Successfully!</b></color>");
    }
}
