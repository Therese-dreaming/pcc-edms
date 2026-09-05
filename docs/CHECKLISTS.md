# PCC-EDMS — Master Checklists (specific, sub-module by sub-module)

_Generated 2026-09-05 from `reqs/` (EVP-approved forms) and `docs/` (`0.x`–`9.x`, FRS,
`ROADMAP-TO-COMPLETION.md`, `HANDOFF.md`, `CHANGELOG.md`). Every item is listed **even when
done** so this doubles as a coverage map._

Legend: `[x]` built & verified · `[~]` partial / assumption-based / packaging deferred ·
`[ ]` not done · `[-]` decided out of scope (kept for the record).

Health (per ROADMAP 2026-08-31): ~159–163 tests passing, `composer audit` clean, build clean,
all modules functionally complete and browser-verified; `main` committed & pushed, **PR into
`stakeholder-preview` still to be opened**.

---

# MODULE 1 — DPREQ / DPO Clearance

## 1.1 Application form (`docs/1.1`, `reqs/DPO EFORM 1`)
Section A — Applicant Information
- [x] Research Title
- [x] Researcher's / group-lead name
- [x] Number of Researchers (1–6, "others" free text)
- [x] Adviser's Name
- [x] Department / Level / Course / Section (4 sub-fields)

Section B — Study Information
- [x] Respondents
- [x] Target Number of Respondents
- [x] Data Collection Method (Survey / Interview / Mixed / Observation)
- [x] Data Capturing Tool (Electronic / Paper / Voice / Video)
- [x] Duration (start / end)

Review checklist (Yes/No/NA) + declaration
- [x] 8-item Form-1 review checklist (minors, approval letter, voluntary, confidentiality,
      withdrawal, harm, academic-use, docs-uploaded)
- [x] Data Privacy Policy certification checkbox
- [x] Researcher + Adviser signature capture + date signed

Proposed DPO-internal fields (🔴 ASSUMPTION — not on Form 1)
- [~] Email / Contact number (email captured for account/notifications; rest not surfaced as form fields)
- [ ] Applicant Type, Purpose, Personal-data types, Data Subjects, Retention plan, 3rd-party sharing, DPIA upload

Output
- [x] Data Privacy Clearance certificate on approval, control no. `DPREQ-2026-NNNNNN`
- [x] QR verification code on certificate
- [-] Joint dual-signed Form 3 certificate (retired 2026-07-25 — independent certs)

## 1.2 Workflow & status (`docs/1.2`)
- [x] Lifecycle `Draft → Submitted → Under Review → Approved → Clearance Issued`
- [x] `Returned` (mandatory comments) and `Rejected` (mandatory reason) branches
- [x] `startReview` (take Under Review)
- [x] Screening checklist (proposal, DPIA, consent template, fields complete, identity verified)
- [x] Approve blocked until Research Team NDA signed + no outstanding required revision
- [x] Additional-requirement request via revision engine (gates approval)
- [x] Clearance issues independently of Ethics track
- [x] Notifications: submitted / returned / additional-req / approved / rejected / clearance issued

## 1.3 Documents (`docs/1.3`)
- [x] Accepted types + size caps: approval letter, Chapter 1, questionnaire, adviser endorsement (PDF)
- [x] Conditional parental-consent letter + reply slips (minors)
- [x] File naming applied via `DocumentService`
- [x] Repository placement under DPO/DPREQ tree
- [x] Version retention (old versions kept, soft-delete only)
- [~] Retention schedule: 7yr issued / 3yr rejected bucketing built; **purge disabled** pending DPO sign-off (B8)
- [ ] Proposed extras (DPIA, "other supporting docs") — not built (🔴 assumption)

---

# MODULE 2 — DPNDA / NDAs

## 2.1a Research Team NDA — Form 2, DPO-POL-005 (`docs/2.1`, `reqs/DPO EFORM 2`)
- [x] Fields mirrored from Form 1 (title, lead, group size, adviser, dept, respondents, method, tool, duration)
- [x] 8-item obligations checklist (Yes/No/NA)
- [x] Data Privacy certification checkbox
- [x] Per-member rows (Name, Role=Leader/Member, Signature)
- [x] Per-member unique single-use 14-day signing links (email) — public `/nda/sign/{token}`
- [x] Lead adds/manages members on application Show page + resend invitation
- [x] Signature identity capture (IP + user agent) on PDF
- [x] Drawn e-signature with typed-name fallback
- [x] Signed NDA PDF generated; full execution gates DPREQ `Approved`

