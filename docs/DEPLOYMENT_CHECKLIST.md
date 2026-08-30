# PCC-EDMS — Deployment Checklist

## Pre-Deployment Verification

Run `scripts/deploy-checklist.sh` before each deployment:

```bash
chmod +x scripts/deploy-checklist.sh
./scripts/deploy-checklist.sh
```

### Checklist Items

- [ ] `.env` file exists with all required variables
- [ ] Database migrations have been run
- [ ] Storage directories are writable
- [ ] Test suite passes (`php artisan test`)
- [ ] Queue workers are running (Supervisor recommended)
- [ ] Build assets are current (`npm run build`)

## Environment Variables Required

```
APP_URL=https://edms.pcc.edu.ph
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pcc_edms
DB_USERNAME=edms_user
DB_PASSWORD=secure_password
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

> **2026-08-31 audit correction:** this block previously said `pgsql`/5432. The confirmed
> database engine is **MySQL 8.0+** (ADR-003; stakeholder-package `05`) — `.env.example` was
> always right.

## Queue Workers

PDF generation uses Browsershot (Chrome headless) which is CPU-intensive.
Queue workers are **required** for production:

```bash
# Using Supervisor (recommended)
[program:pcc-edms-queue]
command=php /var/www/pcc-edms/artisan queue:work --sleep=3 --tries=3 --timeout=60
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/log/pcc-edms/queue.log
stderr_logfile=/var/log/pcc-edms/queue_error.log

# Or using Laravel Horizon (if Redis is available)
php artisan horizon
```

## Backup Schedule

Daily backups at 2:00 AM:

```bash
# Add to crontab
0 2 * * * cd /var/www/pcc-edms && /bin/bash /var/www/pcc-edms/scripts/backup.sh
```

Retention: 30 days

## Rate Limiting

The verification portal is rate-limited to **10 requests per minute per IP** to prevent enumeration attacks.

## SSL/HTTPS

Required for all production traffic due to sensitive personal data.

## Monitoring

- Queue worker health: check `/var/log/pcc-edms/queue.log`
- Application errors: Laravel Telescope or external service
- Uptime: Recommended external monitoring service