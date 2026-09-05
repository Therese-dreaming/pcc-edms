# Operations Guide — PCC-EDMS in Production

_Written 2026-08-31 (roadmap Phase C). Everything an operator needs to run PCC-EDMS after the
hosting decision lands. Pairs with `DEPLOYMENT_CHECKLIST.md` (pre-release verification) and
`scripts/deploy-checklist.sh`. Assumed stack: Linux VM, Nginx, PHP 8.2+ FPM, MySQL 8.0+, Redis
optional. Nothing here requires paid services — the zero-cost constraint still holds._

## 1. Services that MUST be running

| Service | Why | How |
|---|---|---|
| Web server (Nginx + PHP-FPM) | The app | Standard Laravel vhost; document root is `public/` |
| Queue worker | Certificates, NDAs, deficiency notices, and notification emails are **queued jobs** — nothing renders without it | Supervisor (config below) |
| Laravel scheduler | Drives the monthly retention sweep (`edms:apply-retention`) | Cron entry in `pcc-edms-cron` (`* * * * * php artisan schedule:run`) |
| Daily backups | Legally-retained documents must survive disk failure (ADR-004) | Cron entry → `scripts/backup.sh` (mysqldump + documents tarball, 30-day retention) |

### Supervisor config for the queue worker

`/etc/supervisor/conf.d/pcc-edms-worker.conf`:

```ini
[program:pcc-edms-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/pcc-edms/artisan queue:work --sleep=3 --tries=3 --timeout=120
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/pcc-edms/worker.log
stopwaitsecs=3600
```

`--timeout=120` matters: Browsershot PDF rendering is CPU-heavy and occasionally slow. Then:
`supervisorctl reread && supervisorctl update && supervisorctl start "pcc-edms-worker:*"`

### MySQL 8.0+ (ADR-003 — not 5.7)

- Create the database with `utf8mb4`/`utf8mb4_unicode_ci`; one dedicated user with least
  privilege (SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/INDEX/DROP/REFERENCES on the app DB only).
- Enable binary logs if point-in-time recovery is wanted on top of the nightly dumps.
- `.env`: `DB_CONNECTION=mysql`, `QUEUE_CONNECTION=database` (works without Redis; switch to
  `redis` only if queue latency ever matters).

## 2. TLS / HTTPS (mandatory — personal data)

Standard Let's Encrypt (free) is acceptable:

```bash
certbot --nginx -d edms.<pcc-domain>
```

Set `APP_URL=https://edms.<pcc-domain>` and confirm the app issues no `http://` links. The
public verification portal (`/verify`) is rate-limited to 10 requests/minute/IP and fails closed;
no extra WAF rules are required for launch.

## 3. Health checks and monitoring

- **Health endpoint:** Laravel's built-in `/up` (registered in `bootstrap/app.php`) — point any
  uptime monitor (Uptime Kuma is free and self-hostable) at it.
- **Queue health:** `php artisan queue:monitor` or watch `failed_jobs`; alert when it is
  non-empty. The UAT script's PDF steps catch a dead worker quickly, but production should not
  rely on humans noticing.
- **Logs:** `storage/logs/laravel.log`; mail is also logged there while `MAIL_MAILER=log`.

## 4. Email delivery

Code side is complete (`EMAIL_SETUP.md`): every in-app notification also queues a
`NotificationMail`, and transactional mails users wait on (NDA signing links, account setup
links) send synchronously. Configure one of: SMTP with app password, Mailgun
(`symfony/mailgun-mailer` + DNS-verified domain), or SES. Until then `MAIL_MAILER=log` keeps
everything working locally.

## 5. Antivirus scanning (ClamAV) — built, off by default

`config/antivirus.php` + `VirusScanService` (2026-08-31). To enable:

```bash
apt install clamav clamav-daemon
freshclam                       # prime signatures
# .env
ANTIVIRUS_ENABLED=true
ANTIVIRUS_BINARY=clamscan       # or clamdscan for a warm daemon at higher volume
```

Semantics: infected uploads are rejected with a clear validation error and audit-logged; a
scanner that cannot run **rejects** uploads too (fail-closed). Disable again by setting
`ANTIVIRUS_ENABLED=false` if the scanner misbehaves — availability trade-off is the operator's.

## 5a. PHP upload limits (REQUIRED — the app accepts 100 MB/file)

`App\Shared\Documents\Support\UploadRules` caps each uploaded file at **100 MB** (`MAX_KB`), and
Form 1 carries up to ~27 file slots (5 mandatory + 2 conditional minors + up to 20 additional).
PHP's defaults (`post_max_size` 8M, `upload_max_filesize` 2M, `max_file_uploads` 20) are far below
this — two symptoms follow if they aren't raised: a whole submission overflows `post_max_size` and
PHP rejects it with a 413 **"POST Content-Length exceeds the limit"**; or a single file over
`upload_max_filesize` is dropped and validation reports a bare **"…failed to upload"**. Set these in
the deploy host's `php.ini` (and restart php-fpm / the web server):

```ini
upload_max_filesize = 100M    ; must be >= UploadRules::MAX_KB (per-file cap)
post_max_size       = 512M    ; a few 100M files + fields in one submission
max_file_uploads    = 30      ; > the 27 file slots Form 1 can present
max_input_vars      = 5000    ; the intake form's nested checklist/co-researcher/document arrays
memory_limit        = 512M    ; >= post_max_size
```

Keep `upload_max_filesize` == `UploadRules::MAX_KB`; if you change the per-file cap, change both.
The DPREQ intake reads both limits back (`ini_get`) and checks each file against the per-file cap and
the total against `post_max_size` **before** uploading, so an over-limit submission fails fast with a
plain-language message instead of an opaque PHP error.

## 6. SSO (Microsoft Entra ID) — what IT must provide

Architecture is SSO-ready (ADR-002: nullable `users.sso_subject_id`, standalone auth in the
meantime). IT needs to hand over, for `college.account@pcc.edu.ph`-pattern accounts:

1. An Entra ID **app registration** for PCC-EDMS.
2. **Client ID, client secret (or certificate), and tenant ID.**
3. Redirect URI allowance for `https://edms.<pcc-domain>/auth/entra/callback`.

Once provided, the integration is Socialite-based and additive; no schema change needed.

## 7. Retention and disposal

- Monthly sweep runs automatically in **report-only** mode (`php artisan edms:apply-retention`).
- Disposal requires BOTH `--purge` and `RETENTION_PURGE_ENABLED=true` — **and documented DPO
  sign-off (roadmap B8)** before anyone sets them. Purge removes archived *files* only; records
  and the audit trail remain as the disposal evidence.

## 8. Backup restore drill

```bash
gunzip -c /var/backups/pcc-edms/db_backup_<DATE>.sql.gz | mysql -u <user> -p pcc_edms
tar -xzf /var/backups/pcc-edms/file_backup_<DATE>.tar.gz -C storage/app
```

Run this drill once on staging before go-live — a backup that has never been restored is a hope,
not a backup.
