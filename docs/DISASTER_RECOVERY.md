# 🛡️ CBRS-X Database Disaster Recovery & Continuity Runbook

This document defines the **Disaster Recovery (DR)**, automated backup, and **Point-in-Time Recovery (PITR)** procedures for the CBRS-X simulation mission platform.

---

## 1. 🗄️ Backup Architecture

```
    ┌─────────────────────────────────────────────────────────────┐
    │              PRIMARY DATABASE (cbrsx-db / PostgreSQL 15)    │
    └──────────────┬───────────────────────────┬──────────────────┘
                   │ Daily pg_dump (02:00 UTC) │ Continuous WAL Archiving
                   ▼                           ▼
    ┌──────────────────────────────┐ ┌─────────────────────────────┐
    │  Compressed Custom Snapshots │ │ Write-Ahead Logs (WAL)      │
    │  (/backups/cbrsx_*.sql.gz)   │ │ (/var/lib/postgresql/wal)   │
    │  Retained: 30 Days           │ │ Retained: 7 Days            │
    └──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. ⚡ Automated Daily Backup Service

The `cbrsx-backup` container in [`docker-compose.yml`](file:///c:/Users/monica/CBRN/CBRN-X/docker-compose.yml) runs a scheduled cron job at `02:00 UTC` every night:

```bash
# Automated dump command executed by cbrsx-backup container
pg_dump -h cbrsx-db -U postgres -d cbrsx_db --format=custom --compress=9 | gzip > /backups/cbrsx_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 3. 🛠️ Manual Backup Execution (On-Demand)

### On Windows (PowerShell / Batch)
```powershell
# Execute the backup batch script
.\scripts\backup.bat
```

### On Linux / macOS (Bash)
```bash
chmod +x ./scripts/backup.sh
./scripts/backup.sh
```

---

## 4. 🔄 Restoration & Disaster Recovery Runbook

### Scenario A: Restoring from a Snapshot (`.sql.gz`)

1. **Stop Active Backend Services**:
   ```bash
   docker compose stop cbrsx-backend cbrsx-admin-dashboard cbrsx-trainee-view
   ```

2. **Re-initialize Target Database**:
   ```bash
   docker compose exec cbrsx-db psql -U postgres -c "DROP DATABASE IF EXISTS cbrsx_db;"
   docker compose exec cbrsx-db psql -U postgres -c "CREATE DATABASE cbrsx_db;"
   ```

3. **Restore Snapshot**:
   ```bash
   # Decompress and restore via pg_restore
   gunzip -c /backups/cbrsx_20260826_020000.sql.gz | docker compose exec -T cbrsx-db pg_restore -U postgres -d cbrsx_db --clean --if-exists
   ```

4. **Run Migration Check & Restart Services**:
   ```bash
   docker compose start cbrsx-backend cbrsx-admin-dashboard cbrsx-trainee-view
   docker compose logs -f cbrsx-backend
   ```

---

## 5. 🔒 Backup Integrity Verification

All backup snapshots must be verified with cryptographic checksums:

```powershell
# Generate SHA-256 checksum for snapshot verification
Get-FileHash -Path .\backups\cbrsx_*.sql.gz -Algorithm SHA256
```
