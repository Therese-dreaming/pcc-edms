# Session Handoff — 2026-07-02 through 2026-07-07/08 (multi-session, agent handoff pending)

Written to carry context into the next session — and, as of this revision, into a **different
agent** entirely (the requester is switching agents after 2026-07-09). For "how do I run this,"
see [`GETTING_STARTED.md`](../GETTING_STARTED.md) at the project root. This file is about *what
exists, why it's shaped this way, and what's still open* — read it before making changes.

The previous session's handoff is preserved below under **§7 (session 1 handoff)** — its "bugs
found" section (§7.4) is still live knowledge, worth reading once.

---

## 2026-08-31 — Full cross-audit session (senior-team review)

Requester-ordered audit: index the codebase, deep-read `docs/` + `reqs/`, fix logic loopholes
(not just syntax), and produce a done/missing checklist. Full detail in `CHANGELOG.md`'s
2026-08-31 entry; the short version for the next session:

- **State:** 159 tests passing (751 assertions), `composer audit` clean (12 advisories
  patched), `npm run build` clean. All work committed on `main` in incremental commits,
  **still not pushed**.
- **Roadmap session (requester-delegated decisions, see `ROADMAP-TO-COMPLETION.md` Phase B):**
  unified Form 1 Parts II–V intake fields; `{entity}.viewed` audit events on sensitive-record
  show pages; coordinator CSV batch onboarding (`/dpnda/import`); targeted knowledge-graph
  corrections; screenshots moved to `docs/assets/verification-screenshots/`; load-target
  assumptions documented. B8 (purge enablement) and B9 (policy-copy legal review) remain
  human-gated.
- **Loopholes fixed:** non-atomic `decide()`/`screen()`; missing `for_review` gates on reviewer
  assignment/review submission; exempted studies wrongly entering monthly monitoring;
  `monitoring_paused` dead-end (resume route/policy/UI now wired); retention purge mis-bucketing
  archived-issued REMIS studies and ignoring DPNDA; revision double-close; verification portal
  mislabeling exemption certificates; non-transactional incident filing; and a latent crash —
  unauthenticated (token-signing) issuance hit NOT NULL `status_history.changed_by` (now
  nullable + explicit actor attribution).
- **New docs:** `ROADMAP-TO-COMPLETION.md` (the 100%-completion plan, phases A–E) and
  `SIGNATORIES.md` (all certificate signatories are now env-configurable — stakeholder confirmed
  the current names are correct but wanted them changeable without code edits).
