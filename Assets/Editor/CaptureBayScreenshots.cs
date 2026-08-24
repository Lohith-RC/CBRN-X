using UnityEngine;
using UnityEditor;
using System.IO;

namespace CBRSX.EditorTools
{
    public static class CaptureBayScreenshots
    {
        [MenuItem("CBRS-X/Capture All Cinematic Screenshots")]
        public static void CaptureAll()
        {
            string baseDir = Path.Combine(Directory.GetCurrentDirectory(), "Bay03_Cinematic_Screenshots");

            string dirWide = Path.Combine(baseDir, "01_Wide_Establishing_Shots");
            string dirCardinal = Path.Combine(baseDir, "02_Cardinal_Bay_Angles");
            string dirCloseups = Path.Combine(baseDir, "03_Interactive_Stations_Closeups");
            string dirFPS = Path.Combine(baseDir, "04_FirstPerson_Perspective");

            Directory.CreateDirectory(dirWide);
            Directory.CreateDirectory(dirCardinal);
            Directory.CreateDirectory(dirCloseups);
            Directory.CreateDirectory(dirFPS);

            GameObject camObj = new GameObject("TEMP_CINEMATIC_CAMERA");
            Camera cam = camObj.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.Skybox;
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 150f;

            int width = 1920;
            int height = 1080;
            RenderTexture rt = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            rt.antiAliasing = 8;
            cam.targetTexture = rt;
            Texture2D tex = new Texture2D(width, height, TextureFormat.RGB24, false);

            System.Action<Vector3, Vector3, float, string> capture = (pos, rotEuler, fov, relPath) =>
            {
                cam.transform.position = pos;
                cam.transform.rotation = Quaternion.Euler(rotEuler);
                cam.fieldOfView = fov;

                cam.Render();
                RenderTexture.active = rt;
                tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                tex.Apply();
                RenderTexture.active = null;

                byte[] bytes = tex.EncodeToPNG();
                string fullPath = Path.Combine(baseDir, relPath);
                File.WriteAllBytes(fullPath, bytes);
                Debug.Log($"[CBRS-X Capture] Saved: {relPath}");
            };

            // 01. Wide Establishing Shots
            capture(new Vector3(0.5f, 5.5f, -4.5f), new Vector3(28f, 0f, 0f), 65f, "01_Wide_Establishing_Shots/01_Wide_Isometric_Overview.png");
            capture(new Vector3(0.65f, 11.5f, 6.5f), new Vector3(90f, 0f, 0f), 70f, "01_Wide_Establishing_Shots/02_TopDown_Tactical_Grid.png");
            capture(new Vector3(-6.5f, 5.2f, -1.0f), new Vector3(26f, 48f, 0f), 65f, "01_Wide_Establishing_Shots/03_CCTV_Bay_Overview.png");
            capture(new Vector3(4.5f, 6.0f, 10.5f), new Vector3(32f, -145f, 0f), 70f, "01_Wide_Establishing_Shots/04_LoadingBay_Exterior_To_Interior.png");

            // 02. Cardinal Bay Angles
            capture(new Vector3(0.65f, 2.0f, 2.0f), new Vector3(10f, 0f, 0f), 60f, "02_Cardinal_Bay_Angles/05_North_Piping_Manifold_And_Hazard_Wall.png");
            capture(new Vector3(0.65f, 2.2f, 9.8f), new Vector3(14f, 180f, 0f), 65f, "02_Cardinal_Bay_Angles/06_South_Responder_Staging_Area.png");
            capture(new Vector3(2.5f, 2.2f, 7.2f), new Vector3(12f, 65f, 0f), 55f, "02_Cardinal_Bay_Angles/07_East_Inflatable_Decon_Shower_Station.png");
            capture(new Vector3(-2.5f, 2.4f, 7.0f), new Vector3(14f, -75f, 0f), 58f, "02_Cardinal_Bay_Angles/08_West_Industrial_Pallet_Racks_And_IBC_Totes.png");

            // 03. Interactive Stations Closeups
            capture(new Vector3(0.65f, 1.1f, 5.2f), new Vector3(15f, 0f, 0f), 45f, "03_Interactive_Stations_Closeups/09_Chemical_Spill_Pallet_And_Leaking_Drum.png");
            capture(new Vector3(-2.0f, 1.55f, 4.2f), new Vector3(8f, -48f, 0f), 42f, "03_Interactive_Stations_Closeups/10_WallMount_Spill_Containment_Kit.png");
            capture(new Vector3(-2.2f, 2.45f, 4.4f), new Vector3(6f, -45f, 0f), 38f, "03_Interactive_Stations_Closeups/11_Handheld_Gas_Detector_Charging_Dock.png");
            capture(new Vector3(-1.2f, 1.4f, 4.8f), new Vector3(12f, -50f, 0f), 45f, "03_Interactive_Stations_Closeups/12_Tripod_LED_Floodlight_Lighting.png");
            capture(new Vector3(2.0f, 1.6f, 8.2f), new Vector3(10f, 35f, 0f), 42f, "03_Interactive_Stations_Closeups/13_Emergency_EyeWash_And_Drench_Shower.png");
            capture(new Vector3(4.8f, 1.5f, 5.2f), new Vector3(6f, 0f, 0f), 50f, "03_Interactive_Stations_Closeups/14_Decon_Shower_Wash_Chamber.png");

            // 04. First-Person Perspective
            capture(new Vector3(0.0f, 1.7f, -3.5f), new Vector3(4f, 0f, 0f), 75f, "04_FirstPerson_Perspective/15_Responder_Spawn_FirstPerson_View.png");
            capture(new Vector3(0.65f, 1.7f, 3.8f), new Vector3(12f, 0f, 0f), 70f, "04_FirstPerson_Perspective/16_Responder_Approaching_HotZone_View.png");

            cam.targetTexture = null;
            RenderTexture.active = null;
            Object.DestroyImmediate(rt);
            Object.DestroyImmediate(tex);
            Object.DestroyImmediate(camObj);

            Debug.Log("[CBRS-X Capture] Completed rendering all 16 cinematic screenshots.");
        }
    }
}
