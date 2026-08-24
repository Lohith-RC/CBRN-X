using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using System.IO;

[InitializeOnLoad]
public class Bay03MetallicPolisherAndPlayerSetup
{
    static Bay03MetallicPolisherAndPlayerSetup()
    {
        EditorApplication.delayCall += () =>
        {
            ApplyMetallicPolishAndAddElements();
        };
    }

    [MenuItem("CBRN-X/Apply Metallic Polish and Setup Player")]
    public static void ApplyMetallicPolishAndAddElements()
    {
        string scenePath = "Assets/Scenes/StorageBay03_Training.unity";
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

        Debug.Log("<color=cyan>=== APPLYING METALLIC POLISH & ADDING INDUSTRIAL ELEMENTS ===</color>");

        // =========================================================================
        // 1. METALLIC & ULTRA-SMOOTH SURFACE MATERIAL UPGRADES
        // =========================================================================
        void UpgradeMat(string path, Color baseCol, float metallic, float smoothness, Color? emissive = null)
        {
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (mat == null)
            {
                mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                AssetDatabase.CreateAsset(mat, path);
            }
            mat.SetColor("_BaseColor", baseCol);
            mat.SetFloat("_Metallic", metallic);
            mat.SetFloat("_Smoothness", smoothness);
            if (emissive.HasValue)
            {
                mat.EnableKeyword("_EMISSION");
                mat.SetColor("_EmissionColor", emissive.Value);
            }
            EditorUtility.SetDirty(mat);
        }

        // Polished industrial epoxy / metallic floor
        UpgradeMat("Assets/Mat_ConcreteFloor.mat", new Color(0.14f, 0.16f, 0.20f, 1f), 0.35f, 0.88f);
        // Structural gunmetal steel beams & columns
        UpgradeMat("Assets/Mat_SteelBeam.mat", new Color(0.20f, 0.23f, 0.28f, 1f), 0.95f, 0.84f);
        // Ultra-reflective stainless steel / chrome
        UpgradeMat("Assets/Mat_StainlessSteel.mat", new Color(0.92f, 0.94f, 0.96f, 1f), 0.98f, 0.96f);
        // Glossy metallic chemical drums (Royal Blue)
        UpgradeMat("Assets/Mat_ChemicalDrum.mat", new Color(0.04f, 0.28f, 0.65f, 1f), 0.75f, 0.88f);
        // Leaking chemical drum with corrosive residue
        UpgradeMat("Assets/Mat_LeakingDrum.mat", new Color(0.04f, 0.24f, 0.55f, 1f), 0.70f, 0.85f, new Color(0.1f, 0.8f, 0.2f) * 0.5f);
        // Metallic warehouse pallet racks (Blue uprights & Orange beams)
        UpgradeMat("Assets/Mat_RackBlue.mat", new Color(0.03f, 0.22f, 0.52f, 1f), 0.70f, 0.82f);
        UpgradeMat("Assets/Mat_RackOrange.mat", new Color(0.88f, 0.34f, 0.02f, 1f), 0.60f, 0.80f);
        // Glossy powder-coated utility piping
        UpgradeMat("Assets/Mat_PipeRed.mat", new Color(0.85f, 0.08f, 0.08f, 1f), 0.70f, 0.88f);
        UpgradeMat("Assets/Mat_PipeBlue.mat", new Color(0.08f, 0.38f, 0.85f, 1f), 0.70f, 0.88f);
        UpgradeMat("Assets/Mat_PipeYellow.mat", new Color(0.95f, 0.75f, 0.05f, 1f), 0.65f, 0.86f);
        UpgradeMat("Assets/Mat_SafetyGreen.mat", new Color(0.06f, 0.65f, 0.25f, 1f), 0.65f, 0.86f);
        // High-vis hazard yellow bollards & curbs
        UpgradeMat("Assets/Mat_SafetyYellow.mat", new Color(0.98f, 0.78f, 0.05f, 1f), 0.45f, 0.78f);
        // Galvanized steel diamond-plate grating
        UpgradeMat("Assets/Mat_CatwalkGrating.mat", new Color(0.40f, 0.44f, 0.48f, 1f), 0.92f, 0.82f);
        // Smooth industrial wall cladding (Light Grey)
        UpgradeMat("Assets/Mat_IndustrialWall.mat", new Color(0.82f, 0.84f, 0.86f, 1f), 0.15f, 0.55f);

        AssetDatabase.SaveAssets();

        // =========================================================================
        // 2. EXTRA INDUSTRIAL PLANT ELEMENTS
        // =========================================================================
        GameObject extraRoot = GameObject.Find("--- EXTRA_INDUSTRIAL_PLANT_ELEMENTS ---");
        if (extraRoot != null)
        {
            Object.DestroyImmediate(extraRoot);
        }
        extraRoot = new GameObject("--- EXTRA_INDUSTRIAL_PLANT_ELEMENTS ---");

        Material matSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SteelBeam.mat");
        Material matStainless = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_StainlessSteel.mat");
        Material matYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyYellow.mat");
        Material matPipeBlue = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PipeBlue.mat");
        Material matPipeRed = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_PipeRed.mat");
        Material matGrating = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_CatwalkGrating.mat");

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

        // --- A. Overhead Industrial Gantry Crane System ---
        GameObject gantry = new GameObject("OVERHEAD_Heavy_Gantry_Crane_System");
        gantry.transform.SetParent(extraRoot.transform);
        // Double Girder Bridge Beams spanning across the high-bay
        CreatePrim(PrimitiveType.Cube, "Crane_Girder_Front", gantry.transform, new Vector3(0.5f, 6.8f, 1.8f), Vector3.zero, new Vector3(18.5f, 0.5f, 0.35f), matYellow);
        CreatePrim(PrimitiveType.Cube, "Crane_Girder_Rear", gantry.transform, new Vector3(0.5f, 6.8f, 2.6f), Vector3.zero, new Vector3(18.5f, 0.5f, 0.35f), matYellow);
        // Hoist Trolley Unit
        GameObject trolley = CreatePrim(PrimitiveType.Cube, "Hoist_Trolley_Carriage", gantry.transform, new Vector3(2.6f, 7.15f, 2.2f), Vector3.zero, new Vector3(1.4f, 0.45f, 1.2f), matSteel);
        // Motor Drum & Steel Cable
        CreatePrim(PrimitiveType.Cylinder, "Cable_Drum", trolley.transform, new Vector3(2.6f, 7.3f, 2.2f), new Vector3(0, 0, 90), new Vector3(0.35f, 0.8f, 0.35f), matSteel);
        CreatePrim(PrimitiveType.Cylinder, "Hoist_Wire_Rope", trolley.transform, new Vector3(2.6f, 4.8f, 2.2f), Vector3.zero, new Vector3(0.04f, 4.2f, 0.04f), matStainless);
        // Heavy Forged Steel Hook
        CreatePrim(PrimitiveType.Sphere, "Crane_Hook_Block", trolley.transform, new Vector3(2.6f, 2.6f, 2.2f), Vector3.zero, new Vector3(0.4f, 0.5f, 0.35f), matYellow);

        // --- B. Heavy Centrifugal Chemical Pump & Motor Skids ---
        void SpawnChemicalPump(Vector3 pos, float rotY)
        {
            GameObject pump = new GameObject("Chemical_Centrifugal_Pump_Skid");
            pump.transform.SetParent(extraRoot.transform);
            pump.transform.position = pos;
            pump.transform.eulerAngles = new Vector3(0, rotY, 0);

            // Concrete Inertia Base
            CreatePrim(PrimitiveType.Cube, "Inertia_Base", pump.transform, pos + Vector3.up * 0.12f, Vector3.zero, new Vector3(1.6f, 0.24f, 0.9f), matSteel);
            // Volute Pump Casing (Stainless)
            CreatePrim(PrimitiveType.Cylinder, "Pump_Volute_Casing", pump.transform, pos + Vector3.up * 0.48f + Vector3.right * 0.35f, new Vector3(0, 0, 90), new Vector3(0.45f, 0.35f, 0.45f), matStainless);
            // Electric Motor (Blue Enclosure)
            CreatePrim(PrimitiveType.Cylinder, "Electric_Motor", pump.transform, pos + Vector3.up * 0.48f - Vector3.right * 0.3f, new Vector3(0, 0, 90), new Vector3(0.38f, 0.5f, 0.38f), matPipeBlue);
            // Vertical Discharge Pipe & Pressure Gauge
            CreatePrim(PrimitiveType.Cylinder, "Discharge_Pipe", pump.transform, pos + Vector3.up * 1.0f + Vector3.right * 0.35f, Vector3.zero, new Vector3(0.12f, 0.7f, 0.12f), matStainless);
            CreatePrim(PrimitiveType.Cylinder, "Pump_Gauge", pump.transform, pos + Vector3.up * 1.25f + Vector3.right * 0.42f, new Vector3(0, 0, 90), new Vector3(0.18f, 0.05f, 0.18f), matStainless);
        }

        SpawnChemicalPump(new Vector3(7.2f, 0f, 7.5f), -90f);
        SpawnChemicalPump(new Vector3(7.2f, 0f, 10.5f), -90f);

        // --- C. Industrial High-Voltage Electrical Substation & Transformer ---
        GameObject transformer = new GameObject("SUBSTATION_Industrial_Transformer_Unit");
        transformer.transform.SetParent(extraRoot.transform);
        transformer.transform.position = new Vector3(-8.0f, 0f, -8.0f);
        // Main Tank with Cooling Radiator Fins
        CreatePrim(PrimitiveType.Cube, "Transformer_Main_Tank", transformer.transform, new Vector3(-8.0f, 1.4f, -8.0f), Vector3.zero, new Vector3(1.8f, 2.6f, 1.4f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Cooling_Fins_L", transformer.transform, new Vector3(-8.95f, 1.4f, -8.0f), Vector3.zero, new Vector3(0.15f, 2.2f, 1.2f), matSteel);
        CreatePrim(PrimitiveType.Cube, "Cooling_Fins_R", transformer.transform, new Vector3(-7.05f, 1.4f, -8.0f), Vector3.zero, new Vector3(0.15f, 2.2f, 1.2f), matSteel);
        // High-Voltage Bushing Insulators
        for (int b = 0; b < 3; b++)
        {
            float z = -8.5f + b * 0.5f;
            CreatePrim(PrimitiveType.Cylinder, $"Bushing_{b}", transformer.transform, new Vector3(-8.0f, 2.95f, z), Vector3.zero, new Vector3(0.18f, 0.5f, 0.18f), matStainless);
        }

        // --- D. Industrial Floor Trench Drains with Metal Grates ---
        GameObject drains = new GameObject("FLOOR_Industrial_Trench_Drains");
        drains.transform.SetParent(extraRoot.transform);
        // Left & Right drainage trenches
        CreatePrim(PrimitiveType.Cube, "Trench_Drain_Left", drains.transform, new Vector3(-4.6f, 0.01f, 2.0f), Vector3.zero, new Vector3(0.35f, 0.02f, 24.0f), matGrating);
        CreatePrim(PrimitiveType.Cube, "Trench_Drain_Right", drains.transform, new Vector3(5.2f, 0.01f, 2.0f), Vector3.zero, new Vector3(0.35f, 0.02f, 24.0f), matGrating);

        // =========================================================================
        // 3. FIRST PERSON PLAYER RESPONDER RIG SETUP
        // =========================================================================
        GameObject player = GameObject.Find("Player_FirstPersonResponder");
        if (player == null)
        {
            player = new GameObject("Player_FirstPersonResponder");
        }
        player.transform.position = new Vector3(0.3f, 1.0f, -12.5f);
        player.transform.rotation = Quaternion.Euler(0, 0, 0);

        var cc = player.GetComponent<CharacterController>();
        if (cc == null) cc = player.AddComponent<CharacterController>();
        cc.height = 1.8f;
        cc.radius = 0.35f;
        cc.center = new Vector3(0, 0.9f, 0);

        var fpsCtrl = player.GetComponent<CBRSX.Unity.FirstPersonResponderController>();
        if (fpsCtrl == null) fpsCtrl = player.AddComponent<CBRSX.Unity.FirstPersonResponderController>();
        fpsCtrl.walkSpeed = 3.8f;
        fpsCtrl.sprintSpeed = 6.2f;
        fpsCtrl.mouseSensitivity = 2.2f;

        // Player Camera
        Transform camTrans = player.transform.Find("PlayerCamera");
        Camera cam = null;
        if (camTrans == null)
        {
            GameObject camGO = new GameObject("PlayerCamera");
            camGO.transform.SetParent(player.transform);
            camGO.transform.localPosition = new Vector3(0, 1.65f, 0);
            camGO.transform.localRotation = Quaternion.identity;
            cam = camGO.AddComponent<Camera>();
            camGO.AddComponent<AudioListener>();
            camGO.tag = "MainCamera";
        }
        else
        {
            cam = camTrans.GetComponent<Camera>();
        }

        if (cam != null)
        {
            var pInter = cam.GetComponent<CBRSX.Unity.PlayerInteraction>();
            if (pInter == null) pInter = cam.gameObject.AddComponent<CBRSX.Unity.PlayerInteraction>();
        }

        // Disable other standalone cameras so PlayerCamera is main
        Camera[] allCams = Object.FindObjectsByType<Camera>(FindObjectsSortMode.None);
        foreach (var c in allCams)
        {
            if (c != cam && c.gameObject.name != "SceneCamera")
            {
                c.enabled = false;
            }
        }

        // =========================================================================
        // SAVE & UPDATE SCENEVIEW
        // =========================================================================
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        if (SceneView.lastActiveSceneView != null)
        {
            SceneView.lastActiveSceneView.pivot = new Vector3(0.3f, 2.2f, -3.5f);
            SceneView.lastActiveSceneView.rotation = Quaternion.Euler(11f, 0f, 0f);
            SceneView.lastActiveSceneView.size = 8.5f;
            SceneView.lastActiveSceneView.Repaint();
        }

        Debug.Log("<color=green>=== METALLIC POLISH & PLAYER SETUP COMPLETED & SAVED! ===</color>");
    }
}