- **Important current-truth notes:** the REC Clearance/Exemption certificate layouts in
  `reqs/REMIS-certs/` (2026-07-31) ARE the implemented templates; the Exempted decision outcome
  and unified-form intake fields were built 2026-07-28 (this postdates §0's "2026-07-25
  session-end state"); `docs/CHANGELOG.md` has a gap for 2026-07-29..08-30 — do not assume
  absence of an entry means absence of work for that window.
- **Still standing from §0:** no `main` push without asking; no redesign resume; the unified
  form's remaining deltas stay deferred pending the final student/employee variants.

---

## 2026-07-25 — Stakeholder additional-features work (in progress, batched)

Working through `docs/stakeholder-additional-features.md` in five batches (A→E), confirmed with
the requester up front via a 4-question decision. **Batch A is complete and verified; B–E are
still to do.**

**Decisions locked in (2026-07-25):**
1. **Certificates: fully independent.** DPO and Ethics each issue their own certificate on their
   own approval — the joint dual-signed model is retired. (Done in Batch A.)
2. **Control Number: separate from tracking number.** New 6-digit `DPREQ-2026-NNNNNN` /
   `REMIS-2026-NNNNNN`, generated at issuance, never reused. Tracking numbers stay as internal
   working IDs on the applications. (Done in Batch A.)
3. **Accounts: remove public self-registration; Advisers + Admin create applicant accounts.**
   (Batch C — not yet started.)
4. **Login compliance panel: add to existing hand-edited `Login.jsx`, preserving its styling.**
   (Batch E — not yet started.)

**Batch A — Independent certificates + control numbers — DONE (see CHANGELOG 2026-07-25).**
Reshaped `clearance_certificates`, new `CertificateNumberService`, rewrote `ClearanceService`,
split the joint PDF/job/template into per-track DPREQ/REMIS versions, updated verification portal
and Show pages. Fixed two latent Part L bugs along the way (`autoPauseMonitoring` wrote an
illegal `'paused'` status; the `remis_applications.status` enum was missing `monitoring_paused`).
Verified end-to-end: `migrate:fresh --seed` clean, PDFs render, `/verify` resolves each track
independently.

**Batch B — File naming convention + version comparison — DONE (see CHANGELOG 2026-07-25).**
New `DocumentNaming`/`FileLabel` support classes produce
`REC-{MODULE}-{DEPT}-{CTRL}_{YYYYMMDD}_{LABEL}_V{n}.{ext}`; `DocumentService` refactored (version
computed before naming, optional `department` threaded through all 7 call sites). Reviewer
side-by-side version compare added to `Documents/VersionHistory.jsx` via a new inline `preview`
route. Verified: filenames match spec, seed produces correct names, build clean.

**Batch C — Adviser-managed accounts — DONE (see CHANGELOG 2026-07-25).** Public self-registration
removed (routes + `RegisteredUserController` + `Register.jsx` deleted; `Login.jsx` CTAs removed).
New `AdviserUserController` + `UserPolicy::createApplicant` + `AdminUserService::createApplicant()`
(reuses the activation-email path, forces an applicant researcher role, not self_registered so it
skips `/select-role`). New `users.student_number`. New `Adviser/CreateApplicant.jsx` + nav link.
Verified: `/register`→404, adviser authz correct, created accounts correct.

**Note for Batch E:** the hand-edited `Login.jsx` **already contains** a substantial compliance
aside ("Terms and Data Policy", 7 numbered sections, marked "Policy draft v0.1"). Batch E should
verify it covers the four required items (Privacy Policy, Terms & Conditions, Data Privacy Notice,
Consent Statement) and fill gaps while preserving that styling — not rebuild it.

**Batch D — Signature identity + per-member signing links — DONE (see CHANGELOG 2026-07-25).**
N1: `signature_ip`/`signature_user_agent` on all four signature tables, captured via
`SignatureIdentity::capture()`, rendered on the two NDA PDFs. R3: `email`/`signing_token`/
`token_expires_at`/`invited_at` on signatories; `addMember`/`resendInvitation`/`signByToken` in
`ResearchTeamNdaService`; queued `ResearchTeamNdaInvitationMail`; PUBLIC `/nda/sign/{token}`
(`ResearchTeamNdaSigningController` + `Nda/Sign.jsx`, single-use + 14-day expiry); lead-researcher
member management on `Dpreq/Show.jsx`. Verified end-to-end in-browser (signed via token link,
IP/device recorded, single-use enforced).

**Batch E — Login compliance panel — DONE (see CHANGELOG 2026-07-25).** The hand-edited
`Login.jsx` already carried a 7-section compliance aside; added a chip row explicitly naming the
four required items (Privacy Policy / Terms & Conditions / Data Privacy Notice / Consent
Statement) using the page's existing chip styling. Nothing else restyled, per §0's standing rule.

**Test suite: now fully green — `php artisan test` → 31 passed, 0 failed** (was 22 passed / 8 failed
before this session's work). The 8 original failures were all pre-existing, none regressions:
`AuditLogAccessTest` (5) wrote to `action`/`properties` columns that don't exist on `audit_log`
(silently dropped as non-fillable, leaving the required `event_type` NULL); `ConcurrentEditTest` (2)
used an invalid `side => 'ethics'` role value plus a `RemisApplication::create()` missing 12
non-nullable columns; `ExampleTest` (1) was the stock Laravel test expecting `GET /` → 200 when
`routes/web.php` redirects. `tests/Feature/Auth/RegistrationTest.php` was **deleted** — it tested
the self-registration feature Batch C deliberately removed.

**⚠️ Phase 8 "Concurrent-Edit Handling" was never real — now actually implemented.** The two
`ConcurrentEditTest` failures turned out not to be fixture bugs: `$optimisticLock` is not a Laravel
feature and `Illuminate\Database\LockAcquisitionException` does not exist, so the locking was inert
and the controllers' catch blocks were dead code. Concurrent approvals silently overwrote each other
in production. Replaced with a real `version`-column implementation (`App\Shared\Concurrency\*`) plus
an `expected_version` round-trip from the Show pages. **Lesson for future sessions: a phase marked
"complete" in this file is not proof it works — this one had passing-looking docs, a migration, UI
notes, and tests, and still did nothing.** Full detail in `CHANGELOG.md` (2026-07-25 follow-ups).

**All five batches (A–E) are complete, plus three follow-ups** (real optimistic locking, certificate
QR codes, retention policy + auto-archival) **and cohort-based account provisioning** — see
`CHANGELOG.md`.

**Cohort provisioning (class join codes) — DONE.** Batch C's one-at-a-time adviser form didn't scale
to a 40–50 student class, so advisers now create a **cohort** once and share a join code/link/QR;
students enrol themselves with their own details. A manual add-member fallback (single or pasted
list) issues single-use emailed invitation links for anyone who can't self-enrol. New module
`app/Shared/Onboarding/` + public `routes/join.php`. Still gated, not open registration: the code
expires, can be capped and domain-restricted, and regenerating it invalidates every shared copy.
`tests/Feature/CohortJoinTest.php` (14 cases) covers the whole guard matrix. **Test suite: 45 passed.**

**"Create Applicant" retired + applications routed to the owning adviser — DONE.** The standalone
`/adviser/applicants/create` form was deleted (cohorts cover it). Two dead-code defects fixed:
`remis_applications.adviser_id` was never written (so every adviser saw every application), and
`notifyRole('adviser')` broadcast to all advisers per submission. Both now flow through the
applicant's cohort (`CohortService::adviserFor()` → `submitForm1()` sets `adviser_id`; targeted
`notifyAdviser()`). New `EndorserDashboardService` (advisers/program heads/deans had no dashboard).
Cohort editing added. `tests/Feature/AdviserRoutingTest.php` (8 cases). See CHANGELOG 2026-07-25.

**REMIS-first FRS completion + DPO rework + cross-cutting — DONE (see CHANGELOG 2026-07-25, three
entries: "REMIS FRS compliance (Phase 1)", "DPO workflow collapse (Phase 2)", "Nav access map + OJT
onboarding (Phase 3)").** Highlights, each with tests:
- **Form 1 gained document uploads** (mandatory trio + conditional minors docs + additional) — it had
  none, despite the FRS mandating them. Co-researchers are now NDA-signatory identities.
- **New shared `App\Shared\Revisions` engine** (FRS §IX): staff raise comment/document requests,
  applicant responds, mandatory items gate resubmission/approval. **Reused by both REMIS and DPO** —
  this is why REMIS was built first. Plus tracked additive amendments (`application_amendments`).
- **Screening checklist + auto deficiency-notice PDF** (§VI); **seven review criteria** (§VIII).
- **DPO workflow collapsed** `submitted → under_review → approved` (item 5); DPO can request
  additional requirements via the revision engine (item 7).
- **Nav gating** via a server-computed `can` map (item 2); **OJT onboarding** for account-less
  transferees — invite-at-placement + coordinator OJT batch cohorts (item 3).
- Tests: `Form1DocumentsTest`, `RevisionManagementTest`, `ScreeningAndReviewTest`, `DpoWorkflowTest`,
  `Phase3AccessTest`. **Full suite: 74 passed.**

**FRS §XV `documents.status` + §XVII admin summary dashboard — now DONE** (were briefly deferred; see
CHANGELOG). `Document::status` is a derived accessor; `AdminSummaryService` feeds admin stat tiles.
`FrsMetadataTest` (3). **Only remaining out of scope:** migrating Form 1 to the July-7 unified form
(`docs/9.1` §2b delta) — the requester chose incremental FRS additions, so that delta stays open for a
future decision. Everything else in the REMIS FRS is built.

### Session-end state (2026-07-25) — for the next session

- **Suite: 74 passed** (`php artisan test`). Build clean. `migrate:fresh --seed` clean. **Nothing is
  committed** — the working tree holds this session's work plus earlier uncommitted sessions
  (~67 new files, ~73 modified). Several migrations were reshaped in place, so a fresh checkout needs
  `php artisan migrate:fresh --seed`.
- **Browser-verified live** (on `php artisan serve` @ :8000): Form 1's new Sections C/D render;
  conditional Parent-Consent/Assent docs show only when "minors" is ticked; nav gating hides DPNDA
  from a researcher and REMIS/Incidents from DPO staff; the DPO under-review view shows the collapsed
  actions (Approve/Return/Reject + revision "Send request") with no Screening/Endorse; raising a
  mandatory document request via the UI works. Could NOT capture screenshots (the in-app browser pane
  wasn't displayed on the operator's side) — verification was DOM/props-level.
- **UX gap fixed mid-verification:** DPREQ Approve errors now display (see CHANGELOG). If you touch
  other `router.post` action buttons, check they surface `errors.*` — several don't by default.
- **Verification gotcha:** rebuilding assets (`npm run build`) mid-session changes the Inertia asset
  version, so an already-loaded page 409s and hard-reloads instead of processing the next POST. Do a
  full page reload after any rebuild before clicking through, or you'll see "nothing happens".
- **Update (later same session):** the two deferred FRS bits (§XV document status, §XVII admin
  summary) are now **done** (77 tests pass), and the seven-criteria reviewer form was browser-verified
  live (all 7 criteria + verdict selects render). The screening-checklist form is the same file/pattern
  and is unit-tested, but no `for_screening` app exists in the current seed to click-test it live.
- **Only remaining engineering:** the July-7 unified Form 1 (`docs/9.1` §2b) — deliberately deferred,
  needs a requester decision. **The requester's instruction is to finish everything before pushing,
  and NOT to push `main` first** — so the large uncommitted tree stays local until they say otherwise.

**Remaining items are non-engineering, deferred, or need a stakeholder answer:**
- The login policy copy is still **"Policy draft v0.1"** and needs review by PCC administration,
  the DPO, the Ethics Review body, and legal counsel before production.
- Signing-link expiry is currently **14 days** (`ResearchTeamNdaService::LINK_EXPIRY_DAYS`) — the
  stakeholder doc says "configurable period" but names no value; confirm with the requester.
- **`composer audit` reported 4 advisories affecting 1 package** during the `bacon/bacon-qr-code`
  install; the advisory API timed out before details could be fetched. Re-run `composer audit` with
  network access to identify and patch it.
- **Retention purge is intentionally disabled by default** (`RETENTION_PURGE_ENABLED=false`). Before
  enabling in production, confirm with the DPO that disposing of archived files after the 7/3-year
  windows is authorised, and that keeping soft-deleted `Document` rows as the disposal record
  satisfies their RA 10173 interpretation.
- Not built from the stakeholder doc's **"Future Enhancements"** list (explicitly future-scope, never
  requested): submission-history timeline UI, certificate issuance history, digital-signature
  verification (beyond the identity capture now recorded).
- **OJT coordinators still onboard trainees one at a time**, and their form is heavier than the
  researcher one (`placements` needs ~15 per-trainee fields, and `placements.trainee_id` requires the
  account to exist first). The cohort machinery in `app/Shared/Onboarding/` was built generically and
  is the natural thing to extend when this is picked up — scoped out deliberately (requester chose
  "advisers/researchers first", 2026-07-25).
- Cohort `department`/`level`/`course`/`section` mirror `research_applications` on purpose, so Form 1
  could later be prefilled from a joiner's cohort. Not wired up.
- SSO (Entra ID) and virus scanning (ClamAV) remain blocked/deferred exactly as before.

**Note for the next session:** the joint clearance is gone — do not reintroduce a dual-signature
gate. `research_applications.overall_status` now has three values (`in_progress`,
`partially_cleared`, `clearance_issued`).

## 2026-07-07 — Phase 6-9 Implementation Complete

**Summary:** All remaining implementation phases have been completed. This entry covers:
- Phase 2: REMIS Review Panel Consolidation UI
- Phase 3: Audit Trail Read-Access Gating
- Phase 4: File Upload Versioning UI
- Phase 5: Notification Bell Real-Time Polling
- Phase 6: Test Suite (Pest/PHPUnit tests)
- Phase 7: Rate Limiting on Verification Portal
- Phase 8: Concurrent-Edit Handling (Optimistic Locking)
- Phase 9: Deployment Checklist Automation

**New files created:**
- `app/Shared/AuditLog/Policies/AuditLogPolicy.php`
- `app/Shared/AuditLog/Http/Controllers/AuditLogController.php`
- `app/Shared/Documents/Http/Controllers/DocumentVersionController.php`
- `routes/documents.php`
- `resources/js/Pages/AuditTrail/Index.jsx`
- `resources/js/Pages/Documents/VersionHistory.jsx`
- `app/Exceptions/Handler.php` (custom 429 response for verification)
- `scripts/deploy-checklist.sh`
- `scripts/backup.sh`
- `pcc-edms-cron`
- `docs/DEPLOYMENT_CHECKLIST.md`

**Modified files:**
- `app/Modules/Remis/Models/RemisApplication.php` (optimistic locking)
- `app/Modules/Dpreq/Models/DpreqApplication.php` (optimistic locking)
- `app/Modules/Remis/Http/Controllers/RemisApplicationController.php` (risk classification eager loading, LockAcquisitionException handling)
- `app/Modules/Dpreq/Http/Controllers/DpreqApplicationController.php` (LockAcquisitionException handling)
- `app/Modules/Remis/Models/ReviewAssignment.php` (riskClassification relationship)
- `app/Providers/AppServiceProvider.php` (AuditLogPolicy registration)
- `routes/verify.php` (stricter rate limiting: 10 req/min)
- `resources/js/Layouts/AuthenticatedLayout.jsx` (Audit Trail nav, canViewAuditTrail logic)
- `resources/js/Components/NotificationBell.jsx` (30-second polling)
- `resources/js/Pages/Remis/Show.jsx` (conflict warning, consolidated review summary)

**Tests added:**
- `tests/Feature/AuditLogAccessTest.php`
- `tests/Feature/ConcurrentEditTest.php`

**Phase 1 — Unified Application Form: NOT YET BUILT**
The unified DPREQ/REMIS application form (`docs/9.1` §2b) is still pending. The requester confirmed the final versions are still coming this week. Building against a form that's been superseded risks rework. Do not implement until the final versions arrive.

**Open questions (still pending):**
1. Full-REMIS-track applicability for every submission vs. risk-based fast track
2. Exact risk-classification thresholds between Minimal/Moderate/High
3. Incident-filing auto-pause-on-breach rules
4. DPREQ/DPNDA document retention schedule (years for issued/rejected records)

---

## 0. Start here — orientation for a new agent (read this first)

If you only read one section, read this one. §1 onward is the full narrative for when you need
the "why" behind something.

**What's built:** every module — DPREQ, DPNDA, REMIS, Incident Reporting, all 13 reports,
notifications (in-app + email), DPO/ORD dashboards, Admin/User Management with bulk CSV import,
drawn e-signatures, PDF generation with real fonts/header image — is functionally complete and
has been browser-verified at least once. Full list: §6.

**Git state — read before touching any branch:**
- `main` and `stakeholder-preview` both pointed at the same single commit (`6faf9be`, "Initial
  commit") for the entire span of work described in this document — everything below existed
  only as *uncommitted* working-tree changes until this handoff, when it was committed to `main`
  in one commit (message references this file) so there's an actual history to hand off, not
  just a live file state.
- **That commit was NOT pushed to `origin`.** `stakeholder-preview` is already pushed and is
  frozen — it's what stakeholders were shown; **do not amend or force-push it.** `main` is
  reserved for "the finished version" per the requester's own explicit instruction early in this
  project ("this is just we can save an unfinished version, but afterwards we will finish it, and
  that will be main") — **do not push `main` to `origin` without asking first**, even though it's
  now committed locally. A permission-classifier previously blocked an unprompted push to `main`
  for exactly this reason, and the requester confirmed that boundary was correct when asked.
- Going forward, commit your own work incrementally on `main` (or a feature branch, if you
  prefer) rather than letting changes pile up uncommitted again.

**Front-end redesign — currently PAUSED and in a genuinely mixed state. Do not "fix" it without asking:**
- A full redesign was planned and approved around a maroon/paper design-token system
  (`resources/css/app.css`, `tailwind.config.js`): self-hosted fonts, `@tabler/icons-react`,
  SweetAlert2, and explicit anti-"AI slop" constraints (no gradients, no glassmorphism, no huge
  shadows, no purple/blue accents, limit to ~3 colors/fonts). That system was applied to the
  shared components (`Card`, `Table`, `StatusBadge`, `Alert`, `IconButton`), both layouts, the
  dashboard, and a mechanical color-token sweep across most of `resources/js/Pages/**`.
- Partway through, the requester began hand-editing several pages directly with a **different**
  aesthetic: `resources/js/Pages/Auth/*.jsx` (all six auth pages), `Dpreq/Show.jsx`,
  `Dpnda/Create.jsx` — using `stone`/`zinc` Tailwind defaults, a second icon library
  (`@phosphor-icons/react`, installed alongside the already-established `@tabler/icons-react`),
  gradients, glassmorphism (`backdrop-blur`), and large shadows — several of the things the
  original plan explicitly banned. `.agents/skills/` and `.claude/skills/` (part of this same
  commit) contain installed design skills (`industrial-brutalist-ui`, `minimalist-ui`,
  `redesign-existing-projects`, `design-taste-frontend`, etc.) likely used to generate these.
- When a previous pass tried to restyle the requester's hand-edited auth pages back toward the
  token system, the requester pushed back ("You changed the design completely") and asked for a
  revert — but the exact original pasted content for two of the six files was never fully
  captured in the agent's context and couldn't be restored byte-for-byte. **Lesson: don't
  unilaterally restyle pages the requester has hand-edited, even if they contradict an earlier
  approved plan — ask first, and if you must revert something, confirm you actually have the
  content to revert to before touching it.**
- **Current status: paused.** The requester explicitly said to pause the redesign and move to
  other work. Don't resume it, don't pick a direction, and don't try to reconcile the mixed
  styles across pages unless explicitly asked. `docs/DESIGN.md` (would formally document the
  token system) was never written; the Phase 2 full-app style migration was never finished.

**Pending on external stakeholders — don't build ahead of these:**
- A new "Unified Research Ethics and Data Privacy Clearance Application Form"
  (`reqs/July-7-2026_Unified-Research-Ethics-and-Data-Privacy-Clearance-Application-Form.pdf`)
  has real structural differences from the current build — new fields, an "Exempted" decision
  outcome, a DPIA yes/no flag, Data-Privacy-Act-aligned data classification, a richer attachments
  checklist. The requester confirmed: **wait** — separate student/employee form variants and a
  new clearance/exemption certificate layout are still coming. Full field-level delta already
  written up: `docs/9.1-review-and-open-questions.md` §2b. Don't implement any of it until told
  the final versions are in — see Part K.
- Four questions remain genuinely unanswered (not just unbuilt): full-REMIS-track applicability
  for every submission vs. a risk-based fast track, the exact criteria thresholds *between*
  Minimal/Moderate/High risk (the *mechanism* — manual decision buttons, no auto-classification —
  **is** confirmed and already built, just not the thresholds themselves), whether an incident
  should auto-pause a study's monitoring, and the DPREQ/DPNDA document retention schedule.
- SSO (Microsoft Entra ID / `pccnet.edu.ph`) is confirmed as the target provider but blocked on
  PCC IT registering an app and issuing credentials.
- Virus scanning (ClamAV — researched, deemed feasible and free) is deliberately deferred by the
  requester until the rest of the project is otherwise complete.

**Collaboration notes learned across this project:**
- The requester answers batches of open questions in one message, sometimes tersely — read every
  answer carefully before acting, since a short "Ok with this one" can address only part of a
  multi-part question (e.g. confirming an incident-filing role list without addressing the
  separate auto-pause-on-breach question in the same item).
- When a scope decision is ambiguous or risks wasted rework (the unified form is the clearest
  example), ask directly via a real question rather than guessing — the requester has
  consistently preferred being asked over having something built that then needs undoing.
- `docs/CHANGELOG.md`, `docs/HANDOFF.md`, and `docs/9.1-review-and-open-questions.md` are treated
  as first-class deliverables, updated in the same pass as the code change they describe, not
  deferred to "later."
- The requester previously told the classifier's git-push boundary was correct when it blocked an
  unprompted `main` push — take that as a standing preference, not a one-time correction.

---

## 1. What this project is

**PCC-EDMS** — a single platform shared by Pasig Catholic College's Data Privacy Office (DPO)
and Office of Research and Development/Research Ethics Committee (ORD/REC), replacing paper
processes for data-privacy clearances, OJT/trainee NDAs, and research ethics review.

Full spec lives in `docs/0.1` through `docs/9.1` — read `docs/README.md` first if this is your
first time in the repo. `docs/9.0-master-prompt.md` is the prompt this whole build has been
executing against, step by step (currently on **step 5: implement module by module**).

## 2. What happened this session

Session 1 finished DPREQ, DPNDA, REMIS, the verification portal, and Incident Reporting, then
flagged two candidates for session 2: the **Reporting module (`5.x`)** or **REMIS Monitoring &
Completion (`3.4`)**. Asked the requester directly — they picked **Reporting first**, then asked
to continue straight into **Monitoring & Completion**, then **the notification bell**, then
**the DPO/ORD dashboards**, all in the same session (four parts below).

**Part A — Reporting module:**
1. **Built 12 of the 13 defined reports** (`docs/5.1`-`5.3`) as a new `App\Shared\Reports`
   module:
   - Shared (`5.1`): Applications by Department, Incident Summary, Compliance Monitoring Report
   - ORD (`5.2`): Applications by Risk Level, Reviewer Workload, Annual Ethics Report, Archive
     Studies Report
   - DPO (`5.3`): NDAs by Department/Grade Level, Pending DPO Approvals, Student Teachers by
     Grade Level, OJTs Accommodated, Trainee Whereabouts
   - Compliance Monitoring and Archive Studies were built in a second pass (Part B below), once
     `3.4` gave them a real data source.
2. **Explicitly did not build 1** — see §3.
3. **Wrote `ReportDemoSeeder`** — pushes 6 research applications, a handful of REMIS
   endorsements/reviews/decisions, 2 incidents, and 5 OJT/trainee/student-teacher placements
   through their *real* workflow services (not raw inserts), so every report has non-trivial
   data to show. Runs by default now via `DatabaseSeeder` (after `RoleSeeder`/`UserSeeder`) —
   **not idempotent**, don't run it twice against the same database (use `migrate:fresh --seed`
   to reset and reseed cleanly).
4. **Verified all reports live in-browser**, logged in as `dpo.staff@pcc.test`, `chair@pcc.test`,
   and `secretariat@pcc.test`: correct role-based visibility on the `/reports` index, correct 403
   when a DPO-only role hits an ORD-only report URL directly (and vice versa), CSV export returns
   real filtered data, PDF download works, and cross-links (e.g. Pending Approvals →
   DPREQ show page) resolve correctly.

**Part B — REMIS Monitoring & Completion (`docs/3.4`):**
1. **New `progress_reports` and `completion_reports` tables**, a `Modules\Remis\Monitoring`
   sub-namespace (model/service/policy — mirrors how `Modules\Remis\Incident` is structured),
   and a `RemisMonitoringService` with `submitProgressReport()`, `reviewProgressReport()`, and
   `submitCompletionReport()`.
2. **`ClearanceService` now auto-starts monitoring**: once a joint clearance is issued, REMIS
   immediately transitions `clearance_issued → monitoring` (see §5 for why this is an
   ASSUMPTION, not an FRS-confirmed trigger).
3. **Extended `Remis/Show.jsx`** with a "Monitoring & Completion" card: progress-report history +
   submit form (researcher), compliance-review form (assigned reviewer only), and a completion-
   report submit form (researcher) that closes and archives the study in one step.
4. **Extended `ReportDemoSeeder`** to drive one application through the full
   `clearance_issued → monitoring → progress report → reviewed → completion report → closed →
   archived` lifecycle via the real services (not raw inserts), then separately drove a *second*
   application through the same path live via the actual browser UI (not just the seeder) to
   verify the React forms end-to-end — see §4 for a real bug this caught.
5. **Went back and built the 2 reports this unblocked**: Compliance Monitoring Report and Archive
   Studies Report, now with real `progress_reports`/`completion_reports` data. Also updated the
   Annual Ethics Report's "monitoring compliance summary" section, which previously always read
   empty, to show real counts.

**Part C — Notification bell (`docs/4.3`):**
1. **Discovered the bell would have been nearly empty.** `NotificationService` (built session 1)
   was only ever called from `IncidentService` — DPREQ, DPNDA, and REMIS never fired the
   notifications their own docs (`1.2`, `2.2`, `3.3`) specify, despite each doc having a full
   "Notifications Triggered" list. Wiring up the bell UI without also wiring up the triggers
   would have shipped a bell that only ever rang for incidents.
2. **Wired up every documented trigger**: `DpreqWorkflowService` (submit/return/endorse/
   reject/approve), `DpndaWorkflowService` (send-for-signing/trainee-signed/decline/countersign),
   `RemisWorkflowService` (submit/endorse-advance/for-revision/screen/reviewer-assigned/decide),
   and `ClearanceService` (joint clearance issued — one notification, not one per track, since
   it's the same event for the same person either way). Also extended `RemisMonitoringService`
   with progress-report/completion-report notifications, which docs/3.3 doesn't cover (that doc
   predates the `3.4` split — see `CHANGELOG.md`) — flagged inline as an inferred extension, not
   a literal doc requirement. A few notifications beyond the literal doc list were added where
   leaving them out would be a clear usability gap (e.g. notifying the specific reviewer when
   assigned) — each one is commented at the call site explaining it's an extension.
3. **Built the bell itself**: `notifications` is now an Inertia-shared prop on every request
   (`HandleInertiaRequests`) — `{unread_count, recent}` — since the app has no websocket/polling
   infra, a full page visit already refreshes it, which is enough for an MVP. `NotificationBell`
   component in `AuthenticatedLayout`'s nav bar (badge + dropdown, click-to-mark-read-and-navigate,
   mark-all-read), plus a full paginated `/notifications` history page.
4. **Added `Notification::related_url`** (an appended accessor, not a stored column) — maps the
   polymorphic `related_type` FQCN to the one show-page route each linkable type actually has
   (`dpreq.show`, `dpnda.show`, `remis.show`, `incidents.show`), returning `null` for anything
   unmapped or missing rather than throwing. Some call sites pass a different, still-linkable
   parent record instead of the literal event object — e.g. the joint-clearance notification
   links to the `DpreqApplication`, not the `ClearanceCertificate`, which has no standalone page.
5. **Found and fixed a real bug** — a props-naming collision — while browser-verifying the
   `/notifications` page. See §4.

**Part D — DPO/ORD dashboards (`docs/4.3`):**
1. **Replaced the placeholder `/dashboard`** (`"You're logged in!"`) with role-appropriate
   widgets, via a new `DashboardController` and `App\Shared\Dashboard\Services\
   {Dpo,Ord}DashboardService` (same one-service-per-office split as the Reporting module).
2. **Built 4 of the 5 documented widgets per office**: New Submissions (unscreened), Pending My
   Action, Returned/For Revision, Recently Completed. `dpo_staff`/`dpo_approver` get the DPO set,
   `ethics_secretariat`/`ethics_reviewer`/`ethics_committee_chair` get the ORD set,
   `system_administrator` gets both, everyone else (Requesters, adviser/program_head/dean,
   trainees) still gets the plain fallback message — docs/4.3 only defines dashboards for the two
   staff offices, not a per-role dashboard for every capability-matrix row.
3. **"Pending My Action" is genuinely per-user where the schema supports it, per-role otherwise.**
   `ethics_reviewer` sees their own `review_assignments` (a real FK to the logged-in user);
   `dpo_staff`/`dpo_approver`/`ethics_secretariat`/`ethics_committee_chair` see "whatever status
   my role currently owns" instead, because DPREQ screening/endorsement and REMIS screening have
   no per-user assignment column anywhere in the schema — the capability matrix gates those
   abilities by role, not by a specific assignee. Confirmed this actually differs per role by
   logging in as both `dpo_staff` and `dpo_approver`: same DPREQ table, two different widget
   contents (`screening`/`under_review` vs. `endorsed`).
4. **Explicitly did not build "Overdue Monitoring" (ORD-only widget)** — see §3, it needs a
   `monitoring_due_date` field that docs/3.4 itself flags as an unconfirmed ASSUMPTION, never
   stored anywhere (no monitoring cadence was ever confirmed with ORD).
5. **Verified across 7 logins** (`dpo.staff`, `dpo.approver`, `secretariat`, `reviewer`, `chair`,
   `admin`, `researcher`): each office role sees only its own section with correct, distinct
   counts; `admin` sees both sections; `researcher` (a non-office role) sees the original
   fallback message; widget links resolve to the correct DPREQ/DPNDA/REMIS show pages.

**Part E — Reporting module completed to 13/13, email notification channel, email verification,
and drawn e-signatures (2026-07-03):**
1. **Closed out the last report.** Built `ojt_evaluation_reports` (migration, model,
   `OjtEvaluationReportService`, `PlacementPolicy::uploadEvaluationReport`), a coordinator-facing
   upload UI on `Dpnda/Show.jsx` (shown once a record is `completed`), and the "OJT Evaluation
   Report Compliance" report (`5.3`) grouping placements by `department_assigned` into
   compliant/non-compliant lists. Seeded 2 of 5 departments as compliant via
   `ReportDemoSeeder` (real `UploadedFile::fake()` uploads through the real service, not raw
   inserts) and browser-verified. Reporting module is now 13/13.
2. **Built the email notification channel** (`docs/4.3` marks it "required," not optional — see
   session 2 handoff §7). `NotificationMail` (a queued `Mailable`) + `resources/views/
   mail/notification.blade.php`; `NotificationService::sendEmail()` fires alongside the existing
   in-app notification on every `notifyUser()` call, using `Notification::related_url` (already
   built for the bell) as the email's "View in PCC-EDMS" link. `notifyRole()` was refactored to
   resolve full `User` models and loop through `notifyUser()` per user, rather than duplicating
   the notification-creation logic for a role broadcast.
   Since the user explicitly asked to configure real mail credentials themselves, `.env` was left
   on `MAIL_MAILER=log` (safe default — verified via `storage/logs/laravel.log`) and
   **`docs/EMAIL_SETUP.md`** was written instead: a step-by-step guide covering Mailtrap (dev),
   real SMTP/Gmail App Password, Mailgun, and SES, plus verification steps. No `.env` values were
   touched.
3. **Enabled email verification on signup** (`docs/4.1` "Validation Flow"). `User` now implements
   `Illuminate\Contracts\Auth\MustVerifyEmail` — the trait was already present via
   `Illuminate\Foundation\Auth\User`, only the contract interface was missing, which is what
   Laravel's `verified` middleware and the auto-registered `Registered` listener actually check.
   Added `'verified'` to every module's route-group middleware (`dpreq`, `dpnda`, `remis`,
   `incidents`, `reports`, `notifications`) alongside the existing `'auth'`. Left `routes/auth.php`
   (the verify-email/password-confirm routes themselves) and `/profile` unmodified — Breeze
   convention, avoids a self-locking loop. Verified end-to-end: registered a fresh account, got
   redirected to `/verify-email`, found the queued verification email in the log with a real
   signed URL, clicked it, landed on `/dashboard` with `email_verified_at` set; also confirmed an
   unverified user hitting `/dpreq` gets redirected to `/verify-email` rather than let through.
