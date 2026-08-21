# ===============================================================
# CBRS-X Multi-Port Service Launcher Script (PowerShell)
# Launches Backend (8080), Admin View (3000), Trainee View (5000)
# ===============================================================

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " CBRS-X — Launching Multi-Port Architecture (8080, 3000, 5000)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Start Backend Engine on Port 8080 in Background Job
Write-Host "[1/3] Starting Spring Boot Core Backend Engine on Port 8080..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\backend'; mvn spring-boot:run`""

# 2. Start Admin Dashboard on Port 3000 in Background Job
Write-Host "[2/3] Starting Admin / Instructor Dashboard on Port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\dashboard'; npm run dev`""

# 3. Start Trainee VR View on Port 5000 in Background Job
Write-Host "[3/3] Starting Trainee VR Simulation Interface on Port 5000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\trainee_view'; npm install; npm run dev`""

Write-Host "===========================================================" -ForegroundColor Green
Write-Host " ALL SERVICES LAUNCHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host " ---------------------------------------------------------" -ForegroundColor Green
Write-Host " 1. Backend Engine API : http://localhost:8080" -ForegroundColor Green
Write-Host " 2. Admin Dashboard UI : http://localhost:3000" -ForegroundColor Green
Write-Host " 3. Trainee VR Vision  : http://localhost:5000" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