## 2.1b OJT / Trainee NDA — Form 5, DPO-POL-002 (`docs/2.1`, `reqs/DPO EFORM 5`)
- [x] Fields: trainee name, gender, age, school, hours, dept/level/course/section, address, dept assigned, supervisor, endorsed by, duration
- [x] 7-item obligations checklist (Yes/No/NA)
- [x] Effective + termination-notice acknowledgment checkboxes
- [x] Trainee e-signature + Department Head countersignature
- [x] Signed NDA PDF generated + auto-named

## 2.2 Workflow & status (`docs/2.2`)
- [x] Lifecycle `Draft → Sent for Signing → Trainee Signed → Coordinator Countersigned → Completed/Archived`
- [x] `Declined` branch (with reason)
- [x] Notifications: ready-to-sign / trainee-signed / fully-executed / declined
- [x] Coordinator CSV batch onboarding (`/dpnda/import`, preview-then-confirm)
- [x] OJT Evaluation Report upload by coordinator (feeds 5.3 compliance report)
- [-] NDA template versioning / `nda_templates` table (declined 2026-07-04)

---

# MODULE 3 — REMIS / Research Ethics

## 3.1 Application form (`docs/3.1`, FRS §III) — shared Form-1 intake + Ethics elaboration
- [x] Section A — applicant info (name, type, dept/program, email, co-researchers, adviser)
- [x] Section B — study info (title, type, design, population, vulnerable?, site, funding, dates)
- [x] Section C — participants (target pop, count, inclusion/exclusion, vulnerable indicator)
- [x] Section D — ethics info (risks, benefits, confidentiality, consent process, data storage)
- [x] Section E — uploads: mandatory trio (proposal/consent/instrument) + conditional minors (parent consent, assent) + permission letters / training cert / additional
- [x] Submission blocked if any mandatory doc missing
- [x] Section F — ethical-compliance declaration + PI e-signature (+ adviser if student)
- [x] Output: Research Ethics Clearance / Certificate of Exemption, `REMIS-2026-NNNNNN` + QR
- [~] July-7 unified form: documented field set built as one shared form (`applicant_category` split); final student/employee **variant layouts** deferred (ROADMAP B1)

## 3.2 Screening & risk (`docs/3.2`, FRS §VI–VII)
- [x] Administrative screening (Ethics Secretariat): 5-item checklist
- [x] Screening decision: Complete / Incomplete / Returned for Compliance
- [x] Auto deficiency-notice PDF on Incomplete / Returned
- [x] Risk classification: Minimal / Moderate / High (manual decision buttons)
- [x] Review type auto-derived (Expedited / Committee / Full Board)
- [x] Classifier fields: assigned level, classified-by, date, rationale
- [-] Exact criteria thresholds between levels — **N/A by decision (2026-09-05):** risk and
      screening are decision buttons; the classifier's judgement stands, no auto-thresholds

## 3.3 Endorsement, review & decision (`docs/3.3`, FRS §IV/V/VIII/X)
- [x] Full lifecycle incl. `Under Endorsement → For Screening → For Review → decision → Clearance Issued → Monitoring → Closed → Archived`
- [x] Academic endorsement chain: Adviser → Program Head → Dean (Approve / Return / Reject each)
- [x] Endorsement action records name, timestamp, remarks, e-signature
- [x] Tracking number assignment on screening pass
- [x] Seven-criteria reviewer form + recommendation (Approve / Minor / Major / Disapprove)
- [x] Multi-reviewer panel; duplicate-reviewer guard
- [x] Consolidation gate: all assigned reviewers must submit before Chair decides
- [x] Decision outcomes: Approved / Approved with Conditions / Deferred / Disapproved / Exempted
- [x] `for_review` / `for_screening` gates enforced
- [x] Notifications across every documented trigger
- [~] Cross-reviewer risk-classification reconciliation — latest-wins (FRS silent, not built)