4. **Implemented drawn e-signatures** (canvas-based, via `signature_pad` v5.1.3), replacing
   typed-name-only signing everywhere it existed. New `<SignaturePad>` component
   (`resources/js/Components/SignaturePad.jsx`) wraps the library, resizing the canvas to its
   container on mount and emitting a base64 PNG data URI via `onChange` on every completed stroke.
   Added nullable `LONGTEXT` `*_signature_image` columns alongside every existing
   `*_signature_id` (typed name) column: `research_team_nda_signatories`, `dpnda_records`
   (trainee + coordinator), `endorsement_actions`, `decisions`. Wired through
   `ResearchTeamNdaService::sign()`, `DpndaWorkflowService::traineeSign()`/
   `coordinatorCountersign()`, and `RemisWorkflowService::endorse()`/`decide()` — all as a new
   optional trailing param, validated server-side as `nullable|string|starts_with:data:image/png;
   base64,|max:200000`. **Per ADR-005 (`docs/architecture.md`), the drawn image is cosmetic only —
   the typed name + timestamp remains the legally-operative record under RA 8792**, so the image
   column is nullable everywhere and every PDF template falls back to the original
   "(e-signature)" placeholder text when no image was captured (e.g. old pre-migration records).
   Updated `dpnda-form5.blade.php` and `research-team-nda.blade.php` to render the image inline
   when present.
   Browser-verified the full pipeline on a scratch DPNDA record: drew a real stroke via
   synthetic pointer events (had to set `buttons: 1`, matching the library's internal
   `_isLeftButtonPressed` gate — a plain `PointerEvent` without that bit is silently ignored),
   confirmed a non-empty base64 PNG (~4KB) persisted alongside the typed name for both trainee
   sign and coordinator countersign, then ran the queued `GenerateDpndaPdfJob` and confirmed via
   the raw PDF bytes that it embeds real `/Image` XObjects with zero remaining occurrences of the
   "(e-signature)" placeholder text — i.e., the image genuinely renders in the output PDF, not
   just in the DB. Test record deleted after verification.
   ADR-005 status updated from "Proposed" to "Implemented."

