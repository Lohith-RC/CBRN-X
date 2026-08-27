# ══════════════════════════════════════════════════════════════════════════
# CBRS-X - Master Development Services Launcher (PowerShell)
# Launches: Backend (:8080), Instructor Dashboard (:3000), Trainee VR Station (:5000)
# ══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'

if (-not $PSScriptRoot) {
    Write-Host "[ERROR] Run this script directly from its file location." -ForegroundColor Red
    exit 1
}

Set-Location -LiteralPath $PSScriptRoot

function Test-Executable([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " ☣️  CBRS-X TACTICAL SIMULATION PLATFORM (SIH260088)" -ForegroundColor Cyan
Write-Host " Initializing local development runtime environment..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# ── 1. Node.js & NPM Verification ──────────────────────────────────────────
$missingNodeTools = @()
foreach ($tool in @('node', 'npm')) {
    if (-not (Test-Executable $tool)) { $missingNodeTools += $tool }
}
if ($missingNodeTools.Count -gt 0) {
    Write-Host "[ERROR] Missing required Node.js tools on PATH: $($missingNodeTools -join ', ')" -ForegroundColor Red
    Write-Host "        Please install Node.js 18+ (e.g., winget install OpenJS.NodeJS.LTS)" -ForegroundColor Yellow
    exit 1
}

# ── 2. Smart JDK 17+ Discovery ─────────────────────────────────────────────
$jdkFound = $false
if (Test-Executable 'java') {
    $jdkFound = $true
} else {
    $candidateJdkPaths = @(
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Java\jdk-21*",
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Eclipse Adoptium\jdk-21*",
        "C:\Program Files\Microsoft\jdk-17*",
        "C:\Program Files\Amazon Corretto\jdk-17*",
        "C:\Program Files\Zulu\zulu-17*",
        "$env:USERPROFILE\.jdks\corretto-17*",
        "$env:USERPROFILE\.jdks\temurin-17*"
    )
    foreach ($pattern in $candidateJdkPaths) {
        $matching = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
        if ($matching -and $matching.Count -gt 0) {
            $env:JAVA_HOME = $matching[0].FullName
            $env:Path = "$env:JAVA_HOME\bin;$env:Path"
            $jdkFound = $true
            Write-Host "[OK] Detected JDK at: $env:JAVA_HOME" -ForegroundColor Green
            break
        }
    }
}

if (-not $jdkFound) {
    Write-Host "[WARNING] Java 17+ was not automatically found on PATH or standard directories." -ForegroundColor Yellow
    Write-Host "          Backend requires Java 17+ JDK (winget install EclipseAdoptium.Temurin.17.JDK)" -ForegroundColor Yellow
}

# ── 3. Maven / Maven Wrapper Selection ────────────────────────────────────
$useMvnw = $false
if (Test-Executable 'mvn') {
    $mvnRunner = "mvn"
} elseif (Test-Path "$PSScriptRoot\backend\mvnw.cmd") {
    $mvnRunner = ".\mvnw.cmd"
    $useMvnw = $true
    Write-Host "[OK] Using bundled Maven Wrapper (backend/mvnw.cmd)." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Neither 'mvn' nor 'backend/mvnw.cmd' was found." -ForegroundColor Red
    exit 1
}

# ── 4. Launch Spring Boot Backend (:8080) ─────────────────────────────────
Write-Host "`n[1/3] Starting Spring Boot Telemetry & Scoring Backend on :8080 ..." -ForegroundColor Cyan
$backendDir = "$PSScriptRoot\backend"
$javaSetupSnippet = if ($env:JAVA_HOME) { "`$env:JAVA_HOME = '$env:JAVA_HOME'; `$env:Path = ""`"`$env:JAVA_HOME\bin;`$env:Path`"`"; " } else { "" }
$backendCommand = "& { Set-Location '$backendDir'; $javaSetupSnippet if (Test-Path 'mvnw.cmd') { .\mvnw.cmd spring-boot:run } else { mvn spring-boot:run } }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

Start-Sleep -Seconds 3

# ── 5. Launch Instructor Dashboard (:3000) ────────────────────────────────
Write-Host "[2/3] Starting Instructor Command Dashboard on :3000 ..." -ForegroundColor Cyan
$dashboardDir = "$PSScriptRoot\dashboard"
$dashboardCommand = "& { Set-Location '$dashboardDir'; npm run dev }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $dashboardCommand

Start-Sleep -Seconds 2

# ── 6. Launch Trainee VR Station (:5000) ──────────────────────────────────
Write-Host "[3/3] Starting Trainee 3D VR Simulation Station on :5000 ..." -ForegroundColor Cyan
$traineeDir = "$PSScriptRoot\trainee_view"
$traineeCommand = "& { Set-Location '$traineeDir'; npm run dev }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $traineeCommand

# ── 7. Summary & Ready Status ─────────────────────────────────────────────
Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " 🚀 All CBRS-X services dispatched successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  • Backend API & WebSocket   : http://localhost:8080"
Write-Host "  • Instructor Dashboard      : http://localhost:3000"
Write-Host "  • Trainee VR Web Station    : http://localhost:5000"
Write-Host "  • Unity 3D WebGL Simulation : http://localhost:3000/unity-sim/index.html"
Write-Host "  • Default Admin Credentials : username=admin / password=ndrf-admin-123"
Write-Host "============================================================`n"
