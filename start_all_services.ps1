# CBRS-X - Start All Services (Development Mode)
# Launches backend (8080), instructor dashboard (3000), and trainee view (5000).

$ErrorActionPreference = 'Stop'

if (-not $PSScriptRoot) {
    Write-Host "[ERROR] Run this script from its own file location (right-click may not populate PSScriptRoot)." -ForegroundColor Red
    exit 1
}

Set-Location -LiteralPath $PSScriptRoot

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

$missing = @()
foreach ($tool in @('mvn', 'npm', 'node', 'java')) {
    if (-not (Test-Command $tool)) { $missing += $tool }
}
if ($missing.Count -gt 0) {
    Write-Host "[ERROR] Missing required tools on PATH: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

# Prefer JDK 17 if available
if (Test-Path "C:\Program Files\Java\jdk-17") {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
} elseif (Test-Path "C:\Program Files\Eclipse Adoptium\jdk-17*") {
    $jdkPath = (Get-ChildItem "C:\Program Files\Eclipse Adoptium\jdk-17*")[0].FullName
    $env:JAVA_HOME = $jdkPath
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

Write-Host "==> Starting CBRS-X Backend on :8080 ..." -ForegroundColor Cyan
$backendCmd = "& { Set-Location '$PSScriptRoot\backend'; if (Test-Path 'C:\Program Files\Java\jdk-17') { `$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'; `$env:Path = ""`"`$env:JAVA_HOME\bin;`$env:Path`"`" }; mvn spring-boot:run }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 3

Write-Host "==> Starting Instructor Dashboard on :3000 ..." -ForegroundColor Cyan
$dashboardCmd = "& { Set-Location '$PSScriptRoot\dashboard'; npm run dev }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $dashboardCmd

Start-Sleep -Seconds 2

Write-Host "==> Starting Trainee VR View on :5000 ..." -ForegroundColor Cyan
$traineeCmd = "& { Set-Location '$PSScriptRoot\trainee_view'; npm run dev }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $traineeCmd

Write-Host ""
Write-Host "All services launching:" -ForegroundColor Green
Write-Host "  Backend   : http://localhost:8080"
Write-Host "  Dashboard : http://localhost:3000"
Write-Host "  Trainee   : http://localhost:5000"
