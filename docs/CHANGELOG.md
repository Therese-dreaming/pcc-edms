# Documentation Changelog

Tracks substantive edits made to the `docs/` specification files after the initial draft —
what changed, why, and against what source. "ASSUMPTION" items that are resolved here are
marked accordingly in the affected file.

---

## 2026-07-07 — 5 more stakeholder answers; file-size limit raised to 50MB; unified application form shared (not yet built)

One code change, three questions closed as "already built correctly," one superseded, and one
substantial pending item flagged for scope confirmation before building.

**Code change:**
- **File upload limit raised from 10MB to 50MB.** Updated `DpndaRecordController::uploadEvaluationReport()`,
  `RemisApplicationController::submitProgressReport()`/`submitCompletionReport()` (Laravel
  validation `max:10240` → `max:51200`), and — necessary for the Laravel-side change to actually
  take effect — the local PHP install's `upload_max_filesize` (40M→50M) and `post_max_size`
  (40M→60M) in `C:\xampp\php\php.ini`. Without the PHP-level change, uploads above 40MB would
  have been silently rejected by PHP before Laravel's own validation ever ran.

**Confirmed already correct, no code change:**
- Risk-classification thresholds — confirmed deliberately non-algorithmic: reviewers pick a
  level via a decision control + written rationale, no auto-computation, no downstream
  consequence tied to the tier beyond the label. Matches `RemisApplicationController::submitReview()`
  and `RiskClassification` exactly as already built.
- Incident-filing "who can file" list (researcher, Ethics Secretariat, Ethics Reviewer, Ethics
  Committee Chair) — confirmed, matches `RemisApplicationPolicy::file()` exactly. The
  auto-pause-on-breach sub-question wasn't re-answered this pass, still open.
- OJT/Trainee Whereabouts as a placement-schedule snapshot (not real-time) — reconfirmed,
  matches the existing build.

**Superseded, not yet reflected in code:**
- The DPREQ/DPNDA form field lists and the Form 2/5 NDA template fields, both confirmed "fine
  as-is" on 2026-07-06, were superseded one day later: "Ignore all forms sent before. We will
  update all forms and send the approved ones." No code change until the new approved versions
  arrive.

**New, pending scope confirmation — not built:**
- `reqs/July-7-2026_Unified-Research-Ethics-and-Data-Privacy-Clearance-Application-Form.pdf` — a
  combined DPO+Ethics intake form with materially different fields (structured ethical-
  considerations checklist, Data Privacy Act–aligned data classification, storage/retention/
  disposal fields, a richer attachments checklist) and two new decision-side additions: an
  "Exempted" outcome for the Ethics Review Result (fifth option alongside the FRS's existing
  four), and an explicit DPIA-required Yes/No flag on the Privacy/ODP review. The requester also
  flagged that separate student/employee form variants and a new "REC Clearance and Exemption
  certificate" layout are still coming this week. Full breakdown of every field-level delta:
  `docs/9.1-review-and-open-questions.md` §2b. Deliberately not implemented yet — building
  against a form the requester has already partly superseded once this week risks the same
  rework that prompted "ignore all forms sent before" in the first place.


## 2026-07-06 (later same day) — Real fonts and header image applied to PDF templates, reversing the 2026-07-02 fallback decision

The 2026-07-02 entry below noted system fonts (Courier New, Arial) and a text-only header were
used "in place of the sample's bundled Aptos/Times TTFs (none supplied...)" and "no logo asset
supplied." Both are now supplied and applied — `public/fonts/Microsoft Aptos Fonts/`,
`public/fonts/times.ttf`, `public/fonts/cour.ttf`, and `public/images/DOCS HEADER.png` (the
actual PCC letterhead, replacing the CSS-recreated text header). Not a docs-content change, noted
for continuity:

- **New `App\Shared\Documents\Support\PdfAssets`** — embeds each font/image as a base64 `data:`
  URI. Necessary because `PdfGenerationService` hands rendered HTML to
  `Browsershot::html()` (docs/architecture.md ADR-005), which loads it via a temp file, not the
  app's web server — relative `/fonts` or `/images` URLs never resolve in that context, and
  embedding keeps every generated PDF byte-identical regardless of what's installed on the host.