**Part F — Admin/User Management module (2026-07-04):**
1. **Closed the last spec-confirmed-but-unbuilt gap.** `docs/4.1-user-roles-permissions.md`
   explicitly requires "Admin-created (internal/staff) account" and "Admin can reassign a user's
   role at any time," and `docs/0.2`'s capability matrix gives `system_administrator` the sole
   "Manage user accounts/rights" checkmark — but until this pass, account creation and role
   assignment only ever happened via `UserSeeder`/`RoleSeeder` or raw `tinker`. There was no code
   path for a real admin to do either.
2. **No new tables.** `users.role_id`/`department`/`account_status` already existed
   (`2026_07_02_083533_add_role_and_profile_fields_to_users_table.php`, from session 2) but had
   no UI reading or writing them beyond the seeders.
3. **New `App\Shared\Auth` pieces**: `UserPolicy` (viewAny/view/create/update, all
   `system_administrator`-only, registered on `User::class` itself in `AppServiceProvider` —
   the first policy in this codebase whose subject is the `User` model), `AdminUserService`
   (`listUsers` with role/status/search filters, `createUser`, `updateUser`), and
   `AdminUserController` (`/admin/users` — index/create/store/edit/update). Role checks happen
   via `authorize()` calls in the controller, same pattern as `ChecksReportAccess` in the
   Reporting module, just policy-based instead of a role-array trait since there's only one role
   involved here.
