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

Write-Host "==> Starting CBRS-X Backend on :8080 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$PSScriptRoot\backend'; mvn spring-boot:run"

Start-Sleep -Seconds 3

Write-Host "==> Starting Instructor Dashboard on :3000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$PSScriptRoot\dashboard'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "==> Starting Trainee VR View on :5000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$PSScriptRoot\trainee_view'; npm run dev"

Write-Host ""
Write-Host "All services launching:" -ForegroundColor Green
Write-Host "  Backend   : http://localhost:8080"
Write-Host "  Dashboard : http://localhost:3000"
Write-Host "  Trainee   : http://localhost:5000"
