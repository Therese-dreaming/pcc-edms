# Documentation Changelog

Tracks substantive edits made to the `docs/` specification files after the initial draft — what changed, why, and against what source. "ASSUMPTION" items that are resolved here are marked accordingly in the affected file.

---

## 2026-08-31 — Full cross-audit: loophole fixes, retention correction, stale-doc sweep

Requester-ordered audit (index → deep-read `docs/` + `reqs/` → fix logic loopholes → done/missing
checklist). Baseline at start: 138 tests passing, clean tree on `main`; at end: **148 passing**
(10 new), `composer audit` clean, `npm run build` clean. Seven incremental commits on `main`
(**not pushed**, per standing instruction).

**Logic loopholes fixed (code):**
1. `RemisWorkflowService::decide()` — `Decision::create()` committed before the locked
   transition; a failed/raced decision left an orphaned `decisions` row. Now one locked
   transaction. Same treatment for `screen()` (orphaned `screening_checklists`).
2. `assignReviewer()` had no status gate — the Chair could assign reviewers at any lifecycle
   stage (including after a decision). Now requires `for_review`. Same gate added to
   `classifyRiskAndRecommend()` (+ its mutations wrapped in a transaction).
3. `ClearanceService::signEthicsTrack()` auto-started monthly monitoring even for **exempted**
   studies — an exemption means "exempt from full ethics clearance," not a progress-report
   obligation. Exempted studies now rest at `clearance_issued`.
4. **`monitoring_paused` was a dead-end status**: Part L (2026-07-08) shipped auto-pause with a
   `resumeMonitoring()` service method but no route, controller action, policy, or UI. Added
   applicant-only `remis.resume-monitoring` route + a pause banner with Resume action on
   `Remis/Show.jsx` (the Monitoring card now renders for `monitoring_paused` too; status label
   added).