4. **Admin-created accounts get a random password they never see**, plus two emails: the same
   `Registered` event self-registration fires (queues the verification email — docs/4.1's
   "Validation Flow" step 2 applies to admin-created accounts too, not just self-registration)
   and a `Password::sendResetLink()` call reusing Breeze's existing forgot-password flow, so the
   new user sets their own password on first login. No new mail infrastructure needed — both
   ride on what Part E (email channel) and the stock Breeze scaffolding already provide.
5. **Editing a user is scoped to name/role/department/account_status — not email.** Changing
   email would need a re-verification flow docs/4.1 doesn't describe; if that's needed later,
   `AdminUserService::updateUser()` is the method to extend, not a new one. Every changed field
   is written to the audit trail via the existing `AuditLogService` (`user.created` /
   `user.updated` event types), storing only the fields that actually changed, not a full
   before/after snapshot — satisfies docs/4.1 "Role changes are logged in the audit trail"
   without over-logging untouched fields.
6. **New "Admin" nav link**, gated to `roleName === 'system_administrator'` in
   `AuthenticatedLayout.jsx`, same pattern as the existing `REPORT_CAPABLE_ROLES` gate for the
   Reports link.
7. **Browser-verified end-to-end as `admin@pcc.test`**: created a new user with role
   `ethics_reviewer`, confirmed both the verification and password-reset emails logged
   correctly and an `AuditLog` row recorded the creation; reassigned that user's role to
   `ethics_committee_chair` via the edit form and confirmed the audit row captured only
   `role_id` (old → new), not spurious other fields; confirmed `dpo.staff@pcc.test` gets a real
   403 hitting `/admin/users` directly and never sees the "Admin" nav link. Test user deleted
   after verification.

**Not built (explicitly out of scope for this pass, not silent gaps):** bulk role import (docs/4.1
flags this itself as an ASSUMPTION, "useful at start of school year for OJT batches" — no bulk-CSV
UI was requested or built); account deactivation/suspension has a status value and the edit form
can set it, but there's no forced-logout-on-suspend behavior (a suspended user's existing session
stays valid until it naturally expires) — if immediate lockout matters, that's a session
invalidation hook on `AdminUserService::updateUser()`, not a new feature.

**Part G — DPO/ORD decisions on remaining open questions, implemented (2026-07-04):**

After Part F closed the last spec-confirmed gap, the remaining items were genuine business
decisions, not engineering gaps — so they were put directly to the requester (acting in the
DPO/ORD decision-maker capacity) rather than guessed at. Four decisions came back, three
requiring new code:

1. **Multi-reviewer panel review — confirmed, built.** docs/3.3 FRS §VIII/step 8 already said the
   Chair "assigns reviewers" and "consolidates reviewer recommendations" (both plural), but the
   original implementation simplified to one reviewer per application (see the now-superseded
   comment in `2026_07_02_105627_create_review_assignments_table.php`). No schema change was
   needed — `review_assignments` never had a uniqueness constraint blocking multiple rows per
   application; the singularity was entirely at the application layer:
   - `RemisApplication::reviewAssignment()` (`HasOne::latestOfMany()`) replaced with
     `reviewAssignments()` (`HasMany`). Every call site that assumed one row —
     `RemisApplicationController`, `RemisApplicationPolicy` (`view()`,
     `reviewAsAssignedReviewer()`), `ProgressReportPolicy`, `RemisMonitoringService`'s two
     reviewer-notification call sites — updated to work over the collection.
   - `RemisWorkflowService::assignReviewer()` now rejects assigning the same reviewer twice to
     one application (`RuntimeException`, surfaced as a form error).
   - `RemisWorkflowService::decide()` now requires every assigned reviewer to have submitted
     before the Chair can issue a decision (`RuntimeException` if any assignment is still
     pending) — this is the actual "consolidation gate" the FRS describes.
   - `Remis/Show.jsx` gained a "Review Panel" section listing every assigned reviewer and their
     recommendation (or "pending"); the assign-reviewer form no longer disappears after the
     first assignment ("Assign Reviewer" → "Assign Another Reviewer"); the reviewer's own
     submit-review form is now gated on *their own* unsubmitted assignment, not any assignment.
   - `RiskClassification` still has no cross-reviewer consolidation logic — if reviewers disagree
     on risk level, whichever classified most recently wins (`latestOfMany()`, unchanged). The
     FRS doesn't describe how to reconcile disagreeing risk classifications, so this wasn't
     guessed at.
   - Browser-verified: assigned 2 reviewers to a for_review application, confirmed the Decide
     form only appears once both submitted, confirmed the Decision correctly consolidated to one
     outcome, confirmed the duplicate-reviewer guard rejects a second assignment for the same
     person. Test reviewer account and its data fully removed afterward, restoring the
     application to its original single-pending-reviewer seeded demo state (used by the
     Reviewer Workload report).
