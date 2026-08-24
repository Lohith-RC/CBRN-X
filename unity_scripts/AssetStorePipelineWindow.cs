using UnityEngine;
using UnityEditor;
using System.IO;
using System.Collections.Generic;

namespace CBRSX.EditorTools
{
    /// <summary>
    /// AssetStorePipelineWindow — Unity Editor GUI for discovering, importing, and standardizing Asset Store packages.
    /// </summary>
    public class AssetStorePipelineWindow : EditorWindow
    {
        private Vector2 scrollPos;
        private List<PackageInfo> cachedPackages = new List<PackageInfo>();
        private string searchFilter = "";
        private bool autoUpgradeMaterialsToURP = true;

        public struct PackageInfo
        {
            public string name;
            public string publisher;
            public string filePath;
            public float sizeMb;
        }

        [MenuItem("Window/CBRS-X/Asset Store Pipeline Manager")]
        public static void ShowWindow()
        {
            var window = GetWindow<AssetStorePipelineWindow>("Asset Pipeline Manager");
            window.minSize = new Vector2(550, 400);
            window.ScanCache();
        }

        private void OnEnable()
        {
            ScanCache();
        }

        private void ScanCache()
        {
            cachedPackages.Clear();
            string appData = System.Environment.GetFolderPath(System.Environment.SpecialFolder.ApplicationData);
            string cachePath = Path.Combine(appData, "Unity", "Asset Store-5.x");

            if (!Directory.Exists(cachePath)) return;

            string[] files = Directory.GetFiles(cachePath, "*.unitypackage", SearchOption.AllDirectories);
            foreach (var f in files)
            {
                FileInfo fi = new FileInfo(f);
                string rel = f.Substring(cachePath.Length).TrimStart(Path.DirectorySeparatorChar);
                string[] parts = rel.Split(Path.DirectorySeparatorChar);
                string publisher = parts.Length > 1 ? parts[0] : "General";

                cachedPackages.Add(new PackageInfo
                {
                    name = Path.GetFileNameWithoutExtension(f),
                    publisher = publisher,
                    filePath = f,
                    sizeMb = (float)System.Math.Round(fi.Length / (1024f * 1024f), 2)
                });
            }
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(10);
            EditorGUILayout.LabelField("Unity Asset Store Integration Pipeline", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox("Discover cached .unitypackage assets on this workstation, import them with one click, and automatically upgrade legacy Built-in shaders to Universal Render Pipeline (URP).", MessageType.Info);

            EditorGUILayout.Space(5);
            EditorGUILayout.BeginHorizontal();
            searchFilter = EditorGUILayout.TextField("Search Packages", searchFilter);
            if (GUILayout.Button("Refresh Cache", GUILayout.Width(110)))
            {
                ScanCache();
            }
            EditorGUILayout.EndHorizontal();

            autoUpgradeMaterialsToURP = EditorGUILayout.Toggle("Auto-Upgrade Materials to URP", autoUpgradeMaterialsToURP);

            EditorGUILayout.Space(10);
            EditorGUILayout.LabelField($"Available Cached Packages ({cachedPackages.Count}):", EditorStyles.boldLabel);

            scrollPos = EditorGUILayout.BeginScrollView(scrollPos);

            foreach (var pkg in cachedPackages)
            {
                if (!string.IsNullOrEmpty(searchFilter) && !pkg.name.ToLower().Contains(searchFilter.ToLower()) && !pkg.publisher.ToLower().Contains(searchFilter.ToLower()))
                    continue;

                EditorGUILayout.BeginVertical(EditorStyles.helpBox);
                EditorGUILayout.BeginHorizontal();

                EditorGUILayout.BeginVertical();
                EditorGUILayout.LabelField(pkg.name, EditorStyles.boldLabel);
                EditorGUILayout.LabelField($"Publisher: {pkg.publisher}  |  Size: {pkg.sizeMb} MB", EditorStyles.miniLabel);
                EditorGUILayout.EndVertical();

                if (GUILayout.Button("Import to Project", GUILayout.Width(130), GUILayout.Height(28)))
                {
                    ImportPackage(pkg.filePath);
                }

                EditorGUILayout.EndHorizontal();
                EditorGUILayout.EndVertical();
                EditorGUILayout.Space(2);
            }

            EditorGUILayout.EndScrollView();

            EditorGUILayout.Space(10);
            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Run URP Material Auto-Converter on Assets", GUILayout.Height(30)))
            {
                UpgradeAllProjectMaterialsToURP();
            }
            if (GUILayout.Button("Enforce Scene Hierarchy Best Practices", GUILayout.Height(30)))
            {
                EnforceHierarchyBestPractices();
            }
            EditorGUILayout.EndHorizontal();
            EditorGUILayout.Space(5);
        }

        private void ImportPackage(string packagePath)
        {
            Debug.Log($"[CBRS-X Pipeline] Importing package: {packagePath}");
            AssetDatabase.ImportPackage(packagePath, false);
            AssetDatabase.Refresh();

            if (autoUpgradeMaterialsToURP)
            {
                UpgradeAllProjectMaterialsToURP();
            }
        }

        public static void UpgradeAllProjectMaterialsToURP()
        {
            Shader urpLitShader = Shader.Find("Universal Render Pipeline/Lit");
            if (urpLitShader == null)
            {
                Debug.LogWarning("[CBRS-X Pipeline] Universal Render Pipeline/Lit shader not found in project.");
                return;
            }

            string[] matGuids = AssetDatabase.FindAssets("t:Material", new[] { "Assets" });
            int convertedCount = 0;

            foreach (var guid in matGuids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);

                if (mat != null && mat.shader != null)
                {
                    string shaderName = mat.shader.name;
                    if (shaderName.Contains("Standard") || shaderName.Contains("Legacy Shaders") || shaderName.Contains("Mobile/Diffuse"))
                    {
                        Color prevCol = mat.HasProperty("_Color") ? mat.color : Color.white;
                        Texture prevTex = mat.HasProperty("_MainTex") ? mat.mainTexture : null;

                        mat.shader = urpLitShader;

                        if (prevTex != null && mat.HasProperty("_BaseMap"))
                            mat.SetTexture("_BaseMap", prevTex);
                        if (mat.HasProperty("_BaseColor"))
                            mat.SetColor("_BaseColor", prevCol);

                        EditorUtility.SetDirty(mat);
                        convertedCount++;
                    }
                }
            }

            AssetDatabase.SaveAssets();
            Debug.Log($"[CBRS-X Pipeline] Upgraded {convertedCount} materials to Universal Render Pipeline (URP Lit).");
        }

        public static void EnforceHierarchyBestPractices()
        {
            string[] standardCategories = new string[] {
                "--- ENVIRONMENT & ARCHITECTURE ---",
                "--- LIGHTING & ATMOSPHERE ---",
                "--- INTERACTIVE STATIONS ---",
                "--- ACTORS & NPCS ---",
                "--- MANAGERS & SYSTEMS ---",
                "--- TACTICAL_CCTV_CAMERAS ---"
            };

            foreach (var cat in standardCategories)
            {
                if (GameObject.Find(cat) == null)
                {
                    new GameObject(cat);
                    Debug.Log($"[CBRS-X Pipeline] Created standard hierarchy parent: {cat}");
                }
            }
        }
    }
}