5. `RetentionService::eligibleForPurge()` swept **archived-but-issued REMIS studies into the
   3-year rejected bucket** (they are issued records on the 7-year schedule, anchored on
   `remis_issued_at`), and never swept DPNDA records at all despite `9.1` ("DPREQ/DPNDA do not
   differ"): completed NDAs → issued window, declined → rejected.
6. `RevisionService::resolve()`/`waive()` accepted double-closes; now guarded like `respond()`.
7. Dead code: unused `ClearanceService` injection in `DpreqWorkflowService` (issuance moved to
   `ResearchTeamNdaService`, concern 7); `.worktrees/signup-finalized` gitlink accidentally
   committed on 2026-08-31 removed from the index and `.gitignore`d.
8. `composer audit`: 12 advisories (1 high Guzzle host-bypass; 4 high commonmark DoS) patched by
   minor upgrades — audit now clean.

**New tests:** `WorkflowGateTest` (gates + revision guard), `MonitoringResumeTest` (resume route
+ authorization), `RetentionBucketTest` (bucket classification), 2 exemption-monitoring cases in
`EthicsExemptionTest`.

**Doc corrections (stale-text sweep, all dated in place):** superseded joint dual-signed
clearance text annotated in `1.1` §Output, `3.1` §Output, `3.3` banner, `2.1` Form-2 row,
`9.1` §2a/§2b, `system-design.md` top banner; retired DPREQ screen/endorse capability rows
annotated (`0.2`, `WORKFLOWS.md` quick reference); `5.3` student-teachers report marked retired
and Pending-Approvals `Endorsed` filter fixed; `README.md` role count 16→14; `DEPLOYMENT_CHECKLIST.md`
pgsql block corrected to MySQL 8.0+ (ADR-003); `4.1` Validation Flow self-registration step
corrected; `0.4` solo-researcher flag closed; `knowledge-graph.md` and
`stakeholder-package/05` marked stale; `9.1` XAMPP php.ini path corrected (this machine runs
Laragon); `9.1 §2b` updated — certificate layouts arrived (`reqs/REMIS-certs/`, 2026-07-31),
Exempted outcome and unified-form intake fields already built (2026-07-28 migrations).

**Process gap found (not reconstructible retroactively):** this changelog has NO entries for
2026-07-29 through 2026-08-30 despite commits landing in that window (14 workflow-loophole
fixes, Form 2 obligations gate, SweetAlert layer, DPNDA schedules/calendar, EVP signature
auto-attach, unified-form intake fields, exemption flow). `docs/HANDOFF.md`'s top section stops
at 2026-07-25 for the same reason. Going forward: docs update in the same pass as the code.

---

## 2026-07-25 — DPO workflow collapse + reuse of the revision engine (Phase 2)

**Collapsed the DPO/DPREQ workflow to Review → Approve (item 5).** The old four-action chain
(`submitted → screening → under_review → endorsed → approved`), all performed by the single
`dpo_staff` role, is now two actions:

```
draft → submitted → under_review → approved → clearance_issued
                         ↓
                  returned → submitted        (and → rejected)
```

`screening` and `endorsed` removed from `DpreqApplication::LEGAL_TRANSITIONS` and the status enum;
`startScreening`/`passScreeningToReview`/`endorse` retired in favour of `startReview`; the matching
controller actions, routes (`start-review` replaces `start-screening`; `pass-screening`/`endorse`
gone), the `endorse` policy ability, `DpoDashboardService`/`DpoReportService` status lists,
`Dpreq/Show.jsx` + `Dpreq/Index.jsx`, `ReportDemoSeeder`, and `docs/1.2` all moved in one pass.

**DPO can now request additional requirements (item 7)** by reusing the Phase 1 `App\Shared\Revisions`
engine unchanged: `dpreq` is a valid `track` for `RevisionController`; `DpreqWorkflowService::approve()`
is gated on `hasOutstandingMandatory()` (alongside the existing NDA gate); `Dpreq/Show.jsx` renders
the shared `RevisionPanel`. **This is exactly why REMIS was built first** — the mechanism was written
once and reused with zero new revision code.

**Verified:** `DpoWorkflowTest` (3) — the collapsed flow reaches `clearance_issued`; approval is
blocked while a required document request is open and succeeds once resolved; the retired
`start-screening`/`endorse` routes 404. Browser-verified the DPO under-review view (Approve / Return
/ Reject + revision "Send request", no Screening/Endorse) and raising a document request live.

**UX fix found during browser verification:** the DPREQ Approve buttons post via `router.post` (not a
`useForm`), so the server-side guard errors (`errors.nda` — NDA unsigned / outstanding required
items) were **never displayed** — a blocked DPO saw nothing happen. `Dpreq/Show.jsx` now reads the
shared error bag (`usePage().props.errors.nda`) and renders it in the Final Approval panel. (This is
the same "silent router.post failure" class as the SecondaryButton bug in HANDOFF §4.)

---

## 2026-07-25 — Nav access map + OJT onboarding for account-less trainees (Phase 3)

**Hid unusable nav modules (item 2).** `HandleInertiaRequests::share()` now computes a per-role
`can` map (`{dpreq, dpnda, remis, incidents}`) in one server-side place; `WORKSPACE_NAVIGATION`
gates on it, so a trainee no longer sees REMIS nor a researcher DPNDA. Nav hiding is UX — each module
still enforces its own authorization (a hidden module hit directly is still gated).

**OJT onboarding for a transferee with no account (item 3), both paths:**
- **Invite-at-placement** — `StorePlacementRequest` no longer requires `trainee_email` to already
  exist; `DpndaRecordController::store()` creates the trainee account (OJT role from `trainee_type`)
  via `AdminUserService::createApplicant()` and emails a setup link when the email is unknown, reusing
  the existing account otherwise.
- **OJT batch cohorts** — `department_coordinator` may now own cohorts (`CohortPolicy::OWNER_ROLES`);
  the cohort joiner-role allowlist is actor-dependent (`CohortController::applicantRoleSlugs()` —
  researcher roles for advisers, OJT trainee roles for coordinators); "Classes" nav opened to
  coordinators.

**Verified:** `Phase3AccessTest` (4) — the `can` map is scoped per role (researcher/trainee/adviser/
admin); nav hiding isn't the security boundary; an unknown-email placement invites a new OJT account
while an existing email is reused; coordinator/adviser cohort authorization confirmed. **Full suite:
74 passed.**

---

## 2026-07-25 — REMIS FRS compliance (Phase 1)

Closes the FRS modules that were specified but never built, and makes the return/revision cycle real.

**§III.E document uploads (biggest gap).** Form 1 had **zero** file inputs despite the FRS stating
an application "cannot proceed if mandatory documents are missing." Added: mandatory trio (Research
Proposal, Consent Form, Research Instrument), conditional Parent Consent + Assent (required only when
`minors_involved`), optional Permission Letters / Ethics Training Certificate, and repeatable
labelled additional documents (item 6). One definition in
`App\Shared\ResearchApplications\Support\ApplicationDocuments` drives request validation, the frontend
section, and the storage loop; files store through the existing `DocumentService` naming/versioning.
New shared `UploadRules` (FRS §XV formats · 50 MB). Ethics docs attach to the REMIS app, additional
docs to the DPREQ app.

**§III.A/B fields.** New `research_category`, `contact_number`; **co-researchers are now identities**
(name + email) that become Research-Team-NDA signatories with emailed signing links via the existing
`ResearchTeamNdaService::addMember()`.

**§VI screening checklist + deficiency notice.** New `screening_checklists` (the five FRS checkboxes)
persisted by `RemisWorkflowService::screen()`; a deficient outcome auto-generates a Deficiency Notice
PDF (`GenerateDeficiencyNoticeJob` + blade) stored against the application.

**§VIII seven review criteria.** New `review_criteria_assessments` keyed to each review assignment;
the reviewer records met/concerns/not-met per criterion alongside their recommendation.

**§IX Revision Management — the shared back-and-forth engine.** New `App\Shared\Revisions` module
(`RevisionRequest` / `RevisionResponse`, `RevisionService`, shared `RevisionController` + routes,
`RevisionPanel.jsx`), polymorphic across both tracks so DPO reuses it verbatim (Phase 2). Staff raise
comment/document requests (mandatory or optional); the applicant responds with text and/or a revised
document; `resubmitFromRevision()` is gated on `hasOutstandingMandatory()`.

**Additive amendments (confirmed edit policy).** New `application_amendments` + `AmendmentService`:
the applicant may edit whitelisted study fields **only while for_revision**, each change recorded as
old → new + reason — never a silent overwrite. `RemisApplication::AMENDABLE_FIELDS` bounds what's
editable.

**Verified:** `Form1DocumentsTest` (5), `RevisionManagementTest` (5), `ScreeningAndReviewTest` (4) —
mandatory-document gate, conditional minors docs, co-researcher NDA invitations, the raise → block →
respond → resolve → resubmit cycle, tracked amendments, screening checklist + real deficiency-notice
PDF, and all seven criteria persisted. **Full suite: 67 passed.**

**Completed 2026-07-25 (were briefly deferred):**
- **§XV `documents.status`** — a derived `status` accessor on `Document` (`current` / `superseded` /
  `archived`) from the existing version/archival flags, appended to serialization so it can't drift.
- **§XVII administrator summary dashboard** — new `AdminSummaryService` (total applications, pending
  reviews, approved, disapproved, average processing days) surfaced as stat tiles on the admin
  dashboard. `FrsMetadataTest` (3) covers both; the seven-criteria reviewer form and Form 1 sections
  were additionally browser-verified live. **Full suite: 77 passed.**

---

## 2026-07-25 — Retire "Create Applicant" + route applications to the owning adviser

**Why:** with cohorts in place the standalone one-applicant-at-a-time `/adviser/applicants/create`
form was redundant (the cohort manual-add already covers "add one student"; admins keep
`/admin/users`). Investigating it surfaced two pre-existing defects the cohort work now makes
fixable.

**Removed:** `AdviserUserController`, `Adviser/CreateApplicant.jsx`, the two `applicants.*` routes,
the "Create Applicant" nav entry, and `UserPolicy::createApplicant` (its only caller). Adviser-side
account creation is now gated solely by `CohortPolicy`. `AdminUserService::createApplicant()` stays —
it is the single account-creation funnel that cohorts call.

**Defect 1 — `remis_applications.adviser_id` was never written.** It has a `$fillable` entry, an
`adviser()` relation, and a controller filter reading it, yet nothing populated it — so every adviser
saw *every* application awaiting adviser endorsement. Fixed: new
`CohortService::adviserFor(User)` resolves the adviser of an applicant's most recent joined cohort;
`ResearchApplicationService::submitForm1()` sets `adviser_id` from it (null for cohort-less
applicants). The endorser visibility scope in `RemisApplicationController::index()` is now
`adviser_id = me OR adviser_id IS NULL` (the unassigned pool stays actionable), and the adviser
endorsement step gained the previously-missing `current_endorsement_step = 'adviser'` filter.

**Defect 2 — `notifyRole('adviser', …)` broadcast to every adviser** on every submission (20 advisers
= 20 notifications + 20 queued emails). New `RemisWorkflowService::notifyAdviser()` targets the one
owning adviser when `adviser_id` is set, falling back to the role broadcast only for cohort-less
applications. Program-head/dean steps stay broadcasts (no per-application owner column).

**New — endorser dashboard.** Advisers, program heads and deans previously got the bare fallback
message despite owning the first three endorsement steps. New
`App\Shared\Dashboard\Services\EndorserDashboardService` (widget contract identical to
`OrdDashboardService`): Awaiting My Endorsement (step- and adviser-scoped), For Revision, Recently
Endorsed (30d), and My Classes (advisers only). Wired through `DashboardController` +
`Dashboard.jsx`.

**New — cohort editing.** A cohort could only be opened/closed or have its code regenerated, not
edited. Added `CohortService::update()` (audited), `CohortController::edit()/update()`, routes,
`Adviser/Cohorts/Edit.jsx`, and Edit links from the index/show pages. Expiry validation drops
`after:today` so a lapsed date can be corrected or cleared.

**Also:** `docs/9.1` retention-schedule item marked resolved (implemented 2026-07-25, see
`config/retention.php`).

**Verified:** `tests/Feature/AdviserRoutingTest.php` (8 cases) — adviser_id set from cohort / null
without one; notification fan-out (owning adviser only, bystander zero; cohort-less still
broadcasts); dashboard scoped per adviser; cohort-less application still visible; `/adviser/applicants/create`
→ 404; cohort update persists. **Full suite: 53 passed.**

---

## 2026-07-25 — Cohort-based account provisioning (class join codes)

**Why:** Batch C replaced self-registration with a one-student-at-a-time adviser form. The requester
pointed out that an adviser onboarding 40–50 students would fill that form 50 times, hand-typing
every name and email — and that the data entry sat with the wrong person, since each student already
knows their own details.

**The inversion.** An adviser now creates a **cohort** (class/section) once and shares a single join
code, link or QR. Students enrol themselves and land on the adviser's roster with the correct role
already assigned. Confirmed with the requester: join code as the primary path, adviser manual-add as
a fallback *within* the cohort; guards = expiry + headcount cap + institutional email domain;
researcher applicants only for now.

**This is not a return to open registration.** The join code is adviser-issued and expiring,
cappable, domain-restrictable, and revocable (regenerating invalidates every shared copy instantly);
email verification still applies before an account can do anything.

**New (`app/Shared/Onboarding/`)**
- Migrations: `cohorts` (owner, class metadata mirroring `research_applications`, joiner `role_id`,
  `join_code`, `expires_at`, `max_members`, `allowed_email_domains`, `is_open`) and `cohort_members`
  (roster; nullable `user_id`, `status`, single-use `invitation_token` + expiry). One roster table
  serves both entry paths — same shape as `research_team_nda_signatories`.
- `CohortService` — `create`/`regenerateCode`/`setOpen`, `joinByCode` (enforces every guard),
  `inviteMember`/`inviteMembers`/`resendInvitation`/`acceptInvitation`/`removeMember`. Join codes are
  10 chars from an alphabet with no `I L O 0 1`, so a code read off a projector can't be mis-typed.
- `CohortPolicy` (adviser owns theirs, admin sees all), queued `CohortInvitationMail`, adviser
  `CohortController`, public `JoinController`, `routes/join.php` (guest + `throttle:20,1`).
- Pages: `Adviser/Cohorts/{Index,Create,Show}.jsx`, public `Join/{Cohort,Invitation}.jsx` (each with
  a server-resolved state machine so every rejection is explained, not a dead end). "Classes" nav
  entry gated to adviser/admin.

**Reused rather than reimplemented:** account creation still funnels through
`AdminUserService::createApplicant()`, extended with an optional `$password` (a student who chooses
their own during enrolment skips the password-setup email) and an optional `$auditEvent` so
provenance stays accurate (`user.self_enrolled_via_cohort` vs
`user.accepted_cohort_invitation` vs the original adviser-typed event). The shareable QR reuses
`QrCode::svgDataUri()` built for certificates; token semantics follow `ResearchTeamNdaService`.

**Also fixed:** `CONTROL_NAVIGATION` in `AuthenticatedLayout.jsx` was indexed positionally
(`CONTROL_NAVIGATION[0..3]`), so inserting the "Classes" entry silently re-pointed the adviser's link
at the wrong item. Converted to named keys to kill that bug class.

**Notes on deliberate choices:** removing a student from a class never deletes an account that may
already own submissions (deactivation stays an admin action). Accepting an invitation nulls the
token, so an already-used link reports "not valid" rather than retaining a live credential — the page
copy covers that reading and points to sign-in. Joiners are `self_registered = false`: provenance is
recorded by the `cohort_members` row plus an audit entry, which is more informative than the boolean,
and it keeps `/select-role` reserved for the retired open-registration case.

**Verified:** `tests/Feature/CohortJoinTest.php` — 14 cases covering the happy path, role/department/
student-number propagation, no `/select-role` redirect, and the full rejection matrix (unknown code,
closed, expired, full, wrong domain, duplicate email) each asserting **no user is created**; plus
invitation accept → single-use → expiry, removal keeping the account, cohort authorization, the Show
page delivering a real SVG QR, and a mixed-format paste (comma / tab / reversed columns / junk line)
inviting exactly the valid rows. **Full suite: 45 passed** (was 31). Frontend build clean; guards
also exercised manually through the service.

---

## 2026-07-25 — Follow-ups: real optimistic locking, certificate QR codes, retention policy

Three gaps that remained after Batches A–E, all confirmed with the requester before starting.

### 1. Concurrent-edit protection was entirely non-functional — now implemented

**The defect.** Phase 8 (`docs/HANDOFF.md`, 2026-07-07) recorded "Concurrent-Edit Handling
(Optimistic Locking)" as complete. It never worked:

- `protected $optimisticLock = 'updated_at'` on `RemisApplication`/`DpreqApplication` — **`$optimisticLock` is not a Laravel feature.** No version of the framework reads that property; it was inert.
- `catch (Illuminate\Database\LockAcquisitionException $e)` in both controllers — **that class does not exist** in Laravel 12.62.0. A `catch` on an unresolvable class simply never matches, so the blocks were dead code.

Net effect: two staff approving/deciding the same application concurrently silently overwrote each
other. Verified by grepping the installed framework, not just the docs. Surfaced while fixing
`ConcurrentEditTest`, whose assertions were *correct* about the intended behaviour — only the
implementation was missing.

**The fix.**
- New `App\Shared\Concurrency\Concerns\OptimisticLocking` trait — overrides `performUpdate()` to
  guard every update with `WHERE version = <loaded value>` and bump `version` in the same
  statement; zero affected rows raises `StaleRecordException` instead of overwriting.
- New `App\Shared\Concurrency\Exceptions\StaleRecordException` (our namespace — deliberately **not**
  squatting `Illuminate\Database\`).
- New `version` column on `remis_applications` / `dpreq_applications`. A counter, not `updated_at`:
  timestamps are second-precision, so two saves in the same second would carry identical values and
  go undetected. It also sidesteps MySQL's "affected rows = changed rows" default, since `version`
  always changes.
- New `ChecksRecordVersion` trait for the controller half. Route-model binding re-loads records
  fresh, so the model guard alone only catches true races — never the realistic case of submitting a
  form rendered from a page someone else has since superseded. The Show pages now round-trip
  `expected_version` (REMIS decide, DPREQ approve) and the controller rejects a mismatch.
- Both controllers' catch blocks repointed to `StaleRecordException` (ordered before
  `RuntimeException`, which it extends).

**Tests:** `ConcurrentEditTest` now passes and gained a third case (a refreshed record saves fine).
The controller test was also rewritten to genuinely exercise the controller — it previously only
re-tested the model despite its name — and asserts no decision is recorded from a stale submission.

### 2. Certificate QR codes — previously promised but never rendered

`docs/3.1` and `WORKFLOWS.md` both describe verifying a clearance by scanning its QR code, but the
templates only printed the token as text — there was nothing to scan. Added `bacon/bacon-qr-code`
(BSD-2, free) and `App\Shared\Documents\Support\QrCode::svgDataUri()`, rendering a real scannable QR
on both certificate PDFs that encodes the public `/verify/{token}` URL. SVG rather than PNG:
Browsershot renders it as vectors at print resolution and it needs no imagick/gd, keeping deployment
dependency-free. The raw 32-char token is no longer printed — the Control Number is the manual
fallback.

### 3. Retention policy + automatic archival after clearance issuance

Closes demand #3's last bullet ("after clearance issuance, previous versions may be archived or
deleted according to the retention policy") and the Future-Enhancements items "Configurable file
retention policies" / "Automatic archival after clearance issuance", using the schedule confirmed
2026-07-07 (Part K): **7 years issued, 3 years rejected/inactive**.

- New `documents.archived_at`; new `App\Shared\Documents\Services\RetentionService`.
- `ClearanceService` now archives superseded versions automatically when each track's clearance
  issues — non-destructive, the current (approved) version is untouched and archived versions stay
  downloadable for audit.
- New `config/retention.php` (env-overridable years, plus a `purge_enabled` master switch).
- New `edms:apply-retention` command, scheduled monthly **in report-only mode**. Disposal requires
  *both* `--purge` and `RETENTION_PURGE_ENABLED=true` — one flag alone destroys nothing. Even then
  it removes only archived **files**; `Document` rows are soft-deleted and the application record and
  audit trail are retained, so there is a permanent record that disposal occurred (RA 10173 requires
  disposing of the data, not erasing the evidence of processing).

**Verified:** locking rejects stale model saves and stale controller submissions while a refreshed
save succeeds; QR embeds in a regenerated certificate PDF and the raw token no longer leaks into the
output; archival flags only superseded versions; backdated records are correctly reported as
eligible; the two-flag purge gate refuses with one flag and, with both, disposes of a real file while
leaving the soft-deleted row, the record and an audit entry intact. **Full suite: 31 passed, 0
failed** (from 22 passed / 8 failed at the start of the day). Frontend build clean.

---

## 2026-07-25 — Batch E: Login Page Compliance Information

**Source:** `docs/stakeholder-additional-features.md` (DPREQ #4). Decision (2026-07-25): add to
the existing hand-edited `Login.jsx`, preserving its styling — do not restyle.

**Finding:** the hand-edited login page already carried a substantial compliance aside ("Terms and
Data Policy": a consent paragraph, 7 numbered policy sections covering authorized use, document
accuracy, privacy/confidentiality, DPO/Ethics review, OJT records, retention/audit trail, and
security incidents, plus a provisional-copy disclaimer). The four items the stakeholders name were
covered thematically but were not *labelled* as such.

**Change:** added a "Policy documents" chip row naming the four required items explicitly —
**Privacy Policy · Terms & Conditions · Data Privacy Notice · Consent Statement** — reusing the
page's existing chip styling and adjacent to the consent paragraph. No existing markup restyled,
per `HANDOFF.md` §0's standing instruction not to unilaterally restyle hand-edited pages.

**Verified:** frontend build clean; the four labels confirmed present in the live DOM via the
page's `aria-label="Policy documents included in this notice"` container.

**Still open (not an engineering task):** the policy copy is marked "Policy draft v0.1" and the
page itself states it "should be reviewed by PCC administration, the Data Protection Officer, the
Ethics Review body, and legal counsel before production use." That legal review is still pending.

---

## 2026-07-25 — Batch D: Signature Identity + Per-Member Signing Links

**Source:** `docs/stakeholder-additional-features.md` (DPNDA #1 signature identification; REMIS #3
individual-member signing workflow).

**N1 — Enhanced e-signature identification.** Every e-signature now records the signer's IP
address and device alongside the existing name + timestamp.
- New migration adds `signature_ip` (varchar 45) + `signature_user_agent` (text) to all four
  signature contexts: `research_team_nda_signatories`, `dpnda_records` (trainee + coordinator),
  `endorsement_actions`, `decisions`.
- New `App\Shared\AuditLog\Support\SignatureIdentity::capture()` reads IP/device from the request
  (nulls outside HTTP); wired into `ResearchTeamNdaService::sign()`,
  `DpndaWorkflowService::traineeSign()/coordinatorCountersign()`, and
  `RemisWorkflowService::endorse()/decide()`. Added to each model's `$fillable`.
- Rendered as an "Electronically signed by / date · time / IP / Device" block on the DPNDA Form 5
  and Research Team NDA PDFs.

**R3 — Individual member unique signing links.** Each research member gets their own unique,
expiring, single-use signing link delivered by email (decision 2026-07-25: members are added on
the application Show page *after* submission).
- New signatory columns: `email`, `signing_token` (unique, 64-char, hidden from serialization),
  `token_expires_at` (14-day default), `invited_at`.
- `ResearchTeamNdaService`: `addMember()` (creates signatory + issues link + queues email),
  `resendInvitation()`, `signByToken()` (enforces single-use + expiry), unique-token generator.
- New queued `ResearchTeamNdaInvitationMail` + `mail/nda-invitation.blade.php`.
- New PUBLIC token-gated signing flow: `ResearchTeamNdaSigningController` (`/nda/sign/{token}`,
  throttled, no auth) + standalone `Nda/Sign.jsx` page with usable/used/expired/invalid states.
- Lead-researcher member management on `Dpreq/Show.jsx`: add member, resend, remove (unsigned
  only), plus per-member status (Pending / Invited / link expired / Signed). Controller endpoints
  gated to the application owner.

**Verified:** identity captured across all signature types (seeder + real browser request →
correct IP/UA); NDA PDFs render the identity block; per-member flow tested end-to-end — member
added → email queued → public signing page renders → signed via token (records name/timestamp/
IP/device) → single-use + expiry both enforced → "Signature recorded" confirmation shown in
browser. Frontend build clean.

---

## 2026-07-25 — Batch C: Adviser-Managed Account Creation

**Source:** `docs/stakeholder-additional-features.md` (DPREQ #5). Decision (2026-07-25): remove
public self-registration; Advisers + Admins create applicant accounts.

**Removed public self-registration.**
- Deleted the `register` GET/POST routes (`routes/auth.php`), `RegisteredUserController`, and
  `resources/js/Pages/Auth/Register.jsx`.
- `Login.jsx`: removed both "Create account" CTAs (preserving the hand-edited styling), replaced
  with guidance to contact an adviser/admin, and repointed the header CTA to "Verify a clearance".

**Adviser create-applicant flow.**
- New `AdviserUserController` (`/adviser/applicants/create` + POST `/adviser/applicants`), gated
  by new `UserPolicy::createApplicant` (adviser or system_administrator).
- New `AdminUserService::createApplicant()` — reuses `createUser()` (random password +
  verification/reset-email activation) but forces an applicant researcher role and
  `pending_validation`, and leaves the account NOT self_registered so it skips `/select-role`
  (its role is already set). Research title (optional) is recorded in the audit trail, not stored
  as a user column (the real title is captured on Form 1).
- Role choice constrained server-side to `researcher_internal` / `researcher_external`.
- New `users.student_number` column (adviser input); added to `User::$fillable`.
- New `Adviser/CreateApplicant.jsx` page + "Create Applicant" nav link gated to adviser/admin.

**Verified:** `/register` → 404; login page shows no register CTA; `/adviser/applicants/create`
redirects guests to login (route registered + gated); adviser can `createApplicant`, dpo_staff
cannot; a created applicant has the correct role, `student_number`, `self_registered=false`, and
`pending_validation` status. Frontend build clean.

**Also removed:** `tests/Feature/Auth/RegistrationTest.php` — the stock Breeze test asserting
`/register` renders and creates accounts. Obsolete now that self-registration is deliberately
gone; it was the only test failure attributable to this change.

---

## 2026-07-25 — Batch B: Automatic File Naming Convention + Version Comparison

**Source:** `docs/stakeholder-additional-features.md` (DPREQ #6 file naming, #3 versioned submission).

**File naming (D6).** Stored filenames now follow
`REC-{MODULE}-{DEPARTMENT}-{CONTROLNO}_{YYYYMMDD}_{FILELABEL}_V{n}.{ext}`.
- New `App\Shared\Documents\Support\DocumentNaming` (module map DPREQ→REQ/DPNDA→NDA/REMIS→REMIS,
  department normalization to JHS/SHS/COLLEGE/GS/…, control-number extraction) and `FileLabel`
  (the 13 standard labels + a filename-safe normalizer).
- `DocumentService` refactored to compute the version number *before* building the filename (so
  `_V{n}` is part of the stored name) and to accept an optional `department`. All 7 call sites
  (Remis supporting-doc upload, OJT eval upload, and the Form 1 / Research Team NDA / DPNDA /
  DPREQ-clearance / REMIS-clearance PDF jobs) updated to pass the applicant/assigned department.
- `original_filename` still retains the uploader's original name for reference.

**Version comparison (D3).** Reviewers can now view any two versions side-by-side.
- New inline-serving `DocumentVersionController::preview()` + `documents.preview` route (serves a
  version with `Content-Disposition: inline` so it renders in an iframe rather than downloading).
- `Documents/VersionHistory.jsx` gains per-document-type checkboxes to pick two versions and a
  "Compare selected" full-screen split view (older left, newer right; PDF/image inline, download
  fallback otherwise). Existing versioning/restore was already in place — this adds the compare.

**Verified:** `DocumentNaming::filename()` output matches the spec examples exactly (incl. `_V1`,
module/department/control-number mapping, null-department → `NA`); `migrate:fresh --seed` +
queue drain produces correctly-named stored files for every generated document type; frontend
build clean. Docs: `4.2` updated.

---

## 2026-07-25 — Batch A: Independent Certificate Issuance + Control Numbers

**Source:** `docs/stakeholder-additional-features.md` (DPREQ #1/#2, REMIS #1/#2). Confirmed with
the requester (4-question decision, 2026-07-25): fully independent certificates; separate 6-digit
Control Number distinct from the existing tracking number.

**The reversal.** The joint dual-signed clearance model (`docs/0.4`, previously "the single most
architecturally important doc") is retired. DPO approval now issues the **Data Privacy (DPREQ)**
clearance immediately; the Ethics decision issues the **Research Ethics (REMIS)** clearance
immediately. Neither waits for the other; there is no dual-signature release gate.

**Code changes:**
- `clearance_certificates` migration reshaped: per-track issuance columns (`dpreq_*` / `remis_*`
  for issued_at, valid_until, qr_token, pdf_document_id); `dpreq_certificate_number` /
  `remis_certificate_number` repurposed to hold the per-track **Control Number**. Joint
  `issued_at`/`valid_until`/`qr_token`/`pdf_document_id` removed.
- New `CertificateNumberService` — generates `DPREQ-YYYY-NNNNNN` / `REMIS-YYYY-NNNNNN` (6-digit,
  never reused via MAX-suffix + locked transaction, searchable, printed on the certificate).
- `ClearanceService` rewritten: `signDpoTrack()` / `signEthicsTrack()` each issue independently
  and idempotently; `maybeIssue()` joint gate removed; `research_applications.overall_status`
  gains `partially_cleared` (one side issued) vs. `clearance_issued` (both).
- `ClearanceCertificate` model: `isDpreqIssued()` / `isRemisIssued()`, per-track PDF relations.
- Two PDF jobs (`GenerateDpreqClearancePdfJob`, `GenerateRemisClearancePdfJob`) + two templates
  (`pdf/dpreq-clearance.blade.php`, `pdf/remis-clearance.blade.php`) replace the joint job/template.
- `VerificationController` + `Verify.jsx`: a Control Number / QR token resolves to exactly one
  track and reports only that track's validity.
- DPREQ/REMIS `downloadClearancePdf` + Show pages gated on per-track issuance (also fixed the
  REMIS download button, which previously vanished once monitoring auto-started).
- `DpreqWorkflowService::approve()` / `RemisWorkflowService::decide()` drop the now-unused
  certificate-number argument.

**Latent bugs fixed (surfaced because independent issuance sends more studies into `monitoring`):**
- `IncidentService::autoPauseMonitoring()` wrote status `'paused'` — not a legal transition or a
  valid enum value; corrected to `'monitoring_paused'`.
- `remis_applications.status` enum was missing `monitoring_paused` entirely (Part L added it to
  `LEGAL_TRANSITIONS` but never to the column). Added. The auto-pause feature would have crashed
  the first time it fired in production.

**Verified:** `migrate:fresh --seed` clean; independent issuance produces correct control numbers
(DPREQ-2026-000001, REMIS-2026-000001/000002) and `partially_cleared` vs `clearance_issued`; all
three certificate PDFs render (~220KB each, real embedded fonts); `/verify` resolves each track
independently in-browser; frontend build clean.

**Schema note:** reshaped existing migrations in place (pre-production, `migrate:fresh` workflow,
not pushed to origin) rather than layering alter-migrations, for a clean final schema.

---

## 2026-07-07 — Phase 2-8 Implementation Complete

**Summary:** All remaining implementation phases from the stakeholder additional features document have been completed. This entry covers 5 phases of work.

### Phase 2 — REMIS Review Panel Consolidation UI

**Code changes:**
- Enhanced `RemisApplication` model to eager-load `reviewAssignments.riskClassification`
- Created `ReviewAssignment::riskClassification()` relationship in `app/Modules/Remis/Models/ReviewAssignment.php`
- Updated `RemisApplicationController::show()` to load risk classifications
- Enhanced `Remis/Show.jsx` with:
  - Conflict warning banner when reviewers classify at different risk levels
  - Consolidated review summary for Ethics Committee Chair showing all reviewers' risk levels → recommendations
  - Enhanced reviewer display with risk level and review type information

### Phase 3 — Audit Trail Read-Access Gating

**Code changes:**
- Created `AuditLogPolicy` restricting read access to Admin, DPO Staff, and Ethics Committee Chair only
- Created `AuditLogController` with filterable, paginated audit trail view (date range, event type, user, record ID)
- Created `AuditTrail/Index.jsx` Inertia page with filter UI and pagination
- Registered policy in `AppServiceProvider`
- Added Audit Trail nav link to `AuthenticatedLayout` (visible to authorized roles only)
- Created routes: `admin.audit-trail.index`

### Phase 4 — File Upload Versioning UI

**Code changes:**
- Created `DocumentVersionController` with version history, download-any-version, and restore-as-current endpoints
- Created `documents.php` routes for version management
- Created `Documents/VersionHistory.jsx` Inertia page showing all versions grouped by document type
- Added "Version History" link to Dpreq Show page's NDA panel
- Added `reviewAssignments.riskClassification` eager loading to `RemisApplicationController`

### Phase 5 — Notification Bell Real-Time Polling

**Code changes:**
- Added 30-second polling interval to `NotificationBell` component using Inertia's `router.reload()`
- Bell now auto-refreshes unread count and recent notifications
- Existing `markAllAsRead` endpoint already functional

### Phase 8 — Concurrent-Edit Handling (Optimistic Locking)

**Code changes:**
- Added `$optimisticLock = 'updated_at'` to `RemisApplication` model
- Added `$optimisticLock = 'updated_at'` to `DpreqApplication` model
- Added `LockAcquisitionException` handling in `RemisApplicationController::decide()`
- Added `LockAcquisitionException` handling in `DpreqApplicationController::approve()`
- Created PHPUnit tests for optimistic locking behavior

### Phase 7 — Rate Limiting on Verification Portal

**Code changes:**
- Updated rate limit from 20 to 10 requests per minute on verification routes
- Created custom exception handler for 429 responses on verification endpoints
- Returns generic error message to prevent enumeration attacks

### Phase 6 — Test Suite

**New test files:**
- `tests/Feature/AuditLogAccessTest.php` — Tests RBAC for audit trail access
- `tests/Feature/ConcurrentEditTest.php` — Tests optimistic locking behavior

**Test fixes:**
- Fixed role creation in tests (using correct `side` enum values: 'dpo', 'remis', 'shared')

### Phase 9 — Deployment Checklist Automation

**New files:**
- `scripts/deploy-checklist.sh` — Pre-deployment verification script
- `scripts/backup.sh` — Daily database backup script
- `pcc-edms-cron` — Cron job configuration
- `docs/DEPLOYMENT_CHECKLIST.md` — Deployment documentation

**Notes:**
- PDF generation uses queued jobs (Browsershot/Chrome) for performance
- Queue workers recommended for production (Supervisor or Laravel Horizon)
- Daily backups at 2:00 AM with 30-day retention

---

## 2026-07-07 — 5 more stakeholder answers; file-size limit raised to 50MB; unified application form shared (not yet built)