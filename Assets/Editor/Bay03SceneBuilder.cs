using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using System.IO;

[InitializeOnLoad]
public class Bay03SceneBuilder
{
    static Bay03SceneBuilder()
    {
        EditorApplication.delayCall += () =>
        {
            BuildBay03Visuals();
        };
    }

    [MenuItem("CBRN-X/Build Elevated Bay 03 Scene")]
    public static void BuildBay03Visuals()
    {
        string scenePath = "Assets/Scenes/StorageBay03_Training.unity";
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

        Debug.Log("<color=cyan>=== ELEVATING STORAGE BAY 03 VISUALS ===</color>");

        // 1. Root container for elevated visual architecture
        GameObject root = GameObject.Find("--- ELEVATED_WAREHOUSE_FACILITY ---");
        if (root != null)
        {
            Object.DestroyImmediate(root);
        }
        root = new GameObject("--- ELEVATED_WAREHOUSE_FACILITY ---");

        // Helper materials
        Material matDrumBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ChemicalDrum.mat");
        Material matDrumLeaking = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_LeakingDrum.mat");
        Material matRackBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_RackBlue.mat");
        Material matRackOrange = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_RackOrange.mat");
        Material matPallet = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PalletWood.mat");
        Material matCrate = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_WoodCrate.mat");
        Material matYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyYellow.mat");
        Material matSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SteelBeam.mat");
        Material matConcrete = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_ConcreteFloor.mat");
        Material matWall = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_IndustrialWall.mat");
        Material matPipeRed = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PipeRed.mat");
        Material matPipeBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PipeBlue.mat");
        Material matPipeYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PipeYellow.mat");
        Material matPipeGreen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyGreen.mat");

        // Translucent Bin Materials (Pink / Amber / Yellow Bins from reference)
        Material matPinkBin = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_Translucent_PinkBin.mat");
        if (matPinkBin == null)
        {
            matPinkBin = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            matPinkBin.name = "Mat_Translucent_PinkBin";
            matPinkBin.SetFloat("_Surface", 1.0f);
            matPinkBin.SetFloat("_Blend", 0.0f);
            matPinkBin.SetColor("_BaseColor", new Color(0.95f, 0.40f, 0.65f, 0.75f));
            matPinkBin.SetFloat("_Smoothness", 0.88f);
            matPinkBin.SetFloat("_Metallic", 0.05f);
            AssetDatabase.CreateAsset(matPinkBin, "Assets/Mat_Translucent_PinkBin.mat");
        }

        Material matYellowBin = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_HeavyDuty_YellowBin.mat");
        if (matYellowBin == null)
        {
            matYellowBin = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            matYellowBin.name = "Mat_HeavyDuty_YellowBin";
            matYellowBin.SetColor("_BaseColor", new Color(0.96f, 0.78f, 0.08f, 1f));
            matYellowBin.SetFloat("_Smoothness", 0.60f);
            AssetDatabase.CreateAsset(matYellowBin, "Assets/Mat_HeavyDuty_YellowBin.mat");
        }

        // Helper: Primitive creator
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

        // -------------------------------------------------------------
        // A. OVERHEAD SIGNBOARD: "BAY 3: HAZMAT STORAGE & DECONTAMINATION"
        // -------------------------------------------------------------
        GameObject signGroup = new GameObject("OVERHEAD_BAY3_FACILITY_SIGN");
        signGroup.transform.SetParent(root.transform);

        // Sign Panel Box
        GameObject signPanel = CreatePrim(PrimitiveType.Cube, "Sign_Background_Panel", signGroup.transform,
            new Vector3(0f, 6.2f, -1.0f), Vector3.zero, new Vector3(14.0f, 1.4f, 0.15f), matWall);

        // Black Border Trim
        CreatePrim(PrimitiveType.Cube, "Sign_Border_Top", signGroup.transform, new Vector3(0f, 6.95f, -1.0f), Vector3.zero, new Vector3(14.2f, 0.1f, 0.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Sign_Border_Bottom", signGroup.transform, new Vector3(0f, 5.45f, -1.0f), Vector3.zero, new Vector3(14.2f, 0.1f, 0.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Sign_Border_Left", signGroup.transform, new Vector3(-7.05f, 6.2f, -1.0f), Vector3.zero, new Vector3(0.1f, 1.5f, 0.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Sign_Border_Right", signGroup.transform, new Vector3(7.05f, 6.2f, -1.0f), Vector3.zero, new Vector3(0.1f, 1.5f, 0.2f), matSteel);

        // 3D Text on Signboard
        GameObject textGO = new GameObject("Sign_Text_TMPro");
        textGO.transform.SetParent(signGroup.transform);
        textGO.transform.position = new Vector3(0f, 6.2f, -1.1f);
        textGO.transform.rotation = Quaternion.Euler(0, 0, 0);
        var tmp = textGO.AddComponent<TMPro.TextMeshPro>();
        tmp.text = "BAY 3: HAZMAT STORAGE & DECONTAMINATION";
        tmp.fontSize = 9.5f;
        tmp.alignment = TMPro.TextAlignmentOptions.Center;
        tmp.color = new Color(0.08f, 0.08f, 0.08f, 1f);
        tmp.fontStyle = TMPro.FontStyles.Bold;
        var rt = textGO.GetComponent<RectTransform>();
        rt.sizeDelta = new Vector2(13.8f, 1.3f);

        // -------------------------------------------------------------
        // B. DEEP WAREHOUSE HIGH-BAY RACKING (LEFT SIDE & BACKGROUND)
        // -------------------------------------------------------------
        GameObject racksGroup = new GameObject("STRUCT_Deep_Warehouse_Racking_Aisles");
        racksGroup.transform.SetParent(root.transform);

        // Spawn a full multi-tier warehouse pallet rack
        void SpawnWarehouseRack(Vector3 basePos, float length, int tiers)
        {
            int cols = Mathf.CeilToInt(length / 2.8f) + 1;
            for (int c = 0; c < cols; c++)
            {
                float z = basePos.z + c * 2.8f;
                CreatePrim(PrimitiveType.Cube, $"RackPost_F_{c}", racksGroup.transform, new Vector3(basePos.x, basePos.y + (tiers * 1.5f) / 2f, z), Vector3.zero, new Vector3(0.12f, tiers * 1.5f, 0.12f), matRackBlue);
                CreatePrim(PrimitiveType.Cube, $"RackPost_B_{c}", racksGroup.transform, new Vector3(basePos.x - 1.2f, basePos.y + (tiers * 1.5f) / 2f, z), Vector3.zero, new Vector3(0.12f, tiers * 1.5f, 0.12f), matRackBlue);
            }

            for (int t = 1; t <= tiers; t++)
            {
                float y = basePos.y + t * 1.4f;
                CreatePrim(PrimitiveType.Cube, $"RackBeam_F_T{t}", racksGroup.transform, new Vector3(basePos.x, y, basePos.z + length / 2f), Vector3.zero, new Vector3(0.1f, 0.15f, length), matRackOrange);
                CreatePrim(PrimitiveType.Cube, $"RackBeam_B_T{t}", racksGroup.transform, new Vector3(basePos.x - 1.2f, y, basePos.z + length / 2f), Vector3.zero, new Vector3(0.1f, 0.15f, length), matRackOrange);

                for (int c = 0; c < cols - 1; c++)
                {
                    float zCenter = basePos.z + c * 2.8f + 1.4f;
                    CreatePrim(PrimitiveType.Cube, $"Pallet_T{t}_B{c}", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.08f, zCenter), Vector3.zero, new Vector3(1.1f, 0.12f, 2.4f), matPallet);

                    int itemChoice = (t + c) % 3;
                    if (itemChoice == 0)
                    {
                        CreatePrim(PrimitiveType.Cylinder, $"Drum_0", racksGroup.transform, new Vector3(basePos.x - 0.85f, y + 0.6f, zCenter - 0.55f), Vector3.zero, new Vector3(0.55f, 0.45f, 0.55f), matDrumBlue);
                        CreatePrim(PrimitiveType.Cylinder, $"Drum_1", racksGroup.transform, new Vector3(basePos.x - 0.35f, y + 0.6f, zCenter - 0.55f), Vector3.zero, new Vector3(0.55f, 0.45f, 0.55f), matDrumBlue);
                        CreatePrim(PrimitiveType.Cylinder, $"Drum_2", racksGroup.transform, new Vector3(basePos.x - 0.85f, y + 0.6f, zCenter + 0.55f), Vector3.zero, new Vector3(0.55f, 0.45f, 0.55f), matDrumBlue);
                        CreatePrim(PrimitiveType.Cylinder, $"Drum_3", racksGroup.transform, new Vector3(basePos.x - 0.35f, y + 0.6f, zCenter + 0.55f), Vector3.zero, new Vector3(0.55f, 0.45f, 0.55f), matDrumBlue);
                    }
                    else if (itemChoice == 1)
                    {
                        CreatePrim(PrimitiveType.Cube, $"Crate_0", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.55f, zCenter - 0.5f), Vector3.zero, new Vector3(0.85f, 0.85f, 0.95f), matCrate);
                        CreatePrim(PrimitiveType.Cube, $"Crate_1", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.55f, zCenter + 0.5f), Vector3.zero, new Vector3(0.85f, 0.85f, 0.95f), matCrate);
                    }
                    else
                    {
                        CreatePrim(PrimitiveType.Cylinder, "CoiledHose_Red", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.25f, zCenter - 0.5f), Vector3.zero, new Vector3(0.9f, 0.2f, 0.9f), matPipeRed);
                        CreatePrim(PrimitiveType.Cylinder, "CoiledHose_Green", racksGroup.transform, new Vector3(basePos.x - 0.6f, y + 0.25f, zCenter + 0.5f), Vector3.zero, new Vector3(0.9f, 0.2f, 0.9f), matPipeGreen);
                    }
                }
            }
        }

