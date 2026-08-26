@echo off
REM CBRS-X Unity WebGL Build Deduplication Script for Windows

setlocal enabledelayedexpansion

set UNITY_BUILD_DIR=dashboard\public\unity-sim
set TRAINEE_DIR=trainee_view\public\unity-sim

echo [CBRS-X] Starting Unity WebGL build deduplication...

REM Check if Unity build exists
if not exist "%UNITY_BUILD_DIR%\index.html" (
    echo ERROR: Unity WebGL build not found at %UNITY_BUILD_DIR%
    echo Please export the Unity project to WebGL first.
    exit /b 1
)

REM Check if trainee_view needs update
if not exist "%TRAINEE_DIR%\index.html" (
    echo [CBRS-X] Copying Unity build to trainee_view...
    xcopy "%UNITY_BUILD_DIR%\*" "%TRAINEE_DIR%\" /E /I /Y /Q
    echo [CBRS-X] Trainee view updated.
) else (
    echo [CBRS-X] Verifying build integrity...
    fc /B "%UNITY_BUILD_DIR%\index.html" "%TRAINEE_DIR%\index.html" >nul 2>&1
    if errorlevel 1 (
        echo [CBRS-X] Build drift detected. Updating trainee_view...
        rmdir /S /Q "%TRAINEE_DIR%"
        xcopy "%UNITY_BUILD_DIR%\*" "%TRAINEE_DIR%\" /E /I /Y /Q
        echo [CBRS-X] Trainee view synchronized.
    ) else (
        echo [CBRS-X] Trainee view is already in sync.
    )
)

echo [CBRS-X] Build deduplication completed.
endlocal
