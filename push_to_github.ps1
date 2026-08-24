# =======================================================
# CBRS-X Git Push Helper Script for PowerShell
# Stages the full source tree (respecting .gitignore),
# commits, and pushes to origin.
# =======================================================

$ErrorActionPreference = 'Stop'

if (-not $PSScriptRoot) {
    Write-Host "[ERROR] Run this script from its own file location." -ForegroundColor Red
    exit 1
}
Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Initializing Git repository..." -ForegroundColor Yellow
    git init | Out-Null
} else {
    Write-Host "[1/5] Git repository already initialized." -ForegroundColor Green
}

# 2. Configure Remote URL (override with CBRSX_REMOTE env var if needed)
$remoteUrl = if ($env:CBRSX_REMOTE) { $env:CBRSX_REMOTE } else { "https://github.com/Lohith-RC/CBRN-X.git" }
$currentRemote = git remote get-url origin 2>$null
if ($null -eq $currentRemote) {
    Write-Host "[2/5] Adding remote origin: $remoteUrl" -ForegroundColor Yellow
    git remote add origin $remoteUrl
} elseif ($currentRemote -ne $remoteUrl) {
    Write-Host "[2/5] Updating remote origin to: $remoteUrl" -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
} else {
    Write-Host "[2/5] Remote origin is correctly configured." -ForegroundColor Green
}

# 3. Ensure we are on main (create only when missing; never force-rename a feature branch)
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $branch -or $branch -eq 'HEAD') {
    git checkout -b main | Out-Null
    Write-Host "[3/5] Created branch 'main'." -ForegroundColor Yellow
} elseif ($branch -ne 'main') {
    Write-Host "[WARNING] Current branch is '$branch' (not main). Pushing to '$branch'." -ForegroundColor Yellow
} else {
    Write-Host "[3/5] On branch 'main'." -ForegroundColor Green
}

# 4. Stage EVERYTHING not ignored by .gitignore (single source of truth)
Write-Host "[4/5] Staging all tracked/untracked source files per .gitignore ..." -ForegroundColor Yellow
git add -A

$status = git status --porcelain
if (-not $status) {
    Write-Host "Nothing to commit - working tree clean." -ForegroundColor Green
    exit 0
}

# 5. Commit & Push
$commitMessage = if ($env:CBRSX_COMMIT_MSG) { $env:CBRSX_COMMIT_MSG } else { "chore(cbrsx): sync source tree" }
Write-Host "[5/5] Committing and pushing to '$branch' ..." -ForegroundColor Yellow
git commit -m $commitMessage
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] git push failed. Check credentials/network and retry." -ForegroundColor Red
    exit 1
}

Write-Host "===============================================" -ForegroundColor Green
Write-Host " Successfully pushed CBRS-X to GitHub!" -ForegroundColor Green
Write-Host " Repository: $remoteUrl ($branch)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
