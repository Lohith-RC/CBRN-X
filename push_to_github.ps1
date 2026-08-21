# =======================================================
# CBRS-X Git Push Helper Script for PowerShell
# Remote Repository: https://github.com/Lohith-RC/CBRN-X.git
# =======================================================

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " CBRS-X — Pushing Clean Codebase to GitHub " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Initialize Git repository if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Initializing Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "[1/5] Git repository already initialized." -ForegroundColor Green
}

# 2. Configure Remote URL
$remoteUrl = "https://github.com/Lohith-RC/CBRN-X.git"
$currentRemote = git remote get-url origin 2>$null
if ($null -eq $currentRemote -or $currentRemote -ne $remoteUrl) {
    Write-Host "[2/5] Setting remote origin to $remoteUrl..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin $remoteUrl
} else {
    Write-Host "[2/5] Remote origin is correctly configured." -ForegroundColor Green
}

# 3. Rename default branch to main
git branch -M main

# 4. Stage source files (excluding ignored build artifacts via .gitignore)
Write-Host "[3/5] Staging codebase files..." -ForegroundColor Yellow
git add .gitignore
git add README.md 2>$null
git add backend/src/
git add backend/pom.xml
git add dashboard/src/
git add dashboard/public/ 2>$null
git add dashboard/package.json
git add dashboard/index.html
git add dashboard/vite.config.js
git add unity_scripts/
git add *.md

# 5. Commit & Push
Write-Host "[4/5] Creating commit..." -ForegroundColor Yellow
git commit -m "feat(cbrsx): Initial release - Spring Boot scoring engine, React Dashboard & Unity VR scripts"

Write-Host "[5/5] Pushing to GitHub (main branch)..." -ForegroundColor Yellow
git push -u origin main

Write-Host "===============================================" -ForegroundColor Green
Write-Host " Successfully pushed CBRS-X to GitHub!" -ForegroundColor Green
Write-Host " Repository: $remoteUrl" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