- **Font hierarchy applied deliberately, not uniformly** across all three PDF templates
  (`research-team-nda` / Form 2, `joint-clearance` / Form 3, `dpnda-form5` / Form 5 — DPREQ's
  Form 1 has no PDF output today, it's a web form only): **Aptos** for structural/label text
  (form badge, form title, section headings, table labels/headers, signature name/title,
  approval block), **Times New Roman** for formal prose (the "I. Purpose"/"II. Scope" narrative
  paragraphs, the certification statement, Form 3's "Remarks"), **Courier New** stays the body
  default for filled-in answers/tracking numbers/footer document ID — preserving the existing
  "typewritten form" aesthetic for data while giving structure and prose distinct, more legible
  faces.
- **`.inst-name`/`.inst-dept` text-recreation removed** from `_header.blade.php`, replaced by the
  actual header image; `.inst-rule`'s CSS border also removed since the image already has its
  own separator line baked in (would otherwise double up).
- **Maroon aligned to the screen token exactly**: the form badge ("FORM 2"/"FORM 3"/"FORM 5") is
  now colored `#891a1a`, matching `primary-700` from the front-end redesign's design tokens
  (`resources/css/app.css`) — this is also the only place a PDF-specific hex existed
  (`.inst-name`'s old `#8b1a1a`, now removed along with that rule).
- Verified by generating a real PDF from each of the three templates via tinker (existing seeded
  records) and visually inspecting the output — header image renders correctly, no doubled
  separator line, all three font families render distinctly with no missing-glyph boxes, no
  layout breaks from the header image's height.

## 2026-07-06 — 18 outstanding open questions answered by DPO/ORD/IT; DPO Approver and Student Teacher roles retired

DPO put 18 consolidated open questions (`docs/9.1`, `docs/stakeholder-package/05`) directly to
the requester acting as DPO/ORD/IT decision-maker. Two answers required code changes; the rest
close out existing ASSUMPTION/🔴 items with no build impact.

**Code changes:**
1. **DPO Approver retired as a separate role.** DPO now has one role, `dpo_staff`, which owns
   the DPO track end to end — screening, endorsement, and the final `approve()`/`reject()`
   capability that was previously `dpo_approver`-exclusive. Updated: `RoleSeeder`, `UserSeeder`,
   `ReportDemoSeeder`; `DpreqApplicationPolicy`, `DpndaRecordPolicy`, `IncidentPolicy`;
   `DpreqApplicationController`, `DpndaRecordController`, `IncidentController` (`$canSeeAll`);
   `DpreqWorkflowService` (notification target); `DpoDashboardService::pendingMyAction()`
   (collapsed the per-role status match, dpo_staff now owns `screening`/`under_review`/
   `endorsed`); `DashboardController::DPO_ROLES`; `ChecksReportAccess` role arrays;
   `AuthenticatedLayout.jsx` `REPORT_CAPABLE_ROLES`; `Dpreq/Show.jsx` (`canApproverAct` merged
   into `canScreenerAct`, button copy updated). Verified end-to-end via
   `ReportDemoSeeder`'s existing DPREQ application, which now screens → endorses → approves →
   issues clearance entirely under `dpo_staff`.
2. **Student Teacher retired as a distinct trainee category.** Not a population DPO tracks
   separately from OJT. Removed: the `student_teacher` role (`RoleSeeder`); the
   `student_teacher` value from the `placements.trainee_type` enum (migration + `StorePlacementRequest`
   validation + `Dpnda/Create.jsx` dropdown); the standalone "Student Teachers by Grade Level"
   report (`DpoReportService::studentTeachers()`, `DpoReportController::studentTeachers()`, the
   `reports.student-teachers` route, `Reports/StudentTeachers.jsx`, and its entry in
   `ReportController`'s report list). The "Trainee Whereabouts" report is untouched — it never
   filtered by trainee type, so former student-teacher placements still show up there as
   ordinary internal/external OJT rows. `ReportDemoSeeder`'s two former student-teacher demo
   placements were reclassified as one internal, one external OJT placement.

**Confirmed, no build impact (docs updated to close the open question):**
- DPREQ form fields, 10MB file-size limit, and the 5-item DPO screening checklist — all correct
  as-is.
- NDA template fields (Form 2, Form 5) — correct as-is, no DPO/Legal changes.
- DPO's and ORD's "Compliance Monitoring Report" — confirmed stay separate.
- Trainee whereabouts — a placement-schedule snapshot is sufficient, no real-time check-in.
- Audit trail read access — Admin, DPO Staff, Ethics Committee Chair (not yet built; this
  confirms the intended list for when it is).
- "Research Ethics Head" = Ethics Committee Chair — same person, two labels (this had already
  been resolved and documented in `docs/0.4` and `HANDOFF.md`; today's answer just reconfirmed
  it — `docs/9.1` had not yet been updated to reflect that, now fixed).
- Research Team NDA (Form 2) required even for solo researchers — already built this way.
- SSO — Microsoft 365 / `pccnet.edu.ph` confirmed as PCC's actual institutional identity
  provider (previously just the requester's recollection); Entra ID (Azure AD) is the confirmed
  integration target. Still blocked on IT provisioning an app registration — no code changes yet.
- Out-of-scope list and success criteria (`0.1`) — confirmed correct as stated.
- Bulk CSV role import — reconfirmed as needed (already built, `docs/HANDOFF.md` Part H).
- Virus scanning on uploads — explicitly deferred by the requester until the rest of the project
  is complete, no longer an open IT policy question in the meantime.

**Still open, explicitly deferred rather than answered:** full-REMIS-track applicability for
every submission (vs. a risk-based fast track), exact risk-classification thresholds, and
incident-filing/auto-hold rules. Retention schedule (years for issued/rejected records) was
asked but not answered — remains open.

Docs updated: `0.2-stakeholders-and-roles.md` (role list + capability matrix),
`9.1-review-and-open-questions.md`, `4.4-audit-trail-status-tracking.md`,
`stakeholder-package/01-functional-design-document.md`,
`stakeholder-package/02-workflow-charts.md`, `stakeholder-package/03-role-raci-matrix.md`,
`stakeholder-package/05-open-questions-and-assumptions.md`.

## 2026-07-04 — Multi-reviewer panel review; monthly monitoring cadence + Overdue widget; NDA templates/discontinued-workflow/SMS declined

Not a docs change alone, noted for continuity (see `HANDOFF.md` Part G for full detail). After
the admin module closed the last confirmed-in-spec gap, four remaining open questions were put
directly to the requester (acting as DPO/ORD decision-maker) rather than guessed at:

1. **Multi-reviewer panel review — confirmed, built.** `docs/3.3` FRS §VIII/step 8 already
   described a panel ("Chair assigns reviewers," "consolidates reviewer recommendations," both
   plural), but the original build simplified to one reviewer per application. No schema change
   needed (`review_assignments` never had a uniqueness constraint) — the singularity was entirely
   in `RemisApplication::reviewAssignment()` (now `reviewAssignments()`, `HasMany`) and every call
   site assuming one row. `RemisWorkflowService::decide()` now requires every assigned reviewer
   to have submitted before a decision can be issued — the actual consolidation gate the FRS
   describes. `Remis/Show.jsx` gained a "Review Panel" section showing every reviewer's
   recommendation. Verified with a real 2-reviewer panel: both submitted independently, the
   Decide form only appeared once both had, and the Chair's decision consolidated correctly.
2. **Monitoring cadence — confirmed monthly, built.** `docs/3.4` left this as an unconfirmed
   ASSUMPTION ("every 6 months?"). `RemisMonitoringService::monitoringDueDate()`/
   `isMonitoringOverdue()` compute it on read (last progress report, or monitoring start, + 1
   month) rather than storing a column. This unblocked the ORD dashboard's 5th widget, "Overdue
   Monitoring," deferred in the dashboard session specifically for lacking this cadence.
3. **NDA template versioning — declined.** The current hardcoded Blade template stays as the
   single source of truth; an `nda_templates` table isn't built.
4. **Discontinued/Withdrawn early-exit workflow — declined.** A stalled REMIS study can just stay
   in `monitoring` indefinitely; `completion_reports.final_outcome` keeps those enum values for
   schema forward-compatibility only.

Also reaffirmed as a standing project constraint, not a fresh decision: the **SMS notification
channel stays unbuilt** — the project is meant to run entirely free apart from deployment
hosting, and every real SMS gateway is a paid service. Email, the one FRS-required channel, was
already built the prior session.

`docs/3.4`, `docs/4.3`, and `docs/9.1` updated to mark these as resolved (🟢) rather than open
questions, so a future session doesn't re-litigate them.

## 2026-07-04 — Three more open questions resolved; virus scanning researched (not built)

Same-day follow-up to the entry above. Three more stakeholder answers: (1) bulk role import for
OJT batches is confirmed required but not prioritized (`docs/4.1`, `docs/9.1`) — real backlog
item now, not an ASSUMPTION; (2) "Research Ethics Head" and "Ethics Committee Chair" are
confirmed to be one role under two labels (`docs/0.4`) — no code change needed, the existing
PDF-label-vs-internal-role split was already correct; (3) the requester recalls PCC uses
Microsoft 365 (`docs/9.1`, `docs/8.0`'s SSO question) — narrows the likely SSO integration target
to Microsoft Entra ID, but isn't an official IT confirmation and doesn't unblock building it
(still needs IT to confirm and to register an Entra ID app for real credentials).

Also researched (not implemented): free-forever virus scanning for uploads. **ClamAV** (GPLv2,
self-hosted via `clamd`) is the answer — free forever including institutional/commercial use,
since GPL's restriction only applies to statically linking `libclamav` into closed-source code,
not to shelling out to it as an external process. VirusTotal's public API and similar
cloud-scanning services were explicitly ruled out: their terms of service prohibit commercial/
institutional production use without a paid plan, which would violate the project's
zero-cost-forever constraint. Recorded in `docs/HANDOFF.md` Part G addendum for whenever this
gets built.

## 2026-07-04 — architecture.md ADR statuses corrected to match what's actually built

Same audit pass as the `system-design.md` entry below, extended to `architecture.md`'s four
ADRs after the requester asked directly whether anything else was outstanding. Two ADRs were
marked **Proposed** despite being fully implemented since session 1, with action items still
shown unchecked despite being done:

- **ADR-001 (Inertia.js vs. separate SPA)** — every module has been built entirely on Inertia
  page responses from the start; no REST/API layer was ever needed. Status changed to
  Implemented; "scaffold with Breeze's Inertia + React kit" checked off.
- **ADR-004 (local disk vs. S3)** — verified `config/filesystems.php`'s `documents` disk is
  driven entirely by `DOCUMENTS_DISK_DRIVER` in `.env`, and every file write goes through
  `DocumentService`/`Storage::disk('documents')`, never a raw filesystem call. Status changed to
  Implemented (local disk, S3-ready); that action item checked off. The backup-job action item
  is genuinely still open — left unchecked.
- **ADR-002 (SSO)** — split into what's actually true: the standalone-accounts path (plus admin
  creation, bulk import, email verification) is fully implemented; SSO itself is not. Updated to
  reference the Part G addendum's Microsoft 365/Entra ID lead, explicit that it's the requester's
  recollection, not an IT confirmation.
- **ADR-003 (MySQL)** — action item 2 ("use MySQL 8.0+") noted as already satisfied in local dev
  (verified: 8.4.3 via `DB::select('select version()')`), left unchecked since it's really a
  production-provisioning note pending `7.0`'s hosting decision, not a currently open risk.

## 2026-07-04 — system-design.md corrected to match what's actually built

Not a new feature, a documentation-accuracy pass on `system-design.md` §3 (Data Model), prompted
by generating a visualization of `knowledge-graph.json` and then checking whether the graph's own
"what's excluded" claim (field-level schema lives in `system-design.md`, not the graph) still
held up. The graph itself needed no changes — its structural scope (offices/modules/roles/
entities/statuses/reports) hasn't changed since v1.2, and the things that looked like gaps
(OJT evaluation reports, multi-reviewer cardinality) were already modeled correctly before the
code caught up. `system-design.md` had actually drifted, in five concrete ways:

1. `ojt_evaluation_reports` was still marked "design-only, not implemented" with a schema that
   doesn't match the real migration (real table has no `document_id` FK — the uploaded file goes
   through the polymorphic `documents` table like every other module's uploads, plus a `notes`
   column the doc never listed).
2. `decisions` listed a `signatories (json)` blob that was never built — the real table has
   `signature_id`/`signature_image`, matching the shape every other signing action uses.
3. Four tables were missing their `signature_image` columns entirely (`research_team_nda_
   signatories`, `dpnda_records` ×2, `endorsement_actions`, `decisions`) — added when drawn
   signatures shipped (`docs/HANDOFF.md` Part E), never back-filled into this doc.
4. `progress_reports.due_date` was listed as a stored column; it was never built that way — the
   monitoring due date is computed on read via `RemisMonitoringService::monitoringDueDate()`,
   specifically so it wouldn't need a persisted field.
5. `nda_templates` was still phrased as "not implemented this pass" (an open item) rather than
   "declined" (a settled decision from Part G).

Also fixed a propagated off-by-one: `knowledge-graph.md`, `system-design.md`, `README.md`, and
the `Role` model's own code comment all said "17 roles" — the actual count (`RoleSeeder`) is 16
(8 DPO-side + 7 REMIS-side + 1 shared). All four corrected to 16.

## 2026-07-04 — Bulk role import (CSV) added to Admin/User Management

Not a docs change, noted for continuity (see `HANDOFF.md` Part H for full detail). Closes the
last Part G item that was confirmed-required and immediately buildable without external input —
the requester confirmed bulk role import for OJT batches is wanted (just not prioritized), and
unlike SSO or virus scanning it needed no stakeholder specifics or server-side infrastructure.

`AdminUserService::previewImport()`/`importUsers()` — a validate-then-confirm CSV flow: parse and
validate every row (name, email uniqueness within the file and against existing accounts, `role`
matching a `roles.name` slug, `account_status` defaulting to `pending_validation`) without
persisting anything, then create only the valid rows via the existing `createUser()` — reusing
the same random-password + verification/reset-email path as a single admin-created account, no
new account-creation logic. New `/admin/users/import` flow on `AdminUserController` (form →
preview → confirm), and `Admin/Users/Import.jsx` showing a per-row validity table with specific
error reasons before anything is created. Verified with a CSV mixing 2 valid rows and 3
deliberately invalid ones (missing email, existing email, unknown role) — preview correctly
flagged exactly those three, confirm created exactly the two valid accounts with correct
role/department/status and audit log entries.

## 2026-07-04 — Admin/User Management module implemented

Not a docs change, noted for continuity (see `HANDOFF.md` Part F for full detail). `docs/4.1-
user-roles-permissions.md` requires "Admin-created (internal/staff) account" and "Admin can
reassign a user's role at any time," and `docs/0.2`'s capability matrix gives
`system_administrator` the sole "Manage user accounts/rights" checkmark — but until now, account
creation and role assignment only happened via `UserSeeder`/`RoleSeeder` or raw `tinker`, with no
UI at all. No schema change was needed (`users.role_id`/`department`/`account_status` already
existed from session 2).

New `App\Shared\Auth\{Policies\UserPolicy, Services\AdminUserService,
Http\Controllers\AdminUserController}` and an `/admin/users` route group (index/create/store/
edit/update), all `system_administrator`-only. Admin-created accounts get a random password they
never see, then two emails: the standard `Registered` event (queues the same verification email
self-registration gets — docs/4.1's verification step applies to admin-created accounts too) and
a `Password::sendResetLink()` call reusing Breeze's existing forgot-password flow so the new user
sets their own password. No new mail infrastructure was needed — both ride on the email channel
built the prior session plus stock Breeze scaffolding.

Editing a user is intentionally scoped to name/role/department/account_status, not email —
changing email would need a re-verification flow the docs don't describe. Every changed field
(not a full snapshot) is written to the audit trail via the existing `AuditLogService`, satisfying
docs/4.1 "Role changes are logged in the audit trail." Verified end-to-end as `admin@pcc.test`:
created a user, reassigned their role, confirmed the audit rows and both emails, and confirmed a
non-admin gets a real 403 with no "Admin" nav link visible.

## 2026-07-03 — Reporting module completed to 13/13; email channel; email verification; drawn e-signatures

Not a docs change, noted for continuity (see `HANDOFF.md` Part E for full detail). Four pieces,
done in sequence in one session:

1. **Closed out the Reporting module.** New `ojt_evaluation_reports` table, upload service/policy/
   UI, and the "OJT Evaluation Report Compliance" report (`5.3`) — the last of the 13 defined
   reports. Reporting is now 13/13.
2. **Email notification channel** (`docs/4.3` marks this "required," not optional). New
   `NotificationMail` (queued) + Blade template; `NotificationService::sendEmail()` fires
   alongside every in-app notification. `.env` intentionally left on `MAIL_MAILER=log` — a new
   `docs/EMAIL_SETUP.md` documents how to switch to Mailtrap/SMTP/Mailgun/SES instead, since real
   credential configuration was explicitly left to the requester.
3. **Email verification on signup** (`docs/4.1` "Validation Flow"). `User` now implements
   `Illuminate\Contracts\Auth\MustVerifyEmail` (the trait was already present via
   `Illuminate\Foundation\Auth\User` — only the contract was missing). Added the `verified`
   middleware to every module's route group.
4. **Drawn e-signatures**, replacing typed-name-only signing on DPREQ NDA signing, DPNDA trainee/
   coordinator signing, and REMIS endorsement/decision signing. New `signature_pad`-based
   `<SignaturePad>` component captures a base64 PNG per signature; new nullable
   `*_signature_image` columns sit alongside the existing typed-name columns everywhere signing
   happens. Per ADR-005 (`docs/architecture.md`, now marked Implemented), the drawn image is
   cosmetic only — **the typed name + timestamp remains the legally-operative signature under RA
   8792** — so every PDF template falls back to the original placeholder text when no image was
   captured. Verified the full pipeline end-to-end including inspecting the generated PDF's raw
   bytes for embedded `/Image` XObjects (confirming the signature actually renders as an image in
   the output, not just in the database).

## 2026-07-02 — DPO/ORD dashboards (`4.3`) implemented

Not a docs change, noted for continuity (see `HANDOFF.md` for full detail). Replaced the
placeholder `/dashboard` page with 4 of docs/4.3's 5 documented widgets per office (New
Submissions, Pending My Action, Returned/For Revision, Recently Completed), via a new
`DashboardController` and `App\Shared\Dashboard\Services\{Dpo,Ord}DashboardService` — same
one-service-per-office split already established by the Reporting module. `dpo_staff`/
`dpo_approver` get the DPO set, the three ethics roles get the ORD set, `system_administrator`
gets both, everyone else keeps the original fallback message.

"Pending My Action" is per-user only where the schema actually supports it: `ethics_reviewer`'s
widget reads their own `review_assignments` rows (a real FK to the logged-in user), but DPREQ
screening/endorsement and REMIS screening have no per-user assignment column anywhere — those
abilities are gated by role in the capability matrix, not assigned to a specific person — so
`dpo_staff`/`dpo_approver`/`ethics_secretariat`/`ethics_committee_chair` see "whatever status my
role currently owns" instead. Verified this genuinely differs per role, not just per office, by
comparing `dpo_staff` vs. `dpo_approver` logins against the same `dpreq_applications` table.

"Overdue Monitoring" (the 5th widget, ORD-only) was not built: it needs a `monitoring_due_date`
field that docs/3.4 itself already flags as an unconfirmed ASSUMPTION, with no monitoring cadence
ever confirmed to compute it from.

## 2026-07-02 — Notification bell (`4.3`) implemented, plus every module's missing notification triggers

Not a docs change, noted for continuity (see `HANDOFF.md` for full detail). Before building the
bell UI, discovered `NotificationService` (built session 1) was only ever called from
`IncidentService` — DPREQ (`1.2`), DPNDA (`2.2`), and REMIS (`3.3`) each define a "Notifications
Triggered" list in their own docs, but none of it was wired into the actual workflow services.
Wired up every documented trigger across `DpreqWorkflowService`, `DpndaWorkflowService`,
`RemisWorkflowService`, and `ClearanceService` (joint clearance issued — one notification per
event, not one per DPO/REMIS track, since it's the same person either way). Also added
notifications to `RemisMonitoringService` (progress report submitted/reviewed, study archived) —
not covered by `3.3`'s list since that doc predates the `3.4` split, so this is an inferred
extension of the same "notify whoever acts next" pattern, flagged as such inline.

Built the bell itself: `notifications` (`{unread_count, recent}`) is now an Inertia-shared prop
on every request, a `NotificationBell` dropdown lives in `AuthenticatedLayout`'s nav, and
`/notifications` is a full paginated history page. `Notification::related_url` is a new appended
accessor mapping the polymorphic `related_type` to whichever show-page route that type actually
has, returning `null` (not throwing) for anything unmapped.

Found and fixed a real bug while browser-verifying the history page: `NotificationController::
index()` initially named its paginated-list page prop `notifications`, colliding with the
same-named global shared prop from `HandleInertiaRequests` — Inertia resolves same-key
page-prop/shared-prop collisions in favor of the page prop, so `NotificationBell` (which reads
the shared shape) received the paginator object instead and crashed calling `.map()` on
`undefined`, with no error boundary anywhere in the app to contain it. Fixed by renaming the page
prop to `notificationHistory`.

## 2026-07-02 — REMIS Monitoring & Completion (`3.4`) implemented; Reporting module completed to 12/13

Not a docs change, noted for continuity (see `HANDOFF.md` for full detail). Built `docs/3.4` in
full: `progress_reports` and `completion_reports` tables, `App\Modules\Remis\Monitoring\*`
(model/service/policy, mirroring the `Modules\Remis\Incident` sub-namespace pattern), and a
"Monitoring & Completion" section on the REMIS show page. `ClearanceService` now auto-transitions
`clearance_issued -> monitoring` once a joint clearance is issued (ASSUMPTION: the FRS names no
manual trigger). Submitting the Final Ethics Completion Report is treated as acceptance —
closes and archives the study in one step (ASSUMPTION: the FRS says "on acceptance" but names no
separate accept action/role). Both ASSUMPTIONs are documented inline in
`ClearanceService`/`RemisMonitoringService`, not just here.

This unblocked the two reports the previous entry below deferred: Compliance Monitoring Report
and Archive Studies Report are now built against real data, bringing the Reporting module to
12 of 13 (only "offices without OJT evaluation reports" remains, blocked on the still-unmigrated
`ojt_evaluation_reports` table).

Found two bugs this pass:
1. Same `statusHistory()` ordering issue as the entry below, this time surfacing while verifying
   the REMIS status history display — already fixed by that entry's change, no new fix needed.
2. **`SecondaryButton` (resources/js/Components) defaults to `type="button"`.** The new
   compliance-review form used it as its submit control; clicking did nothing (not even a failed
   network request, since no submit event ever fired). Only caught because the form was tested
   live in-browser rather than only through the seeder — fixed by switching to `PrimaryButton`.

## 2026-07-02 — Reporting module (`5.x`) implemented

Not a docs change, noted for continuity (see `HANDOFF.md` for full detail). Built 10 of the 13
reports defined in `5.1`-`5.3` — `App\Shared\Reports\{Services,Http\Controllers}`, one Inertia
page per report under `resources/js/Pages/Reports/`, CSV export (`?format=csv`) standing in for
the docs' "export Excel" requirement, and a Browsershot-generated PDF for the Annual Ethics
Report specifically (the one report the docs call out as needing a formatted PDF document).
Three reports explicitly **not** built because their data source doesn't exist yet: Compliance
Monitoring Report and Archive Studies Report (both need `3.4` Monitoring/Completion, still
unbuilt), and "offices without OJT evaluation reports" (needs the `ojt_evaluation_reports` table,
still design-only per the `2026-07-02` DPNDA-schema entry above).

While building the "Pending DPO Approvals" report, found and fixed a real bug: every
`statusHistory()` relation (`DpreqApplication`, `RemisApplication`, `DpndaRecord`, `Incident`)
ordered only by `latest('created_at')`, which has no defined tiebreak when two transitions land
in the same second — common right after a batch of seeded/scripted actions, and not actually
impossible in live use (e.g. a same-second screen-then-endorse). Any code reading
`->statusHistory->first()` as "the latest transition" could silently get a stale row. Fixed by
adding a secondary `->latest('id')` sort to all four relations.

## 2026-07-02 — DPNDA `placements`/`dpnda_records` schema reconciled to Form 5

| File | Change | Why |
|---|---|---|
| `system-design.md` | §3.3's `placements` table rebuilt to match Form 5's actual fields (trainee name/gender/age/enrolled school/hours/address/department-assigned/supervisor/endorsed-by) instead of the original generic `school_institution`/`grade_year_level` fields; `dpnda_records` given explicit signature/decline columns matching `2.2`'s status lifecycle. `nda_templates` and `ojt_evaluation_reports` explicitly marked design-only (not implemented) rather than left ambiguous. | This table predated the `reqs/` reconciliation pass (`0.4-dpo-ethics-integration.md`) and was never updated alongside `2.1`'s Form 5 field correction — implementing the DPNDA module surfaced the mismatch. |

Also implemented this pass (not a docs change, noted for continuity): PDF generation for the
Research Team NDA (Form 2) and OJT/Trainee NDA (Form 5) via Browsershot, adapted from
`sample-services/dpo-eforms/*.blade.php` into `resources/views/pdf/*`. Text-based institutional
header used in place of a logo image (no asset supplied); system fonts (Courier New, Arial) used
in place of the sample's bundled Aptos/Times TTFs (none supplied, and Windows/Chrome already
guarantee the fallbacks). PDF generation is queued (`docs/system-design.md` §5) so Browsershot's
~1.5-2s Chrome-launch cost never blocks the signing request.

## 2026-07-02 — Stack confirmed, database engine changed to MySQL

Requester confirmed the implementation stack: React + Inertia.js + Laravel + **MySQL** (not
PostgreSQL as `architecture.md` ADR-003 originally proposed) — "since it is a web development
project anyways," prioritizing hosting compatibility/familiarity over the marginal
reporting-query ergonomics that motivated the original Postgres lean.

| File | Change | Why |
|---|---|---|
| `architecture.md` | ADR-003 rewritten: decision changed from PostgreSQL to MySQL 8.0+, with updated trade-off analysis and consequences; resolved-architecture summary table updated. | Direct requester confirmation overrides the original proposal — `9.0` step 4's confirmation gate for this decision is now closed. |
| `8.0-tech-stack.md` | RDBMS row and "Open Decisions" list updated — all 4 original open decisions now marked resolved, database engine specifically marked 🟢 confirmed (vs. the other three, which are 🟡 architecturally-proposed defaults). | Distinguishes "requester explicitly confirmed" from "architecture pass proposed a sensible default" for future readers. |

No changes to `system-design.md`'s schema were needed — all `json` columns map directly to
MySQL's native `JSON` type, and no table design in §3 was Postgres-specific.

## 2026-07-02 — DPO ↔ Ethics integration pass

**Source of truth used:** `reqs/DPO EFORM 1/2/3/5 SAMPLE.pdf` — four EVP-approved PCC forms that
existed in the repo (`reqs/`, not `docs/`) but had never been read into this doc set. They
surfaced a structural gap the REMIS alignment pass above didn't touch: DPREQ (`1.x`) and REMIS
(`3.x`) were modeled as two independent applications, each producing its own clearance
certificate. The real forms show one combined intake (Form 1) and one combined, dual-signed
clearance (Form 3, DPO Officer + Research Ethics Head) — confirmed directly by the requester,
not inferred. New file `0.4-dpo-ethics-integration.md` records the resolved model.

| File | Change | Why |
|---|---|---|
| `0.4-dpo-ethics-integration.md` (new) | Added. Documents the single-intake/dual-track/joint-clearance model, the Form-to-module mapping, the dual-signature release rule, and three new open questions. | This is a cross-cutting concern referenced by both `1.x` and `3.x` — didn't belong inside either module's own file. |
| `1.1-dpreq-application-form.md` | Replaced the invented Section A/B field list with Form 1's actual confirmed fields; kept the old list as a marked 🔴 proposed DPO-internal extension rather than deleting it; corrected required-document list to Form 1 item 8; updated Output section to describe the joint certificate. | The original fields were pure ASSUMPTION ("no source doc lists them field-by-field") — Form 1 is exactly that source doc, previously unread. |
| `1.2-dpreq-workflow.md` | `Clearance Issued` now explicitly gated on the Ethics track also completing. | Previously implied DPO alone could release a clearance; Form 3 requires both signatures. |
| `1.3-dpreq-documents.md` | Accepted-file-types table rebuilt around Form 1's actual required uploads (approved respondent-head letter, Chapter 1, questionnaire, adviser endorsement letter, conditional parental consent), old list kept as marked-unconfirmed additions. | Same reasoning as `1.1`. |
| `2.1-dpnda-nda-template.md` | Split into two instruments: Research Team NDA (Form 2, DPO-POL-005, tied to research applications) and OJT/Trainee NDA (Form 5, DPO-POL-002, tied to placements) — the original file only modeled the latter under a generic field guess. | "DPNDA" was assumed to mean OJT NDAs only; Form 2 revealed a second, distinct NDA instrument under a different policy that the original module scope missed entirely. |
| `2.2-dpnda-workflow.md` | Clarified the documented status lifecycle is the OJT/Trainee (Form 5) flow specifically; described the simpler all-signers-parallel flow for the Research Team NDA (Form 2). | Same split as `2.1`. |
| `3.1-remis-application-form.md` | Added notes that REMIS is the Ethics-side internal elaboration of the same Form 1 submission, not a separately-submitted application; Output section rewritten to describe the joint certificate. | Resolves the apparent FRS-vs-EForm contradiction: they describe the same process at different levels of detail, not two different processes. |
| `3.3-remis-review-workflow.md` | `Clearance Issued` now explicitly described as this track's contribution to the joint certificate, gated on the DPO track also signing. | Mirrors the `1.2` change from the other side. |
| `architecture.md` | Added a note confirming none of the 5 ADRs change; only `system-design.md` is structurally affected. | Keeps the ADR set from looking stale without re-litigating stack decisions that aren't in question. |
| `system-design.md` | New `research_applications` table (the shared Form 1 parent); `dpreq_applications`/`remis_applications` now hold a 1:1 FK to it instead of duplicating title/dates; `clearance_certificates` restructured with separate `dpo_signed_by`/`ethics_signed_by` columns and an issuance rule gated on both being set; new `research_team_ndas`/`research_team_nda_signatories` tables for Form 2; §4 module boundaries updated with new `Shared\ResearchApplications` and `Shared\Clearance` services that both `Dpreq` and `Remis` depend on (not on each other); example endpoints and data-flow narrative rewritten around the joint flow. | This is the schema-level fix for the structural gap — everything else in this pass was documentation description, this is where it becomes enforceable. |
| `9.1-review-and-open-questions.md` | Added §2a documenting the integration and three new 🔴 open questions (full-REMIS-track applicability, Research Ethics Head vs. Ethics Committee Chair, Form 2 applicability to solo researchers). | Keeps the consolidated open-questions list current per `9.0` step 2's "do not skip" instruction. |

## 2026-07-02 — REMIS alignment pass

**Source of truth used:** `REMIS_Functional_Requirements_Specification.md` (the authoritative
FRS supplied for Module 3). The prior `3.1`–`3.4` files were drafted as reasonable
*assumptions* before this FRS was available and diverged from it in several material ways.
This pass reconciles them.

| File | Change | Why |
|---|---|---|
| `0.2-stakeholders-and-roles.md` | Replaced generic "REC Reviewer/REC Chair" role set with the FRS's actual 8-role list (Researcher, Adviser, Program Head, Dean/Academic Head, Ethics Secretariat, Ethics Reviewer, Ethics Committee Chair, System Administrator) merged alongside the DPO roles. Rebuilt the capability matrix to include the academic endorsement chain. | The original matrix had no way to represent a 4-step academic endorsement (Adviser → Program Head → Dean) before ethics review even starts — it collapsed straight to "REC Reviewer." This is a workflow-breaking omission, not a cosmetic one. |
| `3.1-remis-application-form.md` | Added missing required fields from FRS Section C (Participants) and D (Ethics Information): Target Population, Number of Participants, Inclusion/Exclusion Criteria, Risks to Participants, Benefits, Confidentiality Measures, Consent Process. Added QR Verification Code + Verification Portal to clearance certificate output, matching FRS Section XI. | These fields exist in the FRS but were absent from the draft form spec — the draft only had a subset. |
| `3.2-remis-screening-risk.md` | Renamed actor from "REC Reviewer" to "Ethics Secretariat" for screening (FRS §VI) and "Ethics Reviewer"/"Ethics Committee Chair" for classification (FRS §VII), matching the FRS's actual division of labor. Added "Returned for Compliance" as a distinct screening outcome (FRS §VI) alongside Pass/Return. | The FRS splits screening (Secretariat) from classification (Reviewer/Chair) — the draft had merged these under one undifferentiated "REC Reviewer" actor. |
| `3.3-remis-review-workflow.md` | Rebuilt the status lifecycle to prepend the endorsement chain (`Researcher → Adviser → Program Head → Dean → Ethics Secretariat`, FRS §IV) before screening, and to use the FRS's exact status vocabulary (Draft Submitted, Under Endorsement, For Screening, For Review, For Revision, Approved, Approved with Conditions, Deferred, Disapproved, Closed, Archived — FRS §V) instead of the invented status names. Added "Approved with Conditions" and "Deferred" as decision outcomes (FRS §X), previously missing entirely. | The old lifecycle skipped academic endorsement and was missing two of the four possible committee decisions. Status names now match the tracking module's `Status Values` list exactly, which matters because reports and the audit trail key off these values. |
| `3.4-remis-monitoring-archiving.md` | Split into Monitoring (FRS §XII, added Participants Recruited / Ethics Concerns / Protocol Deviations / Corrective Actions fields) and Completion (FRS §XIV, added Final Participant Count / Compliance Statement / Publication Status / Data Storage Location / Final Outputs Uploaded). Archiving is now explicitly the *outcome* of Completion, not a parallel process. | The draft's monitoring fields were a thin placeholder; the FRS has a much richer Completion Module that was previously not represented at all. |
| `3.5-remis-incident-reporting.md` (new file) | Added — did not exist before. Captures FRS §XIII (Incident Reporting Module: Participant Complaint, Data Breach, Confidentiality Breach, Psychological Harm, Protocol Violation, Other; immediate notification, incident tracking, corrective action monitoring). | This entire module was missing from the original 3.x set. Given DPO's data-privacy stake, an unreported data-breach pathway inside REMIS is a compliance gap, not just a documentation gap — this is the most consequential fix in this pass. |
| `4.2-file-management-naming.md` | Standardized tracking/ID number format across modules to `[MODULE]-YYYY-NNNN` (e.g. `REC-2026-0001` per FRS §V, `DPREQ-2026-0001`, `DPNDA-2026-0001`), replacing the inconsistent `2026-000045`-style example that had no module prefix and didn't match the FRS's own example format. | `1.1` and `4.2`'s own examples used two different ID shapes for the same concept; the FRS gives one canonical shape — standardized on that. |
| `1.1-dpreq-application-form.md` | Added QR Verification Code + Verification Portal note to the DPREQ clearance certificate output, for parity with the REMIS clearance certificate. | Both modules issue a "clearance certificate"; there's no reason DPREQ's should be less verifiable than REMIS's, and 5.x reports/audit trail treat them as equivalent artifacts. |
| `6.0-master-prompt.md` | Marked deprecated at the top of the file, pointing to `9.0-master-prompt.md`. Content left intact for history. | `6.0` covers only files `0.1`–`5.3`; `9.0` is a strict superset covering `0.1`–`8.0`. Keeping both live invites someone to paste the stale one. |
| `5.1-reports-shared.md` | Added an **Incident Summary** report definition. | The new `3.5` incident module had no corresponding report — incident data would be captured but never surfaced. |
| `0.3-glossary.md` | Added 7 terms introduced by the REMIS realignment (Ethics Secretariat, Ethics Reviewer, Ethics Committee Chair, Academic Endorsement Chain, Tracking Number, Verification Portal, Incident). | Glossary had fallen out of sync with the terms now used across `0.2` and `3.x`. |

## Open items intentionally left as-is

- Report definitions in `5.1`–`5.3` are unaffected by the REMIS realignment (they reference
  fields that still exist after the fix) — no changes needed there.
- `7.0-deployment.md` and `8.0-tech-stack.md` open decisions are addressed separately in
  `architecture.md`, not by editing those files' checklists (the checklists remain accurate
  records of what was still undecided at spec time).
