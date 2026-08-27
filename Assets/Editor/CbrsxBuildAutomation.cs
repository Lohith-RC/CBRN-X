using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
using System.IO;

public static class CbrsxBuildAutomation
{
    private static readonly string[] Scenes = new[] { "Assets/Scenes/StorageBay03_Training.unity" };

    [MenuItem("CBRS-X/Build/WebGL (Live Web Dashboard)")]
    public static void BuildWebGL()
    {
        string buildPath = "Builds/WebGL";
        if (!Directory.Exists(buildPath)) Directory.CreateDirectory(buildPath);

        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
        PlayerSettings.WebGL.decompressionFallback = true;
        PlayerSettings.WebGL.memorySize = 512;

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = Scenes,
            locationPathName = buildPath,
            target = BuildTarget.WebGL,
            targetGroup = BuildTargetGroup.WebGL,
            options = BuildOptions.None
        };

        BuildReport report = BuildPipeline.BuildPlayer(options);
        Debug.Log($"[CBRS-X] WebGL build finished with result: {report.summary.result} (Total size: {report.summary.totalSize} bytes)");

        if (report.summary.result == BuildResult.Succeeded)
        {
            SyncToPublicFolders(buildPath);
        }
    }

    public static void SyncToPublicFolders(string sourceDir = "Builds/WebGL")
    {
        string[] targets = new[] {
            "dashboard/public/unity-sim",
            "trainee_view/public/unity-sim"
        };

        foreach (var target in targets)
        {
            string absTarget = Path.GetFullPath(target);
            if (!Directory.Exists(absTarget)) Directory.CreateDirectory(absTarget);
            CopyDirectory(Path.GetFullPath(sourceDir), absTarget);
            Debug.Log($"[CBRS-X] Synchronized WebGL build to: {absTarget}");
        }
    }

    private static void CopyDirectory(string sourceDir, string targetDir)
    {
        foreach (string dirPath in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
        {
            Directory.CreateDirectory(dirPath.Replace(sourceDir, targetDir));
        }

        foreach (string newPath in Directory.GetFiles(sourceDir, "*.*", SearchOption.AllDirectories))
        {
            File.Copy(newPath, newPath.Replace(sourceDir, targetDir), true);
        }
    }
}
