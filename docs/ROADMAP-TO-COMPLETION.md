# Roadmap to 100% — PCC-EDMS Completion Plan

_Last updated: 2026-08-31 by the senior-team audit. This is the single list of everything left to
finish the project. Items are grouped by who/what unblocks them — work top-down within each
phase. "100%" is defined by `0.1`'s success criteria: 100% paperless DPREQ/REMIS clearance, all
OJT/community-service NDAs e-signed and stored, and all reports produced on demand without
manual compilation — running in production at a PCC-owned domain._

**Current health (2026-08-31):** 159 tests passing (751 assertions), `composer audit` clean,
build clean, all modules functionally complete and browser-verified, `main` committed but **not
pushed** (standing instruction).

---

## Phase A — Engineering work, no stakeholder input needed

These can be picked up by the dev team immediately.

- [x] **Targeted knowledge-graph corrections** (2026-08-31) — joint-clearance edge marked
      retired with independent-issuance semantics, DPREQ screening/endorsed statuses and their
      transitions annotated/collapsed to the live chain, research_application note fixed. A full
      regeneration (cohorts, revisions, exemption, import flows as nodes) remains open.
- [x] **Reconstruct or formally close the CHANGELOG gap for 2026-07-29..08-30** — reconstructed
      from git history, clearly marked (see CHANGELOG).
- [x] **OJT coordinator batch onboarding** (2026-08-31) — CSV preview-then-confirm import at
      `/dpnda/import` (`DpndaImportService`, `Dpnda/Import.jsx`, 4 tests). Unknown trainee
      emails get invited accounts, same as single placements.
- [ ] **Submission-history timeline UI + certificate issuance history** — stakeholder "Future
      Enhancements" items, never requested; build only if asked.
- [x] **Root-level verification screenshots** (2026-08-31) — moved to
      `docs/assets/verification-screenshots/`.
- [x] **Load targets** (2026-08-31) — planning assumptions documented in `testing-strategy.md`
      §Gaps; replace when DPO/ORD give real estimates.

## Phase B — Stakeholder decisions — RESOLVED AUTONOMOUSLY 2026-08-31

The requester delegated these: decide from `docs/`/`reqs/` where they speak, otherwise pick the
recommended option. Resolutions below are recorded here and honored in code. Items marked
**[ratify]** are the ones we'd still like a human to rubber-stamp in the morning; nothing blocks
on them.

| # | Question | Resolution (2026-08-31) | Basis |
|---|---|---|---|
| B1 | Final student/employee unified-form variants + remaining field deltas | **[ratify]** Build the documented July-7 field set NOW as ONE shared form; `applicant_category` (student/employee, built 2026-07-28) carries the split. Separate variant layouts wait for the final PDFs — content is confirmed, packaging is not | Stakeholder quotes + `9.1` §2b + `reqs/` July-7 PDF |
| B2 | Exempted studies: auto-close/archive eventually? | NO — they rest at `clearance_issued` permanently; no monitoring, no auto-archive. The Certificate of Exemption is the terminal record | Recommended (exemption ≠ clearance; FRS archive flow is completion-driven) |
| B3 | Expiry/abandonment for stale `returned`/`monitoring` records | NO auto-expiry — stalled studies may remain indefinitely | Precedent: 2026-07-04 decision (HANDOFF Part G) |
| B4 | `approved_with_conditions` follow-up | Conditions are overseen through the existing monthly progress-report compliance reviews; no extra gate | Recommended (FRS has none; monitoring already reviews compliance) |
| B5 | "Record viewed" audit scope | Implement for sensitive records = application/incident/NDA show pages (they all carry personal data) | `4.4` ASSUMPTION default |
| B6 | Signing-link expiry value | Keep the 14-day default; one constant if it changes | Recommended (docs name no value) |
| B7 | "ODP" vs "DPO" | Same office — "Office for Data Privacy" is the DPO renamed; no new roles, labels only | Recommended (`0.2` has no ODP role; only Part IX uses the term) |
| B8 | Enable retention purge | UNCHANGED — requires actual DPO sign-off; devs cannot self-approve disposal authority | Compliance constraint |
| B9 | Login policy copy legal review | UNCHANGED — needs PCC Admin/DPO/Ethics/Legal humans | Process, not code |

## Phase C — IT / infrastructure dependent