## 3.4 Monitoring & completion (`docs/3.4`, FRS §XII/XIV)
- [x] Monthly progress report (status, participants recruited, ethics concerns, protocol deviations, corrective actions, docs)
- [x] Reviewer compliance review (Compliant / Minor / Major / Non-compliant)
- [x] Computed Monitoring Due Date + Overdue widget
- [x] Auto-start monitoring on clearance issuance (documented ASSUMPTION trigger)
- [x] `monitoring_paused` → resume route/policy/UI
- [x] Completion report (date, final count, compliance stmt, publication status, storage, outputs)
- [x] Auto Close → Archive on completion acceptance
- [-] Exempted studies auto-close/archive — NO (rest at clearance_issued permanently, B2)
- [-] Discontinued/Withdrawn early-exit workflow (declined; enum kept forward-compat)

## 3.5 Incident reporting (`docs/3.5`, FRS §XIII)
- [x] Filer roles: Researcher / Secretariat / Reviewer / Chair
- [x] Incident types (complaint, data breach, confidentiality breach, psychological harm, protocol violation, other)
- [x] Record fields incl. severity, description, immediate actions, supporting docs
- [x] Transactional filing
- [x] Immediate notify Chair + Secretariat; DPO cross-notify on Data/Confidentiality Breach
- [x] Incident tracking (status, assigned-to, append-only investigation notes)
- [x] Corrective-action monitoring (required, due date, status, verified-by, verification date)
- [x] Auto-cancel (hold) research on breach — a Data/Confidentiality Breach auto-holds the study
      (`monitoring` or `clearance_issued` → `monitoring_paused`); resumable by the applicant or
      ethics staff if it's a false alarm (2026-09-05)

---

# SHARED INFRASTRUCTURE

## 4.1 Users, roles & permissions (`docs/4.1`, `docs/0.2`)
- [x] 14-role model + capability matrix enforced (policies/gates)
- [x] Admin user CRUD (`/admin/users`): create / edit / reassign role / dept / status
- [x] Bulk CSV import (validate-then-confirm preview)
- [x] Bulk status update
- [x] Email verification on account creation
- [x] Adviser cohort join codes / invitations / manual-add (`/adviser/cohorts`, `/join/*`)
- [x] Self-service "Request an account" flow (2026-09-05) — requester picks **Employee/Faculty
      researcher** (→ `researcher_internal`, tagged employee) or **External adviser** (→ `adviser`);
      DPO/admin approves. No new role — student/employee is a profile attribute, not a permission set
- [x] `applicant_category` on the account (student/employee) set at every creation path (cohort →
      student, employee request → employee, admin choice); DPREQ/REMIS intake derives it, so the
      "Are you filing as…?" selector was removed from the form
- [x] Public self-registration removed
- [x] Role changes audit-logged
- [~] Suspend/deactivate status settable but no forced logout on suspend

## 4.2 File management & naming (`docs/4.2`)
- [x] Naming `REC-{MODULE}-{DEPT}-{CTRL}_{YYYYMMDD}_{LABEL}_V{n}.{ext}`
- [x] Original filename retained separately
- [x] Repository tree (DPO / ORD / Archive)
- [x] Versioning — each version a distinct file; reviewer side-by-side compare
- [x] Soft-delete only
- [x] Auto-archival of superseded versions on clearance issuance
- [x] Retention schedule config (`config/retention.php`); monthly report-only sweep
- [ ] Enable actual purge (needs `--purge` + `RETENTION_PURGE_ENABLED=true` + DPO sign-off, B8)

## 4.3 E-signature & notifications (`docs/4.3`)
- [x] E-signature across DPREQ / DPNDA / REMIS (drawn + typed fallback)
- [x] Every signature records name, role, timestamp, IP, device, doc version
- [x] Signed docs locked read-only
- [x] In-app notification bell (badge + dropdown + history page)
- [x] Email notification channel (queued, mirrors in-app)
- [x] Triggers wired across all modules
- Dashboards (DPO/ORD widgets):
  - [x] New Submissions (unscreened)
  - [x] Pending My Action (per-user where schema supports, per-role otherwise)
  - [x] Returned / Revisions Requested
  - [x] Recently Completed
  - [x] Overdue Monitoring (ORD only)
- [-] SMS channel (declined — cost)

## 4.4 Audit trail & status tracking (`docs/4.4`)
- [x] Logged events: create, submit, status change, doc upload/replace, signature, role change, report generated
- [x] `{entity}.viewed` on sensitive records (B5)
- [x] Audit trail report — filterable + exportable
- [x] Read access gated to Admin / DPO Staff / REC Chair (`AuditLogPolicy`)
- [x] Applicant-facing simplified progress tracker
- [x] Persistent searchable Application ID; own-record + office-scope search

