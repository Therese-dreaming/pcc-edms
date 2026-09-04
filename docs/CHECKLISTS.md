# PCC-EDMS — Master Checklists

_Generated 2026-09-05 from `reqs/` (EVP-approved source forms) and `docs/` (specs `0.x`–`9.x`,
`ROADMAP-TO-COMPLETION.md`, `HANDOFF.md`, `CHANGELOG.md`). Every item is listed **even when done**
so this doubles as a coverage map, not just a to-do list._

Legend: `[x]` built & verified · `[~]` partial / assumption-based · `[ ]` not done ·
`[-]` decided out of scope (kept for the record).

**Health snapshot (per ROADMAP 2026-08-31):** ~159–163 tests passing, `composer audit` clean,
build clean, all modules functionally complete and browser-verified, `main` committed but **not
pushed** (standing rule).

---

## 1. Source-form coverage (`reqs/`)

- [x] DPO EFORM 1 — researcher intake / application form (Form 1 fields, uploads)
- [x] DPO EFORM 2 — Research Team NDA (per-member signing, identity capture)
- [x] DPO EFORM 3 — clearance certificate output (now split into independent DPREQ/REMIS certs)
- [x] DPO EFORM 5 — OJT / Trainee NDA
- [x] REC Clearance Certificate (`reqs/REMIS-certs/`) — implemented template + QR verification
- [x] REC Exemption Certificate (`reqs/REMIS-certs/`) — implemented template
- [~] July-7 Unified Research Ethics & Data Privacy Clearance Application Form — documented field
      set built as ONE shared form (`applicant_category` carries student/employee split); separate
      final student/employee **variant layouts** deferred pending final PDFs (ROADMAP B1)

---

## 2. Module 1 — DPREQ / DPO clearance (`docs/1.x`)

- [x] Application form + fields (`1.1`)
- [x] Clearance certificate output with control number `DPREQ-2026-NNNNNN` (`1.1`)
- [x] Status lifecycle `submitted → under_review → approved` (collapsed per decision) (`1.2`)
- [x] Screening checklist + auto deficiency-notice PDF (`1.2`)
- [x] Return / reject / approve actions with error surfacing (`1.2`)
- [x] Revision engine — staff request comments/documents, applicant responds, gates approval
- [x] Notifications on submit/return/endorse/reject/approve (`1.2`)
- [x] Accepted file types, naming convention, repository placement (`1.3`)
- [x] Document versioning + reviewer side-by-side version compare (`1.3`)
- [x] Certificate issuance history on Show page
- [~] Document retention schedule — bucketing built; **purge disabled** pending DPO sign-off (B8)

## 3. Module 2 — DPNDA / NDAs (`docs/2.x`)

- [x] NDA record fields + hardcoded template (`2.1`)
- [x] Trainee sign → coordinator countersign lifecycle (`2.2`)
- [x] Send-for-signing / decline / countersign notifications (`2.2`)
- [x] Research Team NDA per-member signing links (public `/nda/sign/{token}`, single-use, 14-day)
- [x] Signature identity capture (IP + user-agent) rendered on NDA PDFs
- [x] Drawn e-signatures (canvas) with typed-name fallback
- [x] OJT/Trainee NDA (Form 5) generation
- [x] OJT coordinator CSV batch onboarding (`/dpnda/import`)
- [x] OJT Evaluation Report upload (coordinator) + compliance report
- [-] NDA template versioning / `nda_templates` table — declined (2026-07-04)

## 4. Module 3 — REMIS / Research Ethics (`docs/3.x`)

