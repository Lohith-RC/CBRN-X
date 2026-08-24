using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
using System.IO;

public static class CbrsxBuildAutomation
{
    private static readonly string[] Scenes = new[] { "Assets/Scenes/StorageBay03_Training.unity" };

    [MenuItem("CBRS-X/Build/Windows Standalone (Live)")]
    public static void BuildWindows()
    {
        string buildPath = "Builds/Windows/CBRS-X_Simulation.exe";
        string dir = Path.GetDirectoryName(buildPath);
        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = Scenes,
            locationPathName = buildPath,
            target = BuildTarget.StandaloneWindows64,
            targetGroup = BuildTargetGroup.Standalone,
            options = BuildOptions.None
        };

        BuildReport report = BuildPipeline.BuildPlayer(options);
        Debug.Log($"[CBRS-X] Windows Standalone build finished with result: {report.summary.result} (Total size: {report.summary.totalSize} bytes)");
    }

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
    }
}