- [ ] **Hosting decision** (`7.0`): hosting type, PCC-owned domain/DNS, SSL provisioning, DB
      hosting (MySQL 8.0+), backup schedule, queue-worker supervision, CI/CD. Once chosen,
      everything else in this phase plugs into `docs/deployment/OPERATIONS.md` (2026-08-31).
- [ ] **SSO (Microsoft Entra ID)** — provider confirmed (Microsoft 365 / `@pccnet.edu.ph`);
      blocked on PCC IT registering an app and issuing client ID/secret/tenant ID. **The exact
      ask for IT is written in OPERATIONS.md §6.** Architecture is SSO-ready (ADR-002).
- [ ] **Real mail delivery** — code side done (`EMAIL_SETUP.md`); needs Mailtrap/SMTP/Mailgun/SES
      credentials + a verified sending domain.
- [x] **Virus scanning (ClamAV)** — BUILT (2026-08-31): `VirusScanService` hooked into
      `DocumentService::store()` (every upload), off by default (`ANTIVIRUS_ENABLED=false`) and
      fail-closed when enabled; `VirusScanTest` covers clean/infected/broken-scanner/disabled.
      The earlier "clamd only" reservation was relaxed: `clamscan` works at this system's volume,
      `clamdscan` is a config switch if it ever grows (OPERATIONS.md §5).
- [x] **Local-disk backup job** (ADR-004) — FIXED (2026-08-31): `scripts/backup.sh` previously
      called a nonexistent `php artisan dump:database` and fell back to `pg_dump` (wrong engine —
      this is MySQL). Now `mysqldump` from `.env` + documents tarball, 30-day retention.
- [x] **Production queue worker + scheduler** — Supervisor config and cron wiring documented in
      OPERATIONS.md §1; `pcc-edms-cron` was missing the Laravel scheduler entry (the retention
      sweep would never have run) — fixed.

## Phase D — Process & go-live

1. [ ] Resolve all Phase B rows (they are the go/no-go inputs).
2. [ ] Phase C infrastructure stood up (staging first, per `7.0` tiers).
3. [ ] **UAT round** with real office staff — **script ready: `docs/UAT-SCRIPT.md`** (14
       pass/fail scenarios, every role, verified against the code on 2026-08-31).
4. [ ] **Training/handover** — **material ready: `docs/TRAINING.md`** (per-role quick
       reference, written 2026-08-31).
5. [ ] Legal review of e-signature posture (ADR-005 caveat: typed-name + metadata as operative
       record under RA 8792 — explicit DPO/Legal acceptance recommended).
6. [ ] Deployment checklist run (`DEPLOYMENT_CHECKLIST.md` + `scripts/deploy-checklist.sh`),
       backups verified including one restore drill (OPERATIONS.md §8), uptime monitoring chosen
       (OPERATIONS.md §3).
7. [ ] Push `main` to origin **only with the requester's explicit go-ahead** (standing rule).
8. [ ] Go-live; keep paper fallback for one cycle if DPO wants it.

## Phase E — Front-end redesign — RECONCILED AT DOC LEVEL (2026-08-31)

The requester reopened Phase E on 2026-08-31 ("continue through Phases; no permission needed").
Deliverable: **`docs/DESIGN.md`** — the canonical maroon/paper token system, the three
sanctioned hand-edited exception pages (`Auth/*.jsx`, `Dpreq/Show.jsx`, `Dpnda/Create.jsx` —
never restyled without page-by-page approval), rules for new UI work, and the remaining
reconciliation path. No visual restyling was performed in this pass: the exceptions are the
requester's own edits, and an unsanctioned sweep is exactly the failure the previous restyle
attempt caused (HANDOFF §0). A future full visual pass proceeds page-by-page under DESIGN.md §4.

## Explicitly out of scope (decided, don't rebuild)

- Joint dual-signed clearance certificate (retired 2026-07-25 — independent certificates).
- SMS notifications (cost constraint; email is the required channel and is built).
- NDA template versioning / `nda_templates` table (declined 2026-07-04).
- Discontinued/Withdrawn early-exit workflow (declined 2026-07-04; enum kept for forward-compat).
- Digital-signature verification beyond the identity capture already recorded.
- Public self-registration (removed 2026-07-25; staff-issued credentials only).
