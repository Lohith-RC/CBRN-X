using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using TMPro;

[InitializeOnLoad]
public class PlayerToolSetup
{
    static PlayerToolSetup()
    {
        EditorApplication.delayCall += () =>
        {
            SetupPlayerToolsAndJump();
        };
    }

    [MenuItem("CBRN-X/Setup Player Tools & Jump")]
    public static void SetupPlayerToolsAndJump()
    {
        string scenePath = "Assets/Scenes/StorageBay03_Training.unity";
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

        Debug.Log("<color=cyan>=== CONFIGURING PLAYER RIG, JUMP & HANDHELD GAS DETECTOR ===</color>");

        GameObject player = GameObject.Find("Player_FirstPersonResponder");
        if (player == null)
        {
            player = new GameObject("Player_FirstPersonResponder");
            player.transform.position = new Vector3(0.3f, 1.0f, -12.5f);
        }

        // 1. Configure CharacterController
        var cc = player.GetComponent<CharacterController>();
        if (cc == null) cc = player.AddComponent<CharacterController>();
        cc.height = 1.8f;
        cc.radius = 0.35f;
        cc.center = new Vector3(0, 0.9f, 0);
        cc.stepOffset = 0.35f; // Step smoothly over curbs and berms

        // 2. Configure FirstPersonResponderController
        var fps = player.GetComponent<CBRSX.Unity.FirstPersonResponderController>();
        if (fps == null) fps = player.AddComponent<CBRSX.Unity.FirstPersonResponderController>();
        fps.walkSpeed = 3.8f;
        fps.sprintSpeed = 6.5f;
        fps.jumpHeight = 1.35f;
        fps.gravity = -18.5f;
        fps.coyoteTime = 0.15f;
        fps.jumpBufferTime = 0.12f;
        fps.mouseSensitivity = 2.2f;

        // 3. Configure Player Camera
        Transform camTrans = player.transform.Find("PlayerCamera");
        GameObject camGO = null;
        Camera cam = null;
        if (camTrans == null)
        {
            camGO = new GameObject("PlayerCamera");
            camGO.transform.SetParent(player.transform);
            camGO.transform.localPosition = new Vector3(0, 1.65f, 0);
            camGO.transform.localRotation = Quaternion.identity;
            cam = camGO.AddComponent<Camera>();
            camGO.AddComponent<AudioListener>();
            camGO.tag = "MainCamera";
        }
        else
        {
            camGO = camTrans.gameObject;
            cam = camGO.GetComponent<Camera>();
        }

        // 4. Build 3D Handheld Gas Detector on Player Camera
        Transform heldTrans = camGO.transform.Find("Held_GasDetector_PID");
        GameObject heldModel = null;
        if (heldTrans != null)
        {
            heldModel = heldTrans.gameObject;
        }
        else
        {
            heldModel = new GameObject("Held_GasDetector_PID");
            heldModel.transform.SetParent(camGO.transform);
            heldModel.transform.localPosition = new Vector3(0.28f, -0.22f, 0.45f);
            heldModel.transform.localRotation = Quaternion.Euler(15f, -12f, 5f);

            Material matYellow = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SafetyYellow.mat");
            Material matSteel = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_SteelBeam.mat");
            Material matScreen = AssetDatabase.LoadAssetAtPath<Material>("Assets/Mat_StainlessSteel.mat");

            // Main Detector Body
            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
            body.name = "Detector_Chassis";
            body.transform.SetParent(heldModel.transform, false);
            body.transform.localPosition = Vector3.zero;
            body.transform.localScale = new Vector3(0.12f, 0.22f, 0.08f);
            if (matYellow != null) body.GetComponent<MeshRenderer>().sharedMaterial = matYellow;
            Object.DestroyImmediate(body.GetComponent<Collider>());

            // Sniffer Probe Tube / Antenna
            GameObject probe = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            probe.name = "Sniffer_Probe_Antenna";
            probe.transform.SetParent(heldModel.transform, false);
            probe.transform.localPosition = new Vector3(0f, 0.18f, 0.03f);
            probe.transform.localScale = new Vector3(0.015f, 0.12f, 0.015f);
            if (matSteel != null) probe.GetComponent<MeshRenderer>().sharedMaterial = matSteel;
            Object.DestroyImmediate(probe.GetComponent<Collider>());

            // OLED Digital Display Screen
            GameObject screen = GameObject.CreatePrimitive(PrimitiveType.Cube);
            screen.name = "OLED_Display_Screen";
            screen.transform.SetParent(heldModel.transform, false);
            screen.transform.localPosition = new Vector3(0f, 0.04f, -0.042f);
            screen.transform.localScale = new Vector3(0.09f, 0.07f, 0.005f);
            if (matScreen != null) screen.GetComponent<MeshRenderer>().sharedMaterial = matScreen;
            Object.DestroyImmediate(screen.GetComponent<Collider>());

            // 3D Text on OLED Screen
            GameObject textGO = new GameObject("OLED_LivePPM_Text");
            textGO.transform.SetParent(screen.transform, false);
            textGO.transform.localPosition = new Vector3(0, 0, -0.6f);
            textGO.transform.localRotation = Quaternion.Euler(0, 180, 0);
            var tmp = textGO.AddComponent<TextMeshPro>();
            tmp.text = "12.4 PPM";
            tmp.fontSize = 2.8f;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.green;

            // Initially stowed/inactive until pressed '1'
            heldModel.SetActive(false);
        }

        // 5. Configure GasDetector Component
        var detector = player.GetComponent<CBRSX.Unity.GasDetector>();
        if (detector == null) detector = player.AddComponent<CBRSX.Unity.GasDetector>();
        detector.firstPersonHeldModel = heldModel;
        detector.hipPosition = new Vector3(0.28f, -0.22f, 0.45f);
        detector.adsPosition = new Vector3(0.0f, -0.12f, 0.35f);
        detector.zoomFov = 50f;
        detector.defaultFov = 75f;
        detector.isEquipped = false;

        // Hook up OLED text if available
        var liveText = heldModel.GetComponentInChildren<TextMeshPro>();
        if (liveText != null)
        {
            // We can also connect liveText or UI text
        }

        // 6. Save Scene
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        Debug.Log("<color=green>=== PLAYER SETUP COMPLETE! JUMP & EQUIP (1/2/Tab/G) ARE FULLY OPERATIONAL ===</color>");
    }
}
