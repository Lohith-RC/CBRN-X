# CBRS-X Deployment & Operations Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Database Management](#database-management)
- [Backup & Recovery](#backup--recovery)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd CBRS-X

# 2. Copy environment template
cp .env.example .env

# 3. Generate secure secrets
openssl rand -hex 32  # Use for CBRSX_API_KEY
openssl rand -base64 32  # Use for POSTGRES_PASSWORD
openssl rand -hex 32  # Use for CBRSX_CRYPTO_SALT

# 4. Edit .env with your values
# IMPORTANT: Never commit .env to version control

# 5. Start all services
docker compose up -d

# 6. Verify health
docker compose ps
curl http://localhost/actuator/health
```

## Environment Configuration

### Required Variables

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 32` |
| `CBRSX_API_KEY` | Master API key | `openssl rand -hex 32` |
| `CBRSX_ADMIN_PASSWORD` | Admin login password | Choose a strong password |
| `CBRSX_CRYPTO_SALT` | Certificate tamper-evidence salt | `openssl rand -hex 32` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Spring profile (dev/prod) |
| `GATEWAY_PORT` | `80` | External gateway port |
| `TRAINEE_GATEWAY_PORT` | `5000` | Trainee view port |
| `CBRSX_CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |

## Docker Deployment

### Production Deployment

```bash
# Build and start all services
docker compose up -d --build

# Check service status
docker compose ps

# View logs
docker compose logs -f cbrsx-backend

# Stop all services
docker compose down
```

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx Gateway                        │
│                    (Port 80, 5000)                      │
└─────────────┬───────────────────┬───────────────────────┘
              │                   │
    ┌─────────▼─────────┐ ┌──────▼──────────────┐
    │  Admin Dashboard  │ │   Trainee View      │
    │  (Port 3000)      │ │   (Port 5000)       │
    └─────────┬─────────┘ └──────┬──────────────┘
              │                   │
    ┌─────────▼───────────────────▼──────────────┐
    │           Spring Boot Backend               │
    │              (Port 8080)                    │
    └─────────────────┬──────────────────────────┘
                      │
    ┌─────────────────▼──────────────────────────┐
    │           PostgreSQL Database               │
    │              (Port 5432)                    │
    └────────────────────────────────────────────┘
```

## Database Management

### Flyway Migrations

The project uses Flyway for database schema management. Migrations are located in:
`backend/src/main/resources/db/migration/`

```bash
# Check migration status
docker exec cbrsx-db psql -U postgres -d cbrsx_db -c \
  "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"

# Manual migration (if needed)
docker exec cbrsx-backend java -jar app.jar --flyway.migrate
```

### Creating New Migrations

1. Create a new file: `V{version}__{description}.sql`
2. Example: `V2__add_user_preferences.sql`
3. Use only SQL DDL (no Java code)
4. Test on a copy of production data first

## Backup & Recovery

### Automated Backups

Backups run automatically via the `cbrsx-backup` service:
- **Schedule**: Daily at 2:00 AM UTC
- **Retention**: 7 days
- **Location**: Docker volume `cbrsx-backups`

### Manual Backup

```bash
# Linux/Mac
./scripts/backup.sh /backups/cbrsx 7

# Windows
scripts\backup.bat C:\backups\cbrsx 7

# Direct Docker command
docker exec cbrsx-db pg_dump -U postgres -d cbrsx_db --format=custom | \
  gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Decompress and restore
gunzip -c backup_20240101.sql.gz | \
  docker exec -i cbrsx-db pg_restore -U postgres -d cbrsx_db --clean
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost/actuator/health

# Database connectivity
docker exec cbrsx-db pg_isready -U postgres

# WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost/ws-telemetry
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f cbrsx-backend

# Last 100 lines
docker compose logs --tail=100 cbrsx-backend
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection refused | Check `cbrsx-db` container is healthy: `docker compose ps` |
| API returns 401 | Verify `CBRSX_API_KEY` in `.env` matches client requests |
| WebSocket disconnects | Check CORS origins include your frontend URL |
| Certificate generation fails | Ensure `CBRSX_CRYPTO_SALT` is set in `.env` |
| High memory usage | Adjust `deploy.resources.limits.memory` in `docker-compose.yml` |

### Debug Mode

```bash
# Start with dev profile
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Enable debug logging
docker compose exec cbrsx-backend \
  java -jar app.jar --logging.level.com.cbrsx=DEBUG
```

## Code Review Process

### Before Submitting a PR

1. **Run linter**: `npm run lint` (frontend) or `mvn checkstyle:check` (backend)
2. **Run tests**: `npm test` or `mvn test`
3. **Check formatting**: `npm run format:check`
4. **Update documentation** if changing APIs or behavior
5. **Add tests** for new functionality

### PR Requirements

- [ ] All CI checks pass
- [ ] Code review approved by 1 team member
- [ ] No secrets or credentials in code
- [ ] Tests added for new features
- [ ] Documentation updated if needed

### Review Checklist

- [ ] Code follows project style guidelines
- [ ] No hardcoded values (use environment variables)
- [ ] Error handling is comprehensive
- [ ] No sensitive data logged
- [ ] Database changes are migration-safe