- [x] Application form incl. Participants/Ethics sections (`3.1`)
- [x] Clearance certificate + QR verification (`3.1`)
- [x] Form 1 document uploads — mandatory trio + conditional minors docs + additional (`3.1`)
- [x] Administrative screening (Ethics Secretariat) (`3.2`)
- [x] Risk classification (Minimal/Moderate/High) — manual decision buttons (`3.2`)
- [x] Seven review criteria reviewer form (`3.3` §VIII)
- [x] Academic endorsement chain: Adviser → Program Head → Dean (`3.3`)
- [x] Multi-reviewer panel + consolidation gate (all reviewers submit before Chair decides) (`3.3`)
- [x] Decision outcomes incl. **Exempted** (Certificate of Exemption, terminal) (`3.3`)
- [x] `for_review` / `for_screening` gates on reviewer assignment & review submission
- [x] Monitoring — monthly progress reports + compliance review (`3.4`)
- [x] Completion module — completion report closes & archives study (`3.4`)
- [x] `monitoring_paused` → resume route/policy/UI wired (`3.4`)
- [-] Exempted studies auto-close/archive — NO; rest at `clearance_issued` permanently (B2)
- [~] Risk-classification exact thresholds between levels — mechanism built, thresholds unconfirmed

### 4a. Incident Reporting (`docs/3.5`)

- [x] Incident types, tracking, corrective action
- [x] DPO cross-notification on incidents
- [x] Transactional incident filing
- [~] Auto-pause monitoring on breach — open question, not auto-wired

---

## 5. Shared infrastructure (`docs/4.x`)

- [x] User roles & permissions — 14 roles, capability matrix (`4.1`)
- [x] Admin user management — create/edit/reassign role (`/admin/users`) (`4.1`)
- [x] Bulk CSV user import with preview-then-confirm (`4.1`)
- [x] Bulk status update for users (`4.1`)
- [x] Email verification on signup (`4.1`)
- [x] Adviser-managed applicant accounts + cohort join codes/links/QR
- [x] Public self-registration **removed** (staff-issued credentials only)
- [x] File naming `REC-{MODULE}-{DEPT}-{CTRL}_{YYYYMMDD}_{LABEL}_V{n}.{ext}` (`4.2`)
- [x] Repository structure + versioning (`4.2`)
- [x] E-signature requirements (`4.3`)
- [x] In-app notification bell (badge + dropdown + history page) (`4.3`)
- [x] Email notification channel (queued Mailable) (`4.3`)
- [x] Notification triggers wired across DPREQ/DPNDA/REMIS/Incident/Monitoring (`4.3`)
- [x] Audit trail — event types + audit-trail report (`4.4`)
- [x] Audit read-access gating (`AuditLogPolicy`) (`4.4`)
- [x] `{entity}.viewed` audit events on sensitive-record show pages (B5)
- [x] Applicant-facing status view (`4.4`)
- [x] Real optimistic locking (version column + expected_version round-trip)
- [x] Rate limiting on verification portal (10 req/min/IP)
- [x] Env-configurable certificate signatories (`SIGNATORIES.md`)
- [-] SMS notification channel — declined (cost constraint; email is the required channel)

---

## 6. Reports (13/13) (`docs/5.x`)

**Shared (`5.1`)**
- [x] Applications by Department
- [x] Incident Summary
- [x] Compliance Monitoring Report

**ORD (`5.2`)**
- [x] Applications by Risk Level
- [x] Reviewer Workload
- [x] Annual Ethics Report
- [x] Archive Studies Report

**DPO (`5.3`)**
- [x] NDAs by Department / Grade Level
- [x] Pending DPO Approvals
- [x] Student Teachers by Grade Level
- [x] OJTs Accommodated
- [x] Trainee Whereabouts
- [x] OJT Evaluation Report Compliance

- [x] Role-based visibility + 403 on cross-office direct URL access
- [x] CSV export + PDF download per report

---

## 7. Phase A — Engineering, no stakeholder input (`ROADMAP` Phase A)

- [x] Targeted knowledge-graph corrections (full regeneration still open)
- [x] CHANGELOG gap 2026-07-29..08-30 reconstructed from git
- [x] OJT coordinator CSV batch onboarding
- [x] Verification screenshots moved to `docs/assets/verification-screenshots/`
- [x] Load targets documented in `testing-strategy.md`
- [ ] Submission-history timeline UI + certificate issuance history (Future Enhancement — build only if asked)
- [ ] Full knowledge-graph regeneration (cohorts, revisions, exemption, import flows as nodes)

