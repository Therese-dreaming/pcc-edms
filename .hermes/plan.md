# PCC-EDMS — Structured Execution Plan

> Generated from full documentation review (docs/0.1–9.1, stakeholder-package, HANDOFF.md, CHANGELOG.md, system-design.md, architecture.md, testing-strategy.md, REMIS FRS, WORKFLOWS.md, knowledge-graph.md).
>
> **Current state:** The system is functionally complete per docs/1.x–5.x — DPREQ, DPNDA, REMIS, Incident Reporting, all 13 reports, dashboards, notifications, admin, e-signatures, PDF generation, verification portal. Git state: `main` has 3 commits (27e8ed9, ee0bdee, 6faf9be), 2 untracked files (`IDEA.md`, `docs/stakeholder-additional-features.md`).
>
> **What's NOT built (by explicit decision or pending external input):** Unified Application Form (waiting for final student/employee variants), SSO (waiting on IT Entra ID provisioning), virus scanning (deferred by requester), NDA template versioning (declined), SMS notifications (declined), discontinued/withdrawn workflow (declined).

---

## Phase 1 — Unified Application Form Fields

**Source:** `docs/9.1` §2b, `docs/stakeholder-additional-features.md`, `docs/CHANGELOG.md` (2026-07-07 entry)

**Status:** NOT started — deliberately deferred pending final form variants. The requester said "wait" on 2026-07-07.

**What needs to happen when the final form arrives:**
1. **Migration:** Add `data_classification` (enum: non_personal/personal/sensitive_personal/privileged_information) to `research_applications`; add `dpias_required` (boolean) to `remis_applications`; add `storage_method`, `data_access_who`, `retention_period`, `disposal_method` to `research_applications`; add `ethical_considerations` (JSON) to `research_applications`.
2. **Form fields:** Structured checkbox-driven ethical considerations (8-item Yes/No/N/A), 4-level self-reported risk band with explain field, Part V attachments checklist (10 named documents including Data Privacy Notice, Data Management Plan, Turnitin report).
3. **Decision outcome:** Add `exempted` to `decisions.outcome` enum.
4. **Risk classification:** Add `dpias_required` flag to `risk_classifications`.
5. **Controller:** Update `ResearchApplicationService::submitForm1()` to accept and validate new fields.
6. **Frontend:** Update `Dpreq/Create.jsx` with new structured fields.
7. **Reports:** Update Annual Ethics Report to include exemption counts.

**Blockers:** Final student/employee form variants + clearance/exemption certificate layout from requester.

---

## Phase 2 — REMIS Review Panel Consolidation UI

**Source:** `docs/HANDOFF.md` Part G, `docs/3.3-remis-review-workflow.md`, `docs/9.1` §1

**Status:** Backend built (multi-reviewer panel confirmed 2026-07-04). UI partially done.

**What's done:**
- `review_assignments` supports multiple reviewers per application (no uniqueness constraint)
- `RemisWorkflowService::decide()` requires all reviewers to submit before decision
- `Remis/Show.jsx` has a "Review Panel" section listing reviewers + recommendations
- Assign-reviewer form allows "Assign Another Reviewer"