        SpawnWarehouseRack(new Vector3(-6.8f, 0f, -8f), 24f, 4);
        SpawnWarehouseRack(new Vector3(-4.0f, 0f, 22f), 18f, 3);
        SpawnWarehouseRack(new Vector3(4.0f, 0f, 22f), 18f, 3);

        // -------------------------------------------------------------
        // C. FOREGROUND CHEMICAL DRUM STAGING MATRIX (LEFT FOREGROUND)
        // -------------------------------------------------------------
        GameObject drumMatrixGroup = new GameObject("PROP_Foreground_Drum_Storage_Matrix");
        drumMatrixGroup.transform.SetParent(root.transform);

        CreatePrim(PrimitiveType.Cube, "Drum_Zone_Border_W", drumMatrixGroup.transform, new Vector3(-8.5f, 0.02f, -12f), Vector3.zero, new Vector3(0.12f, 0.04f, 10f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Drum_Zone_Border_E", drumMatrixGroup.transform, new Vector3(-4.5f, 0.02f, -12f), Vector3.zero, new Vector3(0.12f, 0.04f, 10f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Drum_Zone_Border_S", drumMatrixGroup.transform, new Vector3(-6.5f, 0.02f, -17f), Vector3.zero, new Vector3(4.12f, 0.04f, 0.12f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Drum_Zone_Border_N", drumMatrixGroup.transform, new Vector3(-6.5f, 0.02f, -7f), Vector3.zero, new Vector3(4.12f, 0.04f, 0.12f), matYellow);

        for (int row = 0; row < 6; row++)
        {
            for (int col = 0; col < 3; col++)
            {
                float x = -7.8f + col * 1.3f;
                float z = -15.8f + row * 1.5f;

                CreatePrim(PrimitiveType.Cube, $"Pallet_{row}_{col}", drumMatrixGroup.transform, new Vector3(x, 0.06f, z), Vector3.zero, new Vector3(1.1f, 0.12f, 1.1f), matPallet);
                GameObject drum = CreatePrim(PrimitiveType.Cylinder, $"Drum_{row}_{col}", drumMatrixGroup.transform, new Vector3(x, 0.58f, z), Vector3.zero, new Vector3(0.6f, 0.46f, 0.6f), matDrumBlue);
                CreatePrim(PrimitiveType.Cylinder, "BungCap", drum.transform, new Vector3(x + 0.15f, 1.05f, z), Vector3.zero, new Vector3(0.1f, 0.02f, 0.1f), matWall);
            }
        }

        // -------------------------------------------------------------
        // D. CENTER CONCRETE PILLAR & DUAL CONTAINMENT SUMPS
        // -------------------------------------------------------------
        GameObject centerGroup = new GameObject("STRUCT_Center_Hazmat_Containment_Station");
        centerGroup.transform.SetParent(root.transform);

        GameObject colCenter = CreatePrim(PrimitiveType.Cube, "Concrete_Pillar_Center", centerGroup.transform,
            new Vector3(-0.6f, 3.5f, 1.5f), Vector3.zero, new Vector3(0.9f, 7.0f, 0.9f), matConcrete);

        CreatePrim(PrimitiveType.Cube, "Electrical_SwitchBox", colCenter.transform, new Vector3(-0.1f, 2.2f, 1.02f), Vector3.zero, new Vector3(0.35f, 0.5f, 0.18f), matSteel);
        CreatePrim(PrimitiveType.Cylinder, "Conduit_Pipe", colCenter.transform, new Vector3(-0.1f, 4.5f, 1.02f), Vector3.zero, new Vector3(0.06f, 2.2f, 0.06f), matSteel);

        void CreateContainmentBerm(string bermName, Vector3 center, Vector3 size)
        {
            GameObject berm = new GameObject(bermName);
            berm.transform.SetParent(centerGroup.transform);

            CreatePrim(PrimitiveType.Cube, "Recessed_Basin_Floor", berm.transform, new Vector3(center.x, 0.02f, center.z), Vector3.zero, new Vector3(size.x - 0.4f, 0.04f, size.z - 0.4f), matConcrete);

            CreatePrim(PrimitiveType.Cube, "Berm_N", berm.transform, new Vector3(center.x, 0.12f, center.z + size.z / 2f), Vector3.zero, new Vector3(size.x, 0.24f, 0.4f), matYellow);
            CreatePrim(PrimitiveType.Cube, "Berm_S", berm.transform, new Vector3(center.x, 0.12f, center.z - size.z / 2f), Vector3.zero, new Vector3(size.x, 0.24f, 0.4f), matYellow);
            CreatePrim(PrimitiveType.Cube, "Berm_W", berm.transform, new Vector3(center.x - size.x / 2f, 0.12f, center.z), Vector3.zero, new Vector3(0.4f, 0.24f, size.z), matYellow);
            CreatePrim(PrimitiveType.Cube, "Berm_E", berm.transform, new Vector3(center.x + size.x / 2f, 0.12f, center.z), Vector3.zero, new Vector3(0.4f, 0.24f, size.z), matYellow);

            CreatePrim(PrimitiveType.Cylinder, "Cone_NW", berm.transform, new Vector3(center.x - size.x / 2f - 0.3f, 0.4f, center.z + size.z / 2f + 0.3f), Vector3.zero, new Vector3(0.35f, 0.4f, 0.35f), matYellow);
            CreatePrim(PrimitiveType.Cylinder, "Cone_NE", berm.transform, new Vector3(center.x + size.x / 2f + 0.3f, 0.4f, center.z + size.z / 2f + 0.3f), Vector3.zero, new Vector3(0.35f, 0.4f, 0.35f), matYellow);
            CreatePrim(PrimitiveType.Cylinder, "Cone_SW", berm.transform, new Vector3(center.x - size.x / 2f - 0.3f, 0.4f, center.z - size.z / 2f - 0.3f), Vector3.zero, new Vector3(0.35f, 0.4f, 0.35f), matYellow);
            CreatePrim(PrimitiveType.Cylinder, "Cone_SE", berm.transform, new Vector3(center.x + size.x / 2f + 0.3f, 0.4f, center.z - size.z / 2f - 0.3f), Vector3.zero, new Vector3(0.35f, 0.4f, 0.35f), matYellow);
        }

        CreateContainmentBerm("Containment_Sump_Left", new Vector3(-2.8f, 0f, 6.5f), new Vector3(3.4f, 0.24f, 3.4f));
        CreateContainmentBerm("Containment_Sump_Right", new Vector3(2.6f, 0f, 6.5f), new Vector3(3.4f, 0.24f, 3.4f));

        CreatePrim(PrimitiveType.Cylinder, "Sump_Drum_01", centerGroup.transform, new Vector3(2.1f, 0.55f, 6.2f), Vector3.zero, new Vector3(0.6f, 0.45f, 0.6f), matDrumBlue);
        CreatePrim(PrimitiveType.Cylinder, "Sump_Drum_02", centerGroup.transform, new Vector3(3.0f, 0.55f, 6.2f), Vector3.zero, new Vector3(0.6f, 0.45f, 0.6f), matDrumBlue);
        CreatePrim(PrimitiveType.Cylinder, "Sump_Drum_03_Ruptured", centerGroup.transform, new Vector3(2.6f, 0.55f, 7.1f), new Vector3(5, 12, -4), new Vector3(0.6f, 0.45f, 0.6f), matDrumLeaking);

        // -------------------------------------------------------------
        // E. RIGHT SIDE: TRANSLUCENT OVERPACK BINS & UTILITY WALL
        // -------------------------------------------------------------
        GameObject rightStaging = new GameObject("PROP_Right_Staging_SpillKits_And_Piping");
        rightStaging.transform.SetParent(root.transform);

        void SpawnToteStack(Vector3 pos, bool hasPinkTop)
        {
            CreatePrim(PrimitiveType.Cube, "Yellow_Base_Bin", rightStaging.transform, new Vector3(pos.x, pos.y + 0.3f, pos.z), Vector3.zero, new Vector3(0.9f, 0.6f, 0.7f), matYellowBin);
            if (hasPinkTop)
            {
                CreatePrim(PrimitiveType.Cube, "Pink_Translucent_Tote", rightStaging.transform, new Vector3(pos.x, pos.y + 0.85f, pos.z), Vector3.zero, new Vector3(0.85f, 0.5f, 0.65f), matPinkBin);
            }
        }

        SpawnToteStack(new Vector3(6.8f, 0f, -12.5f), true);
        SpawnToteStack(new Vector3(6.8f, 0f, -10.5f), false);
        SpawnToteStack(new Vector3(6.8f, 0f, -8.5f), true);
        SpawnToteStack(new Vector3(6.8f, 0f, -6.5f), true);
        SpawnToteStack(new Vector3(6.8f, 0f, -4.5f), false);

        GameObject shelfUnit = new GameObject("Shelving_Unit_RightWall");
        shelfUnit.transform.SetParent(rightStaging.transform);
        CreatePrim(PrimitiveType.Cube, "Shelf_Frame", shelfUnit.transform, new Vector3(7.6f, 1.4f, 0.5f), Vector3.zero, new Vector3(0.6f, 2.8f, 2.2f), matSteel);
        CreatePrim(PrimitiveType.Cylinder, "Shelf_Hose_Yellow", shelfUnit.transform, new Vector3(7.4f, 1.2f, 0.5f), new Vector3(90, 0, 0), new Vector3(0.5f, 0.15f, 0.5f), matPipeYellow);
        CreatePrim(PrimitiveType.Cube, "Shelf_Bin_Blue", shelfUnit.transform, new Vector3(7.4f, 0.4f, 0.5f), Vector3.zero, new Vector3(0.4f, 0.3f, 0.6f), matDrumBlue);

        GameObject pipesGroup = new GameObject("WALL_MultiTier_Industrial_Piping");
        pipesGroup.transform.SetParent(rightStaging.transform);
        for (int p = 0; p < 4; p++)
        {
            float y = 2.4f + p * 0.32f;
            Material pipeMat = p == 0 ? matPipeRed : (p == 1 ? matPipeBlue : (p == 2 ? matPipeYellow : matPipeGreen));
            CreatePrim(PrimitiveType.Cylinder, $"Pipe_Run_{p}", pipesGroup.transform, new Vector3(7.6f, y, 4f), new Vector3(90, 0, 0), new Vector3(0.08f, 16f, 0.08f), pipeMat);
            for (int f = 0; f < 5; f++)
            {
                float z = -8f + f * 6f;
                CreatePrim(PrimitiveType.Cylinder, $"Flange_{p}_{f}", pipesGroup.transform, new Vector3(7.6f, y, z), new Vector3(90, 0, 0), new Vector3(0.14f, 0.08f, 0.14f), matSteel);
            }
        }

        // -------------------------------------------------------------
        // F. FLOOR LANE MARKINGS & WALKWAYS
        // -------------------------------------------------------------
        GameObject lanesGroup = new GameObject("FLOOR_HighVis_Yellow_Striping");
        lanesGroup.transform.SetParent(root.transform);

        CreatePrim(PrimitiveType.Cube, "Lane_Line_Left", lanesGroup.transform, new Vector3(-4.4f, 0.02f, 0f), Vector3.zero, new Vector3(0.12f, 0.04f, 32f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Lane_Line_Right", lanesGroup.transform, new Vector3(5.0f, 0.02f, 0f), Vector3.zero, new Vector3(0.12f, 0.04f, 32f), matYellow);

        CreatePrim(PrimitiveType.Cube, "StopBar_Front", lanesGroup.transform, new Vector3(0.3f, 0.02f, -14f), Vector3.zero, new Vector3(9.5f, 0.04f, 0.15f), matYellow);
        CreatePrim(PrimitiveType.Cube, "StopBar_Rear", lanesGroup.transform, new Vector3(0.3f, 0.02f, 15f), Vector3.zero, new Vector3(9.5f, 0.04f, 0.15f), matYellow);

        for (int b = 0; b < 6; b++)
        {
            float z = -12f + b * 4.5f;
            CreatePrim(PrimitiveType.Cylinder, $"Bollard_L_{b}", lanesGroup.transform, new Vector3(-4.4f, 0.5f, z), Vector3.zero, new Vector3(0.18f, 0.5f, 0.18f), matYellow);
            CreatePrim(PrimitiveType.Cylinder, $"Bollard_R_{b}", lanesGroup.transform, new Vector3(5.0f, 0.5f, z), Vector3.zero, new Vector3(0.18f, 0.5f, 0.18f), matYellow);
        }

        // -------------------------------------------------------------
        // G. ROLL-UP GARAGE SHUTTER DOOR (BACK WALL)
        // -------------------------------------------------------------
        GameObject doorGroup = new GameObject("DOOR_Corrugated_RollUp_Shutter");
        doorGroup.transform.SetParent(root.transform);
        CreatePrim(PrimitiveType.Cube, "RollUp_Door_Panel", doorGroup.transform, new Vector3(3.2f, 3.0f, 17.8f), Vector3.zero, new Vector3(4.8f, 6.0f, 0.1f), matWall);
        CreatePrim(PrimitiveType.Cube, "Door_Frame_L", doorGroup.transform, new Vector3(0.7f, 3.0f, 17.75f), Vector3.zero, new Vector3(0.2f, 6.2f, 0.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Door_Frame_R", doorGroup.transform, new Vector3(5.7f, 3.0f, 17.75f), Vector3.zero, new Vector3(0.2f, 6.2f, 0.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Door_Frame_Top", doorGroup.transform, new Vector3(3.2f, 6.1f, 17.75f), Vector3.zero, new Vector3(5.2f, 0.4f, 0.3f), matSteel);

        // -------------------------------------------------------------
        // H. SAVE SCENE & ALIGN SCENEVIEW
        // -------------------------------------------------------------
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        if (SceneView.lastActiveSceneView != null)
        {
            SceneView.lastActiveSceneView.pivot = new Vector3(0.5f, 2.2f, -2.0f);
            SceneView.lastActiveSceneView.rotation = Quaternion.Euler(14f, 0f, 0f);
            SceneView.lastActiveSceneView.size = 11.0f;
            SceneView.lastActiveSceneView.Repaint();
        }

        Debug.Log("<color=green>=== BAY 03 VISUAL ELEVATION COMPLETE & SAVED! ===</color>");
    }
}