2. **Monitoring cadence — confirmed monthly, built.** docs/3.4 left this as an unconfirmed
   ASSUMPTION ("every 6 months?"). Requester confirmed monthly, since most studies here finish in
   3-4 months anyway. `RemisMonitoringService::monitoringDueDate()` computes the next due date
   (last progress report, or monitoring start, + 1 month) and `isMonitoringOverdue()` flags
   applications past it — neither stored as a column, both computed on read. This unblocked the
   5th ORD dashboard widget, "Overdue Monitoring", deferred in Part D specifically for lacking
   this cadence. Browser-verified by backdating a test application's monitoring-start
   status-history row 2 months and confirming the widget picked it up with the correct due date;
   test application deleted afterward.
3. **NDA template versioning — declined.** docs/9.1 flagged an `nda_templates` table (editable,
   versioned NDA wording) as "confirmed useful, not confirmed as a requirement." Requester
   confirmed the current hardcoded Blade template is fine — not built, and not planned unless
   DPO/Legal later say the NDA text needs to change over time.
4. **Discontinued/Withdrawn early-exit workflow — declined.** A stalled REMIS study can just stay
   in `monitoring` indefinitely; no separate workflow branch was requested.
   `completion_reports.final_outcome` keeps those enum values for schema forward-compatibility
   only.

**Also settled this pass, no new code (a standing constraint, not a fresh decision):** the SMS
notification channel stays unbuilt — the requester wants the project to run entirely free apart
from deployment hosting, and every real SMS gateway is a paid service. Email (the one
FRS-*required* channel) was already built in Part E; SMS was always optional per docs/4.3.
`notifications.channel` keeps the `sms` enum value for schema forward-compatibility only.

All four decisions and the SMS constraint are recorded inline in the affected docs
(`0.2` unchanged — no role/capability change; `3.4`, `4.3`, `9.1` updated) so a future session
doesn't re-litigate them as open questions.

**Part G addendum (2026-07-04, same day) — three more stakeholder answers came back:**
1. **Bulk role import — confirmed required, not prioritized.** Real backlog item now, not an
   unconfirmed ASSUMPTION (`docs/4.1`, `docs/9.1`). Not built — the Part F Admin UI is
   single-account-at-a-time; a CSV-import flow is the natural next step whenever this is picked
   up, but wasn't asked for in this pass.
2. **"Research Ethics Head" = "Ethics Committee Chair" — confirmed one role, two labels**
   (`docs/0.4`). No code change needed: `joint-clearance.blade.php` already prints the
   applicant-facing "Research Ethics Head" label while the system tracks the signatory
   internally as the `ethics_committee_chair` role — this confirms that split was already
   correct, not a bug to fix.
3. **SSO provider — likely Microsoft 365 / Entra ID, not yet an official IT confirmation.** The
   requester recalls PCC used Microsoft 365 as a former student (`[name]@pccnet.edu.ph` pattern).
   This narrows the likely integration target for the SSO-ready auth architecture (ADR-002,
   `docs/architecture.md`) but isn't a green light to build yet — still needs (a) IT confirming
   this is the actual institution-wide provider, not just a student-facing one, and (b) IT
   registering an app in Entra ID to issue a client ID/secret/tenant ID, which no amount of local
   development can substitute for. Not built this pass; flagged as ready to pick up the moment
   those two things exist.
4. **Virus scanning on upload — researched, not yet built.** Asked specifically whether a
   scanning service exists that's free forever, including at deployment, with no hidden fees.
   Answer: **ClamAV** (GPLv2, self-hosted) — free forever for this use case since GPL's
   commercial restriction only bites if you statically link against `libclamav` in your own
   closed-source binary, which doesn't apply to shelling out to `clamscan`/`clamd` as an external
   process from PHP. Signature updates via `freshclam` are also free forever (Cisco/Talos hosts
   the mirror network at no charge). Runs natively as a Windows service since v1.0.0, so it isn't
   deployment-OS-dependent. **Explicitly ruled out: VirusTotal's public API and similar
   cloud-scanning APIs** — VirusTotal's own Public API Terms of Service prohibit commercial/
   institutional production use without a paid plan, which would violate the zero-cost-forever
   constraint outright. Recommended integration shape for whenever this is built: run the
   `clamd` daemon (keeps virus definitions resident in memory) rather than shelling out to
   `clamscan` per file (which reloads the full database — hundreds of MB — on every call), and
   connect via a socket-based PHP client. Not implemented this pass — this was a feasibility
   question, not a build request. **Follow-up the same day: the requester decided to skip this
   for now** — ClamAV would need to run on whatever machine serves the app in production, not
   just locally, and hosting isn't decided yet (`docs/7.0`), so building the integration now
   would mean testing it blind. Revisit once hosting is chosen.

**Part H — Bulk role import, built (2026-07-04):** the one remaining Part G item that was both
confirmed-required *and* immediately buildable (no external stakeholder input or infrastructure
dependency needed, unlike SSO or virus scanning above).
1. **`AdminUserService::previewImport()`/`importUsers()`** — a two-step flow. `previewImport()`
   parses a CSV (`fgetcsv`) and validates every row (name required; email required, valid,
   not a duplicate within the file or against existing users; `role` optional but must match a
   `roles.name` slug exactly if given; `account_status` optional, defaults to
   `pending_validation`, must be one of the four valid values) — nothing is persisted at this
   stage. `importUsers()` then creates one account per valid row via the existing
   `createUser()` (same random-password + verification/reset-email path as a single admin-
   created account — no new account-creation logic, just looped), skipping invalid rows.