---

# REPORTS (13/13)

## 5.1 Shared (`docs/5.1`)
- [x] Applications by Department (table + bar chart, CSV/PDF)
- [x] Compliance Monitoring Report
- [x] Incident Summary (by type / severity / status, time-to-resolution)

## 5.2 ORD (`docs/5.2`)
- [x] Applications by Risk Level (pie chart)
- [x] Reviewer Workload (active/completed/turnaround)
- [x] Annual Ethics Report (formatted PDF)
- [x] Archive Studies Report

## 5.3 DPO (`docs/5.3`)
- [x] NDAs by Department × Grade Level
- [x] Pending DPO Approvals (with reasons, days pending)
- [x] OJTs Accommodated (month/year × school × dept, trend chart)
- [x] Trainee Whereabouts (placement-schedule snapshot)
- [x] OJT Evaluation Report Compliance (compliant / non-compliant lists)
- [-] Student Teachers by Grade Level (retired 2026-07-06 — folded into OJT reports)

Cross-cutting
- [x] Role-based report visibility + 403 on cross-office direct URL
- [x] CSV export + PDF download per report

---

# CROSS-CUTTING / PLATFORM

- [x] Public verification portal (by number or QR; read-only; rate-limited 10/min/IP)
- [x] Per-track independent certificates + control-number service
- [x] Env-configurable certificate signatories (`SIGNATORIES.md`)
- [x] Real optimistic locking (version column + expected_version round-trip)
- [x] Shared revision engine (comment/document requests gate resubmission/approval)
- [x] Additive amendments (`application_amendments`)

---

# GO-LIVE (from ROADMAP-TO-COMPLETION)

## Phase A — engineering (no stakeholder input)
- [x] Knowledge-graph corrections · CHANGELOG gap reconstructed · CSV onboarding · screenshots relocated · load targets documented
- [ ] Submission-history timeline UI + certificate issuance history (Future Enhancement, build if asked)
- [ ] Full knowledge-graph regeneration (cohorts, revisions, exemption, import nodes)

## Phase B — stakeholder decisions (resolved 2026-08-31)
- [~] B1 unified-form variant layouts **[ratify]** · [x] B2–B7 resolved & in code
- [ ] B8 enable retention purge — human-gated · [ ] B9 login-policy legal review — human-gated

## Phase C — IT / infrastructure
- [ ] Hosting decision (type, PCC domain/DNS, SSL, MySQL 8.0+, CI/CD)
- [ ] SSO Microsoft Entra ID (blocked on PCC IT app registration)
- [ ] Real mail delivery (SMTP/Mailgun/SES creds + verified domain)
- [x] Virus scanning (ClamAV, off by default, fail-closed)
- [x] Local-disk backup job (mysqldump + docs tarball, 30-day)
- [x] Queue worker + scheduler (Supervisor + `pcc-edms-cron`)

## Phase D — process & go-live
- [ ] Resolve B8/B9 · [ ] stand up Phase C (staging first)
- [ ] UAT round (script ready: `docs/UAT-SCRIPT.md`)
- [ ] Training/handover (material ready: `docs/TRAINING.md`)
- [ ] Legal review of e-signature posture (ADR-005, RA 8792)
- [ ] Run `DEPLOYMENT_CHECKLIST.md` + restore drill + uptime monitoring
- [ ] Push/PR gated on requester go-ahead · [ ] go-live (keep paper fallback one cycle)

Deployment checklist items (`docs/DEPLOYMENT_CHECKLIST.md`)
- [ ] `.env` complete · migrations run · storage writable · tests pass · queue running · assets built · SSL enforced

## Phase E — front-end redesign
- [x] `docs/DESIGN.md` token system + sanctioned exception pages documented
- [x] Header-treatment sweep (2026-09-05) — dropped the `PageHeader` layout-slot band on all 37
      authenticated pages; each now carries the inline typographic header (eyebrow + title +
      description) matching `Dpreq/Show`. Verified in-browser; 164 tests pass, build clean
- [ ] Full page-body restyle (panels/tokens beyond headers) — page-by-page under DESIGN.md §4, only when asked

---

# OUT OF SCOPE (decided — do not rebuild)
- [-] Joint dual-signed clearance · SMS notifications · NDA template versioning ·
  Discontinued/Withdrawn workflow · digital-signature verification beyond identity capture ·
  public self-registration
