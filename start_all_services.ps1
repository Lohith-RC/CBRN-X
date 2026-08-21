Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " CBRS-X -- Launching Multi-Port Architecture (8080, 3000, 5000)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

Write-Host "[1/3] Starting Spring Boot Core Backend Engine on Port 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; mvn spring-boot:run"

Write-Host "[2/3] Starting Admin Dashboard on Port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\dashboard'; npm run dev"

Write-Host "[3/3] Starting Trainee VR Simulation Interface on Port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\trainee_view'; npm run dev"

Write-Host "===========================================================" -ForegroundColor Green
Write-Host " ALL SERVICES LAUNCHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host " 1. Backend Engine API : http://localhost:8080" -ForegroundColor Green
Write-Host " 2. Admin Dashboard UI : http://localhost:3000" -ForegroundColor Green
Write-Host " 3. Trainee VR Vision  : http://localhost:5000" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
