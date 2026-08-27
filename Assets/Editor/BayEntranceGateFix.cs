using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

/// <summary>
/// BayEntranceGateFix — Removes blocking colliders from gate primitives
/// that prevent the player from entering the Bay area.
/// Also clears any other primitives whose colliders block walkable paths.
/// </summary>
public class BayEntranceGateFix
{
    [MenuItem("CBRN-X/Fix Bay Entrance Colliders")]
    public static void FixBayEntranceColliders()
    {
        string scenePath = "Assets/Scenes/StorageBay03_Training.unity";
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

        Debug.Log("<color=cyan>=== FIXING BAY ENTRANCE BLOCKING COLLIDERS ===</color>");

        int fixedCount = 0;

        // 1. Fix Gate Leaf colliders — make them triggers or remove them
        string[] gateObjectNames = new string[]
        {
            "Gate_Leaf_Left",
            "Gate_Leaf_Right",
            "Gate_Hazard_Bar_L",
            "Gate_Hazard_Bar_R"
        };

        foreach (string gateName in gateObjectNames)
        {
            GameObject gateObj = GameObject.Find(gateName);
            if (gateObj != null)
            {
                Collider col = gateObj.GetComponent<Collider>();
                if (col != null)
                {
                    Object.DestroyImmediate(col);
                    fixedCount++;
                    Debug.Log($"  Removed blocking collider from: {gateName}");
                }
            }
        }

        // 2. Fix containment berm colliders that are too high and block walking
        // Berms should be step-overable (CharacterController stepOffset = 0.35)
        // but their colliders might extend too high
        GameObject[] allObjects = Object.FindObjectsByType<GameObject>();
        foreach (var obj in allObjects)
        {
            if (obj.name.StartsWith("Berm_"))
            {
                BoxCollider bc = obj.GetComponent<BoxCollider>();
                if (bc != null)
                {
                    // Berms are 0.24m tall which should be step-overable
                    // Just ensure they aren't accidentally scaled up
                    if (obj.transform.lossyScale.y > 0.3f)
                    {
                        Debug.Log($"  Berm '{obj.name}' scale Y={obj.transform.lossyScale.y:F2} might block. Making trigger.");
                        bc.isTrigger = true;
                        fixedCount++;
                    }
                }
            }
        }

        // 3. Fix any overhead sign/door primitives that might extend down into walkable space
        string[] overheadFixNames = new string[]
        {
            "RollUp_Door_Panel",
            "Sign_Background_Panel"
        };

        foreach (string name in overheadFixNames)
        {
            GameObject obj = GameObject.Find(name);
            if (obj != null)
            {
                // Check if the bottom edge extends below 2.0m (player height + margin)
                Collider col = obj.GetComponent<Collider>();
                if (col != null)
                {
                    float bottomY = col.bounds.min.y;
                    if (bottomY < 2.0f)
                    {
                        Debug.Log($"  Object '{name}' bottom at Y={bottomY:F2} may block. Removing collider.");
                        Object.DestroyImmediate(col);
                        fixedCount++;
                    }
                }
            }
        }

        // 4. Widen the gate opening if leaves overlap the walk path
        // Move gate leaves further apart to ensure >1.0m gap
        GameObject leftLeaf = GameObject.Find("Gate_Leaf_Left");
        GameObject rightLeaf = GameObject.Find("Gate_Leaf_Right");
        if (leftLeaf != null && rightLeaf != null)
        {
            // Current positions: left at x=-3.2, right at x=3.8 → gap of 7.0m
            // But the leaves themselves are 3.6m wide, so:
            // Left leaf spans: -3.2 ± 1.8 = [-5.0, -1.4]
            // Right leaf spans: 3.8 ± 1.8 = [2.0, 5.6]
            // Gap between leaves: -1.4 to 2.0 = 3.4m gap — should be fine
            // If still blocking, push them further apart
            float gap = rightLeaf.transform.position.x - leftLeaf.transform.position.x;
            if (gap < 4.0f)
            {
                leftLeaf.transform.position += Vector3.left * 1.0f;
                rightLeaf.transform.position += Vector3.right * 1.0f;
                Debug.Log($"  Widened gate gap from {gap:F1}m to {gap + 2.0f:F1}m");
                fixedCount++;
            }
        }

        // 5. Ensure Player tag is set on the player object (needed for DeconStation trigger)
        GameObject player = GameObject.Find("Player_FirstPersonResponder");
        if (player != null && !player.CompareTag("Player"))
        {
            // Check if "Player" tag exists before assigning
            try
            {
                player.tag = "Player";
                Debug.Log("  Set Player tag on Player_FirstPersonResponder");
                fixedCount++;
            }
            catch
            {
                Debug.LogWarning("  'Player' tag not defined in Tag Manager. Add it manually.");
            }
        }

        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);

        Debug.Log($"<color=green>=== BAY ENTRANCE FIX COMPLETE: {fixedCount} colliders fixed ===</color>");
    }
}