## 8. Phase B — Stakeholder decisions (resolved autonomously 2026-08-31)

- [~] B1 — unified-form final student/employee variant layouts **[ratify]** (content built, packaging deferred)
- [x] B2 — exempted studies: no auto-close/archive
- [x] B3 — no auto-expiry for stale returned/monitoring records
- [x] B4 — `approved_with_conditions` overseen via monthly progress reviews
- [x] B5 — "record viewed" audit on sensitive records
- [x] B6 — signing-link expiry kept at 14 days
- [x] B7 — "ODP" = "DPO" (label only)
- [ ] B8 — enable retention purge — **human-gated** (needs DPO disposal sign-off)
- [ ] B9 — login policy copy legal review — **human-gated** (still "Policy draft v0.1")

## 9. Phase C — IT / infrastructure (`ROADMAP` Phase C, `docs/7.0`, `OPERATIONS.md`)

- [ ] Hosting decision — hosting type, PCC-owned domain/DNS, SSL, DB hosting (MySQL 8.0+), CI/CD
- [ ] SSO (Microsoft Entra ID) — blocked on PCC IT app registration (client/tenant IDs); arch is SSO-ready
- [ ] Real mail delivery — code done; needs SMTP/Mailgun/SES credentials + verified sending domain
- [x] Virus scanning (ClamAV) — built, off by default (`ANTIVIRUS_ENABLED=false`), fail-closed
- [x] Local-disk backup job — `scripts/backup.sh` (mysqldump + docs tarball, 30-day retention)
- [x] Production queue worker + scheduler — Supervisor config + `pcc-edms-cron` scheduler wired

## 10. Phase D — Process & go-live (`ROADMAP` Phase D)

- [ ] Resolve remaining Phase B go/no-go rows (B8, B9)
- [ ] Stand up Phase C infrastructure (staging first)
- [ ] UAT round with office staff — **script ready** (`docs/UAT-SCRIPT.md`, 14 scenarios)
- [ ] Training / handover — **material ready** (`docs/TRAINING.md`)
- [ ] Legal review of e-signature posture (ADR-005, RA 8792)
- [ ] Run deployment checklist (`DEPLOYMENT_CHECKLIST.md` + `scripts/deploy-checklist.sh`)
- [ ] Verify backups incl. one restore drill (`OPERATIONS.md §8`); choose uptime monitoring
- [ ] Push `main` to origin — **only with explicit requester go-ahead** (standing rule)
- [ ] Go-live; keep paper fallback for one cycle if DPO wants it

### 10a. Deployment checklist items (`docs/DEPLOYMENT_CHECKLIST.md`)

- [ ] `.env` present with all required variables
- [ ] Migrations run
- [ ] Storage directories writable
- [ ] Test suite passes (`php artisan test`)
- [ ] Queue workers running (Supervisor)
- [ ] Build assets current (`npm run build`)
- [ ] SSL/HTTPS enforced for all production traffic

## 11. Phase E — Front-end redesign (`ROADMAP` Phase E, `docs/DESIGN.md`)

- [x] `docs/DESIGN.md` — canonical maroon/paper token system documented
- [x] Three sanctioned hand-edited exception pages recorded (`Auth/*`, `Dpreq/Show`, `Dpnda/Create`)
- [ ] Full visual restyling pass — page-by-page under DESIGN.md §4, **only when explicitly asked**

---

## 12. Explicitly out of scope (decided — do not rebuild)

- [-] Joint dual-signed clearance certificate (retired 2026-07-25 — independent certs)
- [-] SMS notifications (cost constraint)
- [-] NDA template versioning / `nda_templates` table (declined 2026-07-04)
- [-] Discontinued/Withdrawn early-exit workflow (declined; enum kept for forward-compat)
- [-] Digital-signature verification beyond identity capture already recorded
- [-] Public self-registration (removed 2026-07-25)
