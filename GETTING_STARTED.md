# Getting Started — Running PCC-EDMS Locally

## Prerequisites

Already confirmed working on this machine:
- PHP 8.2+ with `pdo_mysql` extension
- Composer 2.x
- Node.js + npm
- MySQL (via Laragon, running on `127.0.0.1:3306`)
- Google Chrome installed at `C:/Program Files/Google/Chrome/Application/chrome.exe` (used by Browsershot for PDF generation — see `config/pdf.php`)

## First-time setup

Only needed once, or after pulling changes that add dependencies/migrations.

```bash
composer install
npm install
```

`.env` is already configured for this machine (MySQL credentials, Chrome path, node_modules path). If setting up fresh, copy `.env.example` to `.env` and fill in:
- `DB_DATABASE=pcc_edms` (create the database first — see below)
- `PDF_CHROME_PATH` — path to a local Chrome/Chromium binary
- `PDF_NODE_MODULE_PATH` — absolute path to this project's `node_modules` (needed so Browsershot's Node script can `require('puppeteer')`)

Create the database (MySQL doesn't auto-create it):
```bash
php -r "(new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''))->exec('CREATE DATABASE IF NOT EXISTS pcc_edms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');"
```

Run migrations and seed test accounts:
```bash
php artisan migrate --force
php artisan db:seed --force
```

Build frontend assets (or use `npm run dev` for hot-reload during active development):
```bash
npm run build
```

## Running the app

Two processes are needed:

**1. The web server:**
```bash
php artisan serve
```
Visit **http://localhost:8000**

**2. The queue worker** (required for PDF generation — clearance certificates and NDA PDFs are generated as queued jobs, not synchronously, so nothing will render without this running):
```bash
php artisan queue:work
```

If using Claude Code's preview tooling, `.claude/launch.json` already has a `laravel` config wired to `php artisan serve` — use `preview_start` with name `laravel`. The queue worker still needs to be started separately (it has no HTTP port, so it isn't a `preview_start` target — run it as a background Bash command).

## Test accounts

Seeded by `database/seeders/UserSeeder.php`. **Password for every account: `password`**

| Email | Role |
|---|---|
| `researcher@pcc.test` | Researcher (Internal) — submits Form 1 |
| `dpo.staff@pcc.test` | DPO Staff — screens/endorses DPREQ |
| `dpo.approver@pcc.test` | DPO Approver — approves DPREQ, signs DPO half of joint clearance |
| `coordinator@pcc.test` | Department Coordinator — creates OJT placements (DPNDA) |
| `trainee@pcc.test` | OJT Trainee — signs Form 5 NDA |
| `adviser@pcc.test` | Adviser — first REMIS endorsement step |
| `programhead@pcc.test` | Program Head — second REMIS endorsement step |
| `dean@pcc.test` | Dean — third REMIS endorsement step |
| `secretariat@pcc.test` | Ethics Secretariat — REMIS screening |
| `reviewer@pcc.test` | Ethics Reviewer — risk classification + review recommendation |
| `chair@pcc.test` | Ethics Committee Chair — assigns reviewers, issues decision, signs Ethics half of joint clearance |
| `admin@pcc.test` | System Administrator |

## Key URLs

| URL | What |
|---|---|
| `/dpreq/create` | Form 1 — submit a new research application (starts both DPREQ and REMIS tracks) |
| `/dpreq` | DPREQ application list |
| `/dpnda/create` | Form 5 — create an OJT/Trainee NDA placement |
| `/dpnda` | DPNDA record list |
| `/remis` | REMIS application list |
| `/incidents` | Incident reports list |
| `/verify` | Public, unauthenticated clearance verification portal (no login needed) |

## Golden path (fastest way to see everything working)

1. Log in as `researcher@pcc.test`, submit Form 1 at `/dpreq/create` (fill every field — Ethics fields are required too).
2. On the resulting DPREQ show page, sign the auto-created Research Team NDA (typed name).
3. Log in as `dpo.staff@pcc.test`: Start Screening → Pass Screening → Endorse.
4. Log in as `dpo.approver@pcc.test`: Approve. (This signs the DPO half of the joint clearance — withheld until Ethics also signs.)
5. On the REMIS side, log in as `adviser@pcc.test`, `programhead@pcc.test`, `dean@pcc.test` in turn on the REMIS show page (`/remis/{id}`) and endorse.
6. Log in as `secretariat@pcc.test`: Screen (mark Complete).
7. Log in as `chair@pcc.test`: Assign Reviewer (enter `reviewer@pcc.test`).
8. Log in as `reviewer@pcc.test`: Submit Review (risk classification + recommendation).
9. Log in as `chair@pcc.test`: Issue Decision (Approved). This signs the Ethics half — since DPO already signed, the joint clearance issues immediately.
10. Refresh the REMIS show page — a "Download joint clearance certificate (Form 3)" link appears. The queue worker must be running for the PDF to exist.
11. Visit `/verify` (no login needed) and search the DPREQ or REC tracking number to confirm public verification works.

## Troubleshooting

- **PDF download 404 / no download link appears**: the queue worker (`php artisan queue:work`) isn't running, or hasn't processed the job yet. Check `php artisan queue:work` output, or inspect the `jobs`/`failed_jobs` tables.
- **Browsershot errors**: confirm `PDF_CHROME_PATH` in `.env` points to a real Chrome executable and `PDF_NODE_MODULE_PATH` points to this project's `node_modules` (must contain a `puppeteer` package — installed via `npm install`).
- **"This action is unauthorized" on an action that should work**: check which Eloquent model the policy is being resolved against — Laravel picks the policy class by the *authorized object's* class, not by which module conceptually owns the action (see `docs/HANDOFF.md` for a real example of this bug).
- **Want real emails instead of `storage/logs/laravel.log`?** See `docs/EMAIL_SETUP.md` — every notification already queues an email, it's just using the `log` mailer until you configure a real one.