**What's missing:**
1. **Consolidation view:** A side-by-side comparison of all reviewer recommendations when the Chair is deciding — currently each recommendation is shown in the panel list but there's no consolidated diff view.
2. **Conflict resolution:** If reviewers disagree on risk level, the system currently takes the most recent (`latestOfMany()`). No UI indicates a conflict or prompts the Chair to resolve it.
3. **Reviewer workload balancing:** The Chair assigns reviewers manually. No auto-suggestion based on current workload (the Reviewer Workload report exists but isn't used for assignment suggestions).

**Action items:**
- [ ] Add a "Consolidate Reviews" modal on the Decide form showing all reviewer recommendations side-by-side
- [ ] Add a warning banner when reviewers disagree on risk level
- [ ] Add reviewer workload count to the assign-reviewer form (read-only, from `OrdReportService::reviewerWorkload()`)

---

## Phase 3 — Audit Trail Read-Access Gating

**Source:** `docs/4.4-audit-trail-status-tracking.md`, `docs/9.1` §1, `docs/HANDOFF.md` Part I

**Status:** Confirmed (2026-07-06): Admin, DPO Staff, Ethics Committee Chair only. NOT yet built — no code currently restricts audit-trail read access.

**What needs to happen:**
1. **Policy:** Create `AuditLogPolicy` with `viewAny` gated to `system_administrator`, `dpo_staff`, `ethics_committee_chair` roles.
2. **Controller:** Add `AuditLogController` with index/show endpoints, route-gated via policy.
3. **UI:** Add "Audit Trail" link to the Reports index (or a separate nav item) for authorized roles only.
4. **Frontend:** `AuditTrail/Index.jsx` page with filterable table (date range, module, user, record ID, event type) + PDF/Excel export.
5. **Authorization:** Ensure `AuditLogPolicy` is registered in `AuthServiceProvider`.

**Blockers:** None — this is a confirmed requirement with no external dependencies.

---

## Phase 4 — File Upload Versioning UI + Comparison

**Source:** `docs/4.2-file-management-naming.md`, `docs/1.3-dpreq-documents.md`, `docs/3.1-remis-application-form.md`, `docs/stakeholder-additional-features.md` §3

**Status:** Backend versioning built (`DocumentService::createVersionedRecord()` creates new versions, marks old as `is_current_version = false`). UI for version history/comparison NOT built.

**What's done:**
- Re-uploading creates a new version, old version retained
- `documents.is_current_version` flag tracks current version
- `DocumentService` handles versioning automatically

**What's missing:**
1. **Version history UI:** On any show page that has documents, show a "Document History" section listing all versions with upload date, uploader, and a download link for each.
2. **Side-by-side comparison:** For PDF documents, a split-view or toggle between versions.
3. **Restore version:** Ability to mark an older version as current (with audit trail entry).

**Action items:**
- [ ] Add `DocumentHistory` component showing version list per document type
- [ ] Add version download links (each version stored at a unique path)
- [ ] Add "Restore this version" action (admin/DPO Staff only) with audit log
- [ ] Integrate into `Dpreq/Show.jsx`, `Remis/Show.jsx`, `Dpnda/Show.jsx`

---

## Phase 5 — Notification Bell Enhancements

**Source:** `docs/4.3-esignature-notifications.md`, `docs/HANDOFF.md` Part C

**Status:** Bell built with Inertia-shared prop (no real-time polling). Missing:
1. **Real-time polling:** Currently the bell only refreshes on full page visit. Add a lightweight polling endpoint (every 60s) to update unread count without a full page reload.
2. **Mark all as read:** The bell dropdown has click-to-mark-read per notification but no "Mark all as read" button.
3. **Notification filtering:** No way to filter notifications by type (submission, approval, review, etc.).

**Action items:**
- [ ] Add `GET /api/notifications/unread-count` endpoint returning `{unread_count, recent}`
- [ ] Add polling in `NotificationBell.jsx` (60-second interval, abort on unmount)
- [ ] Add "Mark all as read" button to the bell dropdown
- [ ] Add notification type filter to `/notifications` history page

---

## Phase 6 — Comprehensive Test Suite

**Source:** `docs/testing-strategy.md`

**Status:** Only default Laravel auth tests exist (`tests/Feature/Auth/*`, `tests/Unit/ExampleTest.php`). No module-specific tests.

**What needs to be built (per testing-strategy.md coverage targets):**

### Workflow / status transitions (integration, Pest)
- [ ] DPREQ: every legal transition succeeds + writes status_history
- [ ] DPREQ: every illegal transition rejected with clear error
- [ ] DPREQ: `returned` → `submitted` (resubmit) path
- [ ] REMIS: full endorsement chain (Adviser → Program Head → Dean)
- [ ] REMIS: screening pass/fail + deficiency notice generation
- [ ] REMIS: risk classification + reviewer assignment
- [ ] REMIS: multi-reviewer panel — all must submit before decision
- [ ] REMIS: all 4 decision outcomes (Approved, Approved with Conditions, Deferred, Disapproved)
- [ ] REMIS: monitoring → progress report → completion → archived
- [ ] DPNDA: trainee sign → coordinator countersign → completed
- [ ] DPNDA: trainee decline path
- [ ] Incident: file → assign → transition → corrective action → verify

### Authorization / role boundaries (unit + integration)
- [ ] Every ✔ cell in `0.2`'s capability matrix has a passing test
- [ ] Every non-✔ cell has a passing test (role CANNOT perform action)
- [ ] Adviser cannot skip to Program Head step
- [ ] Ethics Reviewer cannot issue final Decision
- [ ] DPO Staff cannot approve REMIS application
- [ ] Unauthorized attempts write audit_log entry

### Audit trail (integration)
- [ ] Every state-changing action produces exactly one audit_log row
- [ ] audit_log rows are immutable (update/delete fails)
- [ ] Audit trail filtering (date range, module, user, record ID, event type)

### Documents (integration)
- [ ] Re-upload creates new version, old version retained
- [ ] Soft-delete: deleted document hidden but retrievable
- [ ] Non-admin cannot hard-delete
- [ ] File type/size validation per document type

### E-signature (integration)
- [ ] Signature event stores signer, role, timestamp, IP, document version
- [ ] Signed documents are read-only
- [ ] DPNDA: correct ordering (trainee → coordinator)

### Incident reporting + cross-module notification (integration)
- [ ] Data Breach incident → DPO Staff notified
- [ ] Participant Complaint → DPO Staff NOT notified
- [ ] Corrective action tracking transitions

### Reports (integration, data-driven)
- [ ] All 13 reports with seeded fixture data
- [ ] "Departments without OJT evaluation reports" (LEFT JOIN absence test)

### Public verification portal (integration + security)
- [ ] Valid token returns validity only
- [ ] Invalid/expired/malformed token returns generic 404 (no enumeration)
- [ ] Rate limiting (see Phase 7)

### Frontend (Vitest + RTL)
- [ ] Form validation matches backend rules
- [ ] Role-conditional UI (Researcher never sees Reviewer's form)

---

## Phase 7 — Rate Limiting + Security Hardening

**Source:** `docs/testing-strategy.md` §6 (gaps), `docs/4.3-esignature-notifications.md`

**Status:** NOT built.

**Action items:**
- [ ] Add rate limiting to `VerificationController` (e.g., 10 requests/minute per IP) via Laravel middleware
- [ ] Add `failed_jobs` table monitoring (already exists via Laravel) — ensure failed PDF generation jobs are visible
- [ ] Add optimistic locking on `status` columns (see Phase 8)

---

## Phase 8 — Concurrent-Edit Handling

**Source:** `docs/testing-strategy.md` §6 (gap)

**Status:** NOT built. The docs don't specify what happens if two endorsers/reviewers act on the same application near-simultaneously.

**Action items:**
- [ ] Add `version` column (integer, default 1) to `dpreq_applications`, `remis_applications`, `dpnda_records`, `incidents`
- [ ] Use Eloquent's `incrementing` + `where version = X` pattern in workflow services
- [ ] On conflict, return a 409 Conflict with a message like "Another user updated this application. Please refresh and try again."
- [ ] Test: two concurrent endorsement actions on the same application

---

## Phase 9 — Deployment Checklist Automation

**Source:** `docs/7.0-deployment.md`, `docs/HANDOFF.md` Part G addendum (virus scanning)

**Status:** Hosting/domain undecided. System is built to be portable (env-driven config, Filesystem abstraction).

**Action items:**
- [ ] Add a local-disk backup job script (see `docs/architecture.md` ADR-004 action item 2 — "stand up a local-disk backup job now")
- [ ] Add `.env` validation command (`php artisan env:check` or similar) to verify required keys are set
- [ ] Add `php artisan config:cache` to deployment script
- [ ] Document ClamAV integration shape (already researched in HANDOFF.md Part G addendum) — ready to implement when hosting is decided
- [ ] Add `APP_ENV=production` + `APP_DEBUG=false` enforcement in deployment

---

## Phase 10 — Documentation Updates

**Action items:**
- [ ] Update `docs/HANDOFF.md` with all changes made in this session
- [ ] Update `docs/CHANGELOG.md` with new entries
- [ ] Update `docs/9.1-review-and-open-questions.md` if any open questions are resolved
- [ ] Update `docs/testing-strategy.md` if test coverage changes
- [ ] Update `docs/system-design.md` if schema changes (Phase 1, Phase 8)

---

## Execution Order

1. **Phase 3** (Audit trail gating) — confirmed requirement, no external blockers, high value
2. **Phase 4** (File versioning UI) — backend done, UI is straightforward, high user value
3. **Phase 6** (Test suite) — run in parallel with other phases, validates all changes
4. **Phase 2** (Review panel UI) — small UI additions, backend done
5. **Phase 5** (Notification bell) — small frontend additions
6. **Phase 8** (Concurrent-edit) — schema change + service updates
7. **Phase 7** (Rate limiting) — small middleware addition
8. **Phase 9** (Deployment automation) — scripts/docs
9. **Phase 1** (Unified Form) — BLOCKED on requester, skip until final form arrives
10. **Phase 10** (Documentation) — continuous, finalize at end

**Phase 1 is explicitly blocked** — do not start until the requester provides the final student/employee form variants and clearance/exemption certificate layout.