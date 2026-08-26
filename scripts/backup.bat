@echo off
REM CBRS-X Automated PostgreSQL Backup Script for Windows
REM Usage: backup.bat [backup_dir] [retention_days]

setlocal enabledelayedexpansion

set BACKUP_DIR=%~1
set RETENTION_DAYS=%~2
set CONTAINER_NAME=cbrsx-db
set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\cbrsx_%TIMESTAMP%.sql.gz

if "%BACKUP_DIR%"=="" set BACKUP_DIR=C:\backups\cbrsx
if "%RETENTION_DAYS%"=="" set RETENTION_DAYS=7

echo [%date% %time%] Starting CBRS-X PostgreSQL backup...

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Check if Docker container is running
docker ps --format "{{.Names}}" | findstr /I "%CONTAINER_NAME%" >nul
if errorlevel 1 (
    echo ERROR: Container '%CONTAINER_NAME%' is not running.
    exit /b 1
)

REM Create backup
echo [%date% %time%] Creating database backup...
docker exec %CONTAINER_NAME% pg_dump -U postgres -d cbrsx_db --format=custom --compress=9 > "%BACKUP_FILE%.tmp"
if errorlevel 1 (
    echo ERROR: Backup failed.
    exit /b 1
)

REM Compress the backup
powershell -Command "Get-Content '%BACKUP_FILE%.tmp' -Raw | Set-Content -Path '%BACKUP_FILE%' -Encoding Byte"
del "%BACKUP_FILE%.tmp"

echo [%date% %time%] Backup completed: %BACKUP_FILE%

REM Clean up old backups (simplified for Windows)
echo [%date% %time%] Cleaning up backups older than %RETENTION_DAYS% days...
forfiles /p "%BACKUP_DIR%" /m "cbrsx_*.sql.gz" /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul

echo [%date% %time%] Backup process completed.
endlocal