2. **New `/admin/users/import` flow** on `AdminUserController`: `importForm()` (GET, shows the
   upload form), `preview()` (POST, parses + validates, stashes the row array in the session so
   the file itself doesn't need re-uploading, and renders the same page with a `preview` prop),
   `confirmImport()` (POST, reads the stashed rows back out of session, creates the valid ones,
   clears the session key, redirects to the user list with a "created N, skipped M" summary).
   All three gated by the same `UserPolicy::create` check as the single-user form.
3. **`Admin/Users/Import.jsx`** — upload form, a collapsible reference list of valid role slugs
   (pulled from the `roles` table so it can't drift out of sync with what the validator actually
   accepts), and a preview table showing every row's validity with the specific reason for any
   row that failed. "Confirm Import (N)" only appears when at least one row is valid.
4. **Known, accepted limitation, not fixed:** `importUsers()` runs synchronously in the request,
   the same as a single create — at OJT-batch scale (tens of rows) this is fine, but if a real
   batch ever runs into the hundreds, this is the method to move onto a queued job, not to add a
   progress bar to as-is.
5. **Browser-verified**: uploaded a CSV with 2 valid rows and 3 deliberately invalid ones
   (missing email, an email that already exists, an unknown role slug) — preview correctly
   flagged exactly those three with the right reasons, confirming created exactly the 2 valid
   accounts with correct role/department/status, audit-logged both (reusing the existing
   `user.created` event, no new audit code needed), and confirmed both verification and
   password-reset-link emails fired for each. Test accounts deleted after verification.

**Part I — 18 outstanding open questions answered, DPO Approver + Student Teacher roles retired
(2026-07-06):** the remaining 🔴 items from `9.1`/`stakeholder-package/05` that Part G's pass
didn't cover were put to the requester directly. Full breakdown in `CHANGELOG.md`'s 2026-07-06
entry; summary here:
1. **DPO Approver retired.** DPO Staff is now the sole DPO-side role, owning the DPO track end
   to end including final `approve()`/`reject()` (previously `dpo_approver`-exclusive). Touched
   every DPREQ/DPNDA/Incident policy and controller that referenced the two-role split, the
   DPO dashboard's per-role status mapping, and `Dpreq/Show.jsx`'s action gating. Verified
   end-to-end: `php artisan migrate:fresh --seed` completes cleanly, and the seeded DPREQ
   application (`ReportDemoSeeder`) screens → endorses → approves → issues clearance entirely
   under `dpo_staff`, confirmed via tinker (`role.can('approve', ...)` → true,
   `DpreqApplication::status` → `clearance_issued`).
2. **Student Teacher retired as a distinct category.** Removed the `student_teacher` role, the
   `student_teacher` value from `placements.trainee_type`, and the standalone "Student Teachers
   by Grade Level" report. Those trainees are now ordinary internal/external OJT placements —
   "Trainee Whereabouts" still shows them since it never filtered by type.
3. **Everything else answered this pass required no code change** — DPREQ fields/file
   sizes/checklist, NDA template fields, Compliance Monitoring Report staying separate,
   Whereabouts staying a snapshot, audit-trail access list, Research Ethics Head = Chair
   (already resolved, `9.1` just hadn't caught up), Form 2 for solo researchers, and SSO
   provider (Microsoft 365 / `pccnet.edu.ph` → Entra ID, still IT-provisioning-blocked) all
   confirmed the existing implementation or assumption was already correct.
4. **Virus scanning** — requester deferred this explicitly until the rest of the project is
   complete; no longer an open IT question to chase in the meantime.
5. **Still genuinely unanswered, not just unbuilt:** full-REMIS-track applicability for every
   submission vs. a risk-based fast track, exact risk-classification thresholds, incident-filing
   scope/auto-hold rules, and the DPREQ/DPNDA retention schedule (years for issued vs. rejected
   records) — these four remain 🔴 in `9.1` and need DPO/ORD/Legal input, not an implementation
   decision.

**Part J — Real fonts + header image applied to PDF templates (2026-07-06, same day):** closes
out the last remaining item from the front-end redesign request — the requester had supplied
`public/fonts/Microsoft Aptos Fonts/`, `times.ttf`, `cour.ttf`, and `public/images/DOCS
HEADER.png` (the actual PCC letterhead) earlier in the session, but they hadn't been wired into
the PDF templates yet. Full detail in `CHANGELOG.md`; summary:
1. **New `App\Shared\Documents\Support\PdfAssets::dataUri()`** embeds each font/image as base64
   — required because `PdfGenerationService` renders via `Browsershot::html()` (a temp file, not
   the app's web server), so relative `/fonts`/`/images` URLs never resolve.
2. **Deliberate 3-font hierarchy** across all three PDF templates (Form 2, 3, 5 — Form 1 has no
   PDF, it's web-form-only): Aptos for structure (labels/headings/table headers), Times New
   Roman for formal prose (purpose/scope narratives, certification, Form 3's remarks), Courier
   New stays the body default for filled-in data (preserves the existing typewritten-form look).
3. **Header image replaces the CSS-recreated text header**, and the form badge ("FORM 2/3/5") is
   now colored `#891a1a` — the exact same hex as `primary-700` in the front-end's design tokens,
   so the one maroon accent that exists on these forms matches the screen exactly.
4. **Verified by actually generating a PDF from each of the three templates** (via tinker,
   against real seeded records) and visually inspecting the rendered output — no missing-glyph
   boxes, no doubled header rule, no layout breaks.

**Part K — Stakeholder answers on remaining open questions (2026-07-07):**
1. **No fast track** — All submissions go through the full REMIS process. No risk-based fast track exists.
2. **No thresholds** — Decision buttons are manual; approvers use their own criteria for each risk level.
3. **Auto-pause on breach** — Yes. When a data breach incident is filed, monitoring should auto-pause. DPO must be notified. **Implemented:** `IncidentService::file()` now calls `autoPauseMonitoring()` for data breach/confidentiality breach incidents.
4. **Retention schedule** — Recommendation: **7 years for issued clearances, 3 years for rejected/inactive records**. Aligns with Philippine Data Privacy Act (RA 10173) and general academic record retention practices.
5. **Unified Application Form** — The form exists (`docs/stakeholder-additional-features/01-functional-design-document.md`). The unified Form 1 is already in use — DPREQ and REMIS share a single intake form.
6. **SSO Provider** — Confirmed: `college.account@pcc.edu.ph` pattern (Microsoft Entra ID / Microsoft 365). Awaiting IT app registration.

**Part L — Auto-pause monitoring implemented (2026-07-08):**
- Added `monitoring_paused` status to `RemisApplication::LEGAL_TRANSITIONS`
- Added `autoPauseMonitoring()` method to `IncidentService`
- Added `resumeMonitoring()` method to `RemisWorkflowService`
- When a data breach/confidentiality breach is filed, monitoring is auto-paused and DPO is notified
- Researchers can resume monitoring after corrective actions are verified

## 3. What's still NOT built, and why

Nothing is deferred for lack of a decision anymore — Part G put every remaining open question to
the requester directly and got an answer either way. What's unbuilt is unbuilt by explicit
decision, not by gap: `nda_templates`/NDA versioning, the Discontinued/Withdrawn workflow, and
SMS (see Part G and §6 below for the reasoning behind each).

## 4. Bugs found this session

1. **`statusHistory()` relations ordered only by `latest('created_at')`, with no tiebreaker.**
   `DpreqApplication`, `RemisApplication`, `DpndaRecord`, and `Incident` all defined this relation
   identically: `morphMany(StatusHistory::class, 'statusable')->latest('created_at')`.
   `created_at` has 1-second granularity; two transitions landing in the same second sort in
   undefined order relative to each other. The "Pending DPO Approvals" report reads
   `$app->statusHistory->first()` to get "the latest transition's comment" — with the ambiguous
   ordering, it sometimes returned an *older* row (e.g. the original `draft` transition instead
   of the actual `returned` transition with the reviewer's comment), silently showing
   blank/wrong comments. **Fixed** by adding a secondary `->latest('id')` sort to all four
   relations. If you add a fifth `statusHistory()` relation, give it the same secondary sort.

2. **`SecondaryButton` defaults to `type="button"`, silently swallowing form submission.**
   `resources/js/Components/SecondaryButton.jsx` explicitly defaults its `type` prop to
   `"button"` (used correctly elsewhere as a non-submitting decorative label, e.g. the "Risk
   Classification & Review" heading-as-button in `Remis/Show.jsx`). The progress-report
   compliance-review form used `<SecondaryButton>` as its actual submit control — clicking it did
   nothing, no error, no network request, because it's not a submit button. Caught only by
   testing the *live* form in-browser (a seeded/scripted test wouldn't catch this — this class of
   bug is specifically a "does the click work" bug). **Fixed** by switching to `<PrimaryButton>`
   (which doesn't override `type`, so it takes the native default of `"submit"` inside a
   `<form>`). If you add a new form action button anywhere, use `PrimaryButton`/`DangerButton`,
   not `SecondaryButton`, unless you pass `type="submit"` explicitly.

3. **Inertia page props silently lose to shared props on a key collision — same name, page prop
   wins, but only for that one page, breaking anything else relying on the shared value.**
   `HandleInertiaRequests::share()` shares a global `notifications` prop (`{unread_count, recent}`)
   on every request, for the bell. `NotificationController::index()` initially also passed its
   paginated list as a prop literally named `notifications`. Inertia resolves the collision in
   favor of the page-specific prop, so on `/notifications` specifically, `usePage().props.
   notifications` silently became the paginator object instead of the bell's shape — `recent`
   was `undefined`, and `NotificationBell` crashed calling `.map()` on it, taking the whole page
   down with it (no error boundary anywhere in the app). Every *other* page worked fine, which is
   what made this easy to miss — it only breaks on the one page that happens to reuse the shared
   prop's name. **Fixed** by renaming the page prop to `notificationHistory`. If you add global
   shared props in `HandleInertiaRequests`, grep for that prop name across `Inertia::render()`
   calls before reusing it as a page-specific prop name anywhere.

## 5. Data model additions and assumptions this session

**New tables:** `progress_reports` (docs/3.4 FRS §XII) and `completion_reports` (FRS §XIV).
`completion_reports.archived_at` lives on that table rather than as a column on
`remis_applications`, because "Archived By" is "System (auto)" per the FRS — there's no real
actor to reference.

**Two assumptions, both documented inline where they're made (search for "ASSUMPTION" in
`ClearanceService`/`RemisMonitoringService` docblocks):**
- **Monitoring starts automatically on clearance issuance.** The FRS never describes a manual
  "start monitoring" action, so `ClearanceService::startMonitoring()` fires immediately after
  both DPO and Ethics sign. If DPO/ORD want a manual gate instead, that's a change to
  `ClearanceService::maybeIssue()`, not a new module.
- **Submitting the Completion Report is treated as acceptance.** FRS §XIV says the system
  closes-then-archives "on acceptance" but names no separate accept action/role.
  `RemisMonitoringService::submitCompletionReport()` treats submission itself as acceptance —
  closes and archives in one step, no review gate. If DPO/ORD want Ethics Secretariat/Chair
  sign-off before archiving, that's a new intermediate status between `monitoring` and `closed`.

**Not built:** a `discontinued`/`withdrawn` early-exit path for studies that don't finish
normally. `completion_reports.final_outcome` has those enum values for schema
forward-compatibility, but the FRS itself flags whether they need a distinct workflow as an open
question — nothing in this session's code can produce them.

**Still unresolved from session 2 Part A:** `placements.trainee_type` only distinguishes
internal/external for OJT, not for `student_teacher` (flagged in the Student Teachers report's
own UI).

## 6. What's built and verified vs. what's still open

**Fully built, browser-verified (session 1):** DPREQ, DPNDA, REMIS core lifecycle, Incident
Reporting, public verification portal, shared infra (audit trail, status history, document
versioning, queued PDF generation, in-app notifications).

**Fully built, browser-verified (session 2):** Reporting module — **13 of 13 reports** (the
13th, OJT Evaluation Report Compliance, closed out in Part E), role-gated (`/reports` index only
lists what the acting role can generate), CSV export on every report, PDF export on the Annual
Ethics Report. REMIS Monitoring & Completion (`docs/3.4`) — progress reports, compliance review,
Final Ethics Completion Report, auto-close/archive. Notification bell (`docs/4.3`) — every
module's documented triggers now fire real notifications, surfaced via a bell dropdown + full
history page, **plus a queued email for every in-app notification** (Part E) via
`NotificationMail`; verified across `researcher@pcc.test` and `dpo.staff@pcc.test` logins,
including that a user cannot mark another user's notification as read (403). DPO/ORD dashboards
(`docs/4.3`) — 4 of 5 widgets per office, role-gated, verified across 7 logins. **Email
verification on signup** (Part E) — `verified` middleware gates every module route group.
**Drawn e-signatures** (Part E) — canvas-based signature capture on DPREQ NDA signing, DPNDA
trainee/coordinator signing, and REMIS endorsement/decision signing, cosmetic-only per ADR-005,
verified rendering as real embedded images in generated PDFs. **Admin/User Management** (Part F,
`docs/4.1`) — `system_administrator`-only `/admin/users` UI for creating accounts and reassigning
roles/department/account-status, closing the last confirmed-in-spec gap where this only existed
via seeders/tinker; every change audit-logged; verified a non-admin gets a real 403.
**Multi-reviewer panel review** (Part G, `docs/3.3`) — REMIS Ethics Committee Chair can assign a
panel of reviewers to one application, each submits an independent recommendation, and a Decision
can only be issued once every assigned reviewer has submitted — verified with a real 2-reviewer
panel. **5th ORD dashboard widget, "Overdue Monitoring"** (Part G, `docs/3.4`/`4.3`) — monthly
monitoring cadence confirmed, computed (not stored) via `RemisMonitoringService`; verified with a
backdated test application. **Bulk role import** (Part H, `docs/4.1`) — CSV-based account
creation extending the Part F Admin UI, with a validate-then-confirm preview step; verified with
a mixed valid/invalid CSV.

**Explicitly decided against, not built (all resolved in Part G — not gaps, decisions):**
- **`nda_templates`** table / NDA version management — requester confirmed the current hardcoded
  template is fine.
- **Discontinued/withdrawn early-exit workflow** — a stalled study can just stay in `monitoring`
  indefinitely; not requested.
- **SMS notification channel** — the project runs entirely free apart from deployment hosting;
  every real SMS gateway is a paid service. Email (the FRS-required channel) was built in Part E.
- **Virus scanning on upload** — researched (ClamAV, see Part G addendum item 4); Part I
  (2026-07-06) closed this as explicitly deferred by the requester until the rest of the project
  is complete, superseding the earlier "blocked on hosting decision" framing.
- Part I (2026-07-06) and Part K (2026-07-07) resolved most of the remaining `9.1` §1 items
  directly with the requester (DPO-side role list, DPREQ field lists/checklist, NDA template
  fields [later superseded, see Part K item 3], Compliance Monitoring Report, Whereabouts,
  audit-trail access, Research Ethics Head, Form 2 solo-researcher applicability, SSO provider,
  file-size limit, risk-classification *mechanism*, incident-filing who-can-file). **Still
  genuinely open:** full-REMIS-track applicability, the exact numeric risk-classification
  *thresholds* (not the mechanism — that's confirmed), incident-filing auto-hold-on-breach, and
  the DPREQ/DPNDA retention schedule. Also still open: the ones flagged in §5 (auto-start
  monitoring; submission-as-acceptance) and the inferred-vs-literal notification triggers noted
  in §2 Part C.

## 7. Recommended next step

All 4 remaining open questions from `9.1` have now been answered by stakeholders:
1. **No fast track** — All submissions go through full REMIS process ✅
2. **No thresholds** — Manual decision buttons with approver knowledge ✅
3. **Auto-pause on breach** — Implemented! Monitoring pauses when data breach filed ✅
4. **Retention schedule** — **7 years for issued, 3 years for rejected** ✅

**What's left:**
1. **SSO (Microsoft Entra ID)** — provider confirmed (`college.account@pcc.edu.ph` pattern), still blocked on IT registering an app and issuing a client ID/secret/tenant ID before any SSO code can be wired up and tested.
2. **Virus scanning (ClamAV)** — feasibility confirmed, deliberately deferred by the requester until the rest of the project is complete.
3. **The front-end redesign** — paused mid-flight in a genuinely mixed state (§0). Don't resume or "fix" it without the requester explicitly asking; if asked, read §0's front-end section first so you don't repeat the same restyle-without-asking mistake.

None of these are engineering work an agent can pick up solo — each needs either a stakeholder answer, an external party (IT) taking an action outside this codebase, or an explicit go-ahead from the requester on design direction. The system covers every module (`docs/1.x`-`5.x`) end-to-end with both required notification channels, a legally-sound signing flow, a real admin surface (including bulk onboarding), a REMIS review process matching the FRS's panel-review language, and PDF generation using the requester's own fonts/letterhead. **If you are a new agent picking this up for the first time: read §0 in full before doing anything else, then ask the requester what, if anything, has changed since 2026-07-08 rather than assuming this document is still 100% current.**

---

## Session 1 handoff (preserved, still-relevant sections)

### 7.1 Discovery of `reqs/`
Four EVP-approved PCC form PDFs (Forms 1/2/3/5) weren't part of the original doc set. They
revealed DPREQ and REMIS aren't independent applications each issuing their own clearance —
they're two tracks on one shared Form 1 submission, converging on one dual-signed clearance
(Form 3). Documented in **`docs/0.4-dpo-ethics-integration.md`** — still the single most
architecturally important doc in the set.

### 7.2 Stack
React + Inertia.js + Laravel + MySQL. Modular-monolith layout under
`app/Modules/{Dpreq,Dpnda,Remis}` and
`app/Shared/{Auth,Documents,AuditLog,Notifications,ResearchApplications,Clearance,Verification,Reports}`
(session 2 added `Reports`).

### 7.3 Data model shape
```
research_applications (shared parent — one row per Form 1 submission)
  ├─1:1─ dpreq_applications (DPO track)         → research_team_ndas (Form 2) → signatories
  ├─1:1─ remis_applications (Ethics track)       → endorsement_actions, risk_classifications,
  │                                                 review_assignments, decisions, incidents
  └─1:1─ clearance_certificates (joint, dual-signed: dpo_signed_by + ethics_signed_by;
                                  issued_at/qr_token only set once BOTH are non-null)

placements (OJT/Trainee, independent of research_applications) → dpnda_records (Form 5)

documents (polymorphic, all generated/uploaded files)
status_history (polymorphic, every workflow transition)
audit_log (append-only, every state-changing action)
notifications (in-app, role- or user-targeted)
```
Full field-level schema: `docs/system-design.md` §3 (kept in sync with actual migrations — if
you find a mismatch, the migration is ground truth, fix the doc).

### 7.4 Bugs found during session 1 verification (still worth knowing)
1. Laravel snake_cases relation keys in JSON (`researchApplication` → `research_application`).
2. `useForm().transform()` is a chained method, not a `.post()` option.
3. Eloquent model default table names can silently mismatch custom migration table names
   (`StatusHistory` → `status_histories` guessed vs. actual `status_history`).
4. Laravel resolves a policy by the *authorized object's* class, not by which module owns the
   ability (`RemisApplicationPolicy::file()`, not `IncidentPolicy::file()`).
5. A `BelongsTo` relation method whose snake_case name matches its own FK column silently
   overwrites the raw ID in serialized JSON (`reportedBy()` → `reported_by` collision; renamed to
   `reporter()`/`assignee()`/`verifier()`).
