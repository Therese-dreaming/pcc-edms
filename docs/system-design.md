# System Design — PCC-EDMS

Produced via `/engineering:system-design`, executing `9.0-master-prompt.md` step 3(b)–(c): a
normalized data model and API/module boundaries. Pairs with `architecture.md` (step 3a/3d —
stack decisions) and `knowledge-graph.json` (structural relationships this data model
implements). Source docs: `0.1`–`9.1`, `REMIS_Functional_Requirements_Specification.md`.

> **2026-07-02, revised:** §3 and §4 below updated to reflect
> `0.4-dpo-ethics-integration.md` — DPREQ and REMIS are not independent applications each
> producing their own clearance. They are two internal review tracks (DPO, Ethics) acting on one
> shared `research_applications` record, converging on one dual-signed `clearance_certificates`
> row. This changes the shape of §3.1/3.2/3.4 and the module-boundary rule in §4. See
> `CHANGELOG.md` for the reconciliation this was built on.
>
> **2026-08-31 (audit):** the dual-signed model above was itself RETIRED on 2026-07-25 — the
> tracks now issue INDEPENDENT certificates (per-side `dpreq_*`/`remis_*` issuance columns,
> 6-digit control numbers, `overall_status` gains `partially_cleared` for the one-side-issued
> state; no release gate). Everything in this file about "both signatures", the single
> `issued_at`, and the joint release rule (§2 step 6, §3.1, §4) is stale. Controlling texts:
> `0.4` §Issuance rule, `1.2`, `WORKFLOWS.md` §3. Role count is 14, not 16.

---

## 1. Requirements

### Functional (from `0.1`, `1.x`–`5.x`)
- Online application, review, and clearance issuance for DPREQ (DPO) and REMIS (ORD/REC).
- Online NDA e-signing and placement tracking for OJTs/trainees/student teachers (DPO).
- Multi-actor workflows per module: DPREQ (linear, DPO-internal), REMIS (4-step academic
  endorsement → secretariat screening → risk-tiered review → committee decision → monitoring →
  completion), DPNDA (sign/countersign).
- Standalone incident reporting for REMIS studies, with cross-module notification to DPO on
  breach-type incidents (`3.5`).
- Document repository with versioning, soft-delete, and consistent naming (`4.2`).
- E-signature capture, in-app + email notifications (`4.3`).
- Full audit trail, immutable, filterable (`4.4`).
- 13 defined reports across shared/ORD/DPO scopes, all computed from application data without
  manual compilation (`5.1`–`5.3`).
- Public, unauthenticated clearance verification by tracking number / QR code (`3.1`, `1.1`).

### Non-functional
- **Data sensitivity:** DPREQ/DPNDA/REMIS all handle personal data under the Philippine Data
  Privacy Act; REMIS additionally handles ethics-sensitive research data. Every write needs an
  attributable, immutable audit record (`4.4`, FRS §XVI).
- **Scale:** institutional, not internet-scale. Estimate (ASSUMPTION, no volume figures in
  source docs — validate with DPO/ORD): low hundreds of DPREQ/REMIS applications per year,
  possibly 500+ DPNDA records per year concentrated around OJT intake periods (semester start =
  burst load, not steady-state).
- **Availability:** business-hours-critical, not 24/7-mission-critical — a few hours of planned
  downtime for maintenance is acceptable; unplanned downtime during an active submission
  deadline is not.
- **Portability:** must not be architecturally coupled to a specific host/domain/storage
  backend until `7.0-deployment.md`'s hosting decision is made (env-driven config throughout).
- **Auditability > raw performance.** Given DPO's ownership of sensitive data, correctness and
  traceability of every state change matters more than shaving milliseconds off a request.

### Constraints
- Frontend: React. Backend: Laravel (confirmed, `8.0`).
- Small institutional dev team (assumed — not stated, but implied by single-repo, single-stack
  scope); favors a design that one team can operate, not a distributed-systems design.
- Hosting/domain undecided (`7.0`) — nothing below may hardcode a host.

---

## 2. High-Level Design

```
                              ┌─────────────────────────┐
                              │   React SPA (frontend)   │
                              │  DPO views | ORD views   │
                              │  Public verification page│
                              └────────────┬─────────────┘
                                           │ HTTPS (JSON)
                              ┌────────────▼─────────────┐
                              │      Laravel API          │
                              │ ┌───────┬───────┬───────┐ │
                              │ │ DPREQ │ DPNDA │ REMIS │ │  ← module boundaries, §4
                              │ │       │       │(+Inc.)│ │
                              │ └───────┴───────┴───────┘ │
                              │ ┌───────────────────────┐ │
                              │ │   Shared services:     │ │
                              │ │ Auth · Documents ·     │ │
                              │ │ Notifications ·        │ │
                              │ │ AuditLog · Reporting   │ │
                              │ └───────────────────────┘ │
                              └──┬──────────┬───────────┬─┘
                                 │          │           │
                       ┌─────────▼──┐ ┌─────▼─────┐ ┌───▼────────┐
                       │  RDBMS      │ │File storage│ │ Queue      │
                       │(app + audit │ │(local→S3-  │ │(PDF gen,   │
                       │ + report    │ │ compatible)│ │ email, SMS)│
                       │ data)       │ └────────────┘ └─────┬──────┘
                       └─────────────┘                       │
                                                    ┌──────────▼─────────┐
                                                    │ Mail/SMS provider,  │
                                                    │ PDF renderer,       │
                                                    │ e-sign capture      │
                                                    └─────────────────────┘
```

### Data flow (representative: joint application → dual-track review → joint clearance)
0. Researcher submits **Form 1** once → one `ResearchApplication` row is created (`Shared`
   service, not owned by either module). This single submission fans out to both tracks below,
   per `0.4-dpo-ethics-integration.md`.
1. **DPO track:** `DpreqApplication` (linked 1:1 to the `ResearchApplication`) moves through
   `Submitted → Screening → Under Review → Endorsed → Approved` (`1.2`); the Research Team NDA
   (`ResearchTeamNda`, Form 2) must reach fully-signed before `Approved`.
2. **Ethics track (parallel):** `RemisApplication` (also linked 1:1 to the same
   `ResearchApplication`) moves `Draft Submitted → Under Endorsement` via React → Laravel
   `Remis` module. Endorsement steps write `EndorsementAction` rows; each write fires an
   `AuditLog` event and a queued `Notification` job to the next endorser.
3. On Dean approval, Ethics Secretariat is notified; screening writes a `ScreeningResult`.
4. On screening pass, `RiskClassification` is recorded by an Ethics Reviewer; review track is
   derived, `ReviewAssignment` rows created for assigned Ethics Reviewer(s).
5. Ethics Committee Chair issues `Decision`; on Approved/Approved with Conditions, the Ethics
   track signs its half of the shared `ClearanceCertificate` row (`ethics_signed_by`/
   `ethics_signed_at`).
6. **Convergence:** a queued job watches for both `dpo_signed_by` and `ethics_signed_by` being
   non-null on the same `clearance_certificates` row. Only when both are set does it render the
   Form 3 PDF (with QR code), store it via the Documents service, and flip the
   `ResearchApplication`'s overall status to `Clearance Issued` — regardless of which track
   signed second. Before that point, each track's own status can independently show `Approved`
   while the certificate stays unreleased.
7. Reporting module reads directly from the normalized tables below (no separate data
   warehouse at this scale) to compute `5.1`–`5.3` reports on demand.

---

## 3. Data Model

Normalized relational schema. `snake_case` table names, Laravel-idiomatic (matches `8.0`'s
confirmed backend). Every table listed has `created_at`/`updated_at`; soft-deletable tables also
have `deleted_at` per `4.2`'s soft-delete rule.

### 3.1 Shared / cross-module tables

**`users`**
`id, full_name, email (unique), password_hash (null if SSO-only), role_id → roles.id, department, account_status (pending|active|suspended|deactivated), sso_subject_id (nullable), created_at, updated_at`

**`roles`** — one row per role in `0.2`'s role list (16 rows, DPO-side + REMIS-side + Admin).
`id, name, side (dpo|remis|shared)`

**`documents`** (polymorphic, shared across all modules)
`id, documentable_type, documentable_id, document_type, file_path, original_filename, mime_type, size_bytes, version, uploaded_by → users.id, is_current_version, created_at`
— `documentable_type/id` = polymorphic link to `dpreq_applications`, `dpnda_records`, `remis_applications`, `incidents`, etc. Old versions retained with `is_current_version = false` per `4.2`.

**`status_history`** (polymorphic, drives every workflow diagram in `1.2`/`2.2`/`3.3`)
`id, statusable_type, statusable_id, from_status, to_status, changed_by → users.id, comments, created_at`

**`audit_log`** (append-only, `4.4`/FRS §XVI — no update/delete permitted at the application layer)
`id, user_id, event_type, auditable_type, auditable_id, old_value (json, nullable), new_value (json, nullable), ip_address, device_info, created_at`

**`notifications`**
`id, user_id, channel (in_app|email|sms), subject, body, related_type, related_id, read_at (nullable), created_at`

**`research_applications`** (new, `0.4-dpo-ethics-integration.md` — the single Form 1 intake shared by both tracks)
`id, applicant_id → users.id, research_title, researcher_count, adviser_name, department, level, course, section, respondents, target_respondent_count, data_collection_method, data_capturing_tool, target_start_date, target_end_date, minors_involved (bool), respondent_head_letter_approved (bool), overall_status (in_progress|clearance_issued), created_at`
— `dpreq_applications` and `remis_applications` (below) each hold a 1:1 `research_application_id` FK to this table; it is the parent both tracks act on, not a merge of DPO/Ethics ownership (`4.` still applies).

**`clearance_certificates`** (shared shape, now attached to the joint `research_applications` record, not per-module — `1.1`/`3.1`/`0.4`)
`id, research_application_id → research_applications.id, dpreq_certificate_number (DPREQ-YYYY-NNNN, nullable until DPO track approves), remis_certificate_number (REC-YYYY-NNNN, nullable until Ethics track approves), dpo_signed_by → users.id (nullable), dpo_signed_at (nullable), ethics_signed_by → users.id (nullable), ethics_signed_at (nullable), issued_at (nullable — set only when both signatures present), valid_until, pdf_document_id → documents.id (nullable until issued), qr_token (unique, generated on issuance), created_at`
— **Release rule** (`0.4`): the PDF is generated and `qr_token`/`issued_at` populated only when both `dpo_signed_by` and `ethics_signed_by` are non-null. A row with only one signature exists (each office can see the other is pending) but is not applicant-visible as issued.

**`research_team_ndas`** (new, Form 2, DPO-POL-005 — `2.1.a`)
`id, research_application_id → research_applications.id, tracking_number, status (draft|pending_signatures|completed), created_at`

**`research_team_nda_signatories`**
`id, research_team_nda_id → research_team_ndas.id, user_id → users.id (nullable, external team members may not have accounts), full_name, role (leader|member), signature_id, signature_image (nullable, LONGTEXT base64 PNG — drawn-signature capture, ADR-005), signed_at (nullable), created_at`

### 3.2 DPREQ (Module 1)

**`dpreq_applications`** (the DPO track — 1:1 with a `research_applications` row, `0.4`)
`id, research_application_id → research_applications.id, tracking_number (DPREQ-YYYY-NNNN, unique), applicant_id → users.id, applicant_type, department, purpose, data_types (json array), data_subjects (json array), retention_plan, third_party_sharing (bool), third_party_detail, status, current_reviewer_id → users.id (nullable), created_at`
— `research_title`, `collection_method`, `target_start_date`/`target_end_date` now live on the
parent `research_applications` row (shared with the Ethics track) rather than duplicated here.

Relationships: `belongsTo research_application`, `hasMany documents` (via polymorphic), `hasMany status_history`, clearance is reached via `research_application.clearance_certificate`, not owned directly.

### 3.3 DPNDA (Module 2)

> **2026-07-02, revised:** Reconciled against `reqs/DPO EFORM 5 SAMPLE.pdf` and
> `2.1-dpnda-nda-template.md` §2.1.b — this table originally predated the `reqs/` reconciliation
> pass (`0.4-dpo-ethics-integration.md`) and modeled generic placement fields
> (`school_institution`, `grade_year_level`) that don't match Form 5's actual field set. Updated
> below.
>
> **2026-07-04:** `ojt_evaluation_reports` is now implemented (schema below reflects the real
> migration, not the original design-only proposal). `nda_templates` was put to the requester
> directly and declined — the current hardcoded NDA Blade template is fine, not a placeholder
> pending this table (`docs/HANDOFF.md` Part G).

**`placements`** — the first-class entity `5.3` recommended instead of deriving everything from a signed PDF. Fields below match Form 5's actual questions.
`id, trainee_id → users.id, trainee_last_name, trainee_first_name, trainee_middle_initial, gender, age, enrolled_school, hours_needed, trainee_type (internal_ojt|external_ojt|community_service), department, level, course, section, address_house_no, address_street, address_barangay, address_city, department_assigned, pcc_supervisor, endorsed_by, start_date, end_date, coordinator_id → users.id, created_at`

`trainee_type` previously included `student_teacher` as a fourth value; retired 2026-07-06 —
DPO confirmed student teachers are not a category distinct from OJT, so they're recorded as
ordinary `internal_ojt`/`external_ojt` placements (`docs/CHANGELOG.md`).

**`dpnda_records`** (Form 5, OJT/Trainee NDA, DPO-POL-002)
`id, placement_id → placements.id, tracking_number (DPNDA-YYYY-NNNN), status (draft|sent_for_signing|trainee_signed|declined|coordinator_countersigned|completed), guardian_name (nullable, if minor), trainee_signature_id (nullable), trainee_signature_image (nullable, LONGTEXT base64 PNG — ADR-005), trainee_signed_at (nullable), coordinator_signature_id (nullable), coordinator_signature_image (nullable, LONGTEXT base64 PNG), coordinator_signed_at (nullable), decline_reason (nullable), created_at`

**`ojt_evaluation_reports`** (implemented — `docs/HANDOFF.md` Part E)
`id, placement_id → placements.id (unique — one evaluation report per placement), uploaded_by → users.id (Dept Coordinator), submitted_at, notes (nullable), created_at, updated_at`
— the uploaded file itself is stored via the polymorphic `documents` table (`documentable_type/id` pointing to this row), not a `document_id` FK on this table — same pattern every other module's uploads use. Existence of this table is what makes the `5.3` "departments without uploaded evaluation reports" report answerable: `LEFT JOIN placements not matched to ojt_evaluation_reports, grouped by department`.

**`nda_templates`** (declined, not built — `docs/HANDOFF.md` Part G)
`id, department_id (nullable = global), version_label, document_id → documents.id, is_active`
— kept here as a record of the proposal that was evaluated and turned down, not a pending item.

### 3.4 REMIS (Module 3, incl. Incident Reporting)

**`remis_applications`** (the Ethics track — 1:1 with the same `research_applications` row, `0.4`)
`id, research_application_id → research_applications.id, tracking_number (REC-YYYY-NNNN, unique), applicant_id → users.id, adviser_id → users.id (nullable), study_type, study_design, target_population, participant_count, inclusion_criteria, exclusion_criteria, vulnerable_population (bool), study_sites, funding_source, risks_to_participants, benefits, confidentiality_measures, consent_process, data_storage_plan, status, created_at`
— `study_title` and `target_start_date`/`target_end_date` come from the shared
`research_applications` row (same values the DPO track sees) rather than being duplicated.

**`endorsement_actions`** (FRS §IV — the chain the old draft was missing)
`id, remis_application_id, step (adviser|program_head|dean), endorser_id → users.id, action (approve|return|reject), remarks, signature_id, signature_image (nullable, LONGTEXT base64 PNG — ADR-005), acted_at`

**`risk_classifications`**
`id, remis_application_id, level (minimal|moderate|high), review_type (expedited|committee|full_board — derived from level), classified_by → users.id, classification_date, rationale`

**`review_assignments`**
`id, remis_application_id, reviewer_id → users.id, assigned_at, recommendation (approve|minor_revision|major_revision|disapprove, nullable until submitted), comments, submitted_at (nullable)`

**`decisions`**
`id, remis_application_id, outcome (approved|approved_with_conditions|deferred|disapproved), decided_by → users.id, decision_date, conditions (nullable), remarks, signature_id, signature_image (nullable, LONGTEXT base64 PNG — ADR-005)`
— originally proposed as a `signatories (json)` blob; built instead as `signature_id`/`signature_image` to match the same typed-name-plus-drawn-image shape every other signing action in the system uses (endorsements, DPNDA, NDA signatories), rather than a one-off structure just for this table.

**`progress_reports`** (`3.4`, FRS §XII)
`id, remis_application_id, status_of_study, participants_recruited, ethics_concerns, protocol_deviations, corrective_actions, submitted_at (nullable), reviewed_by → users.id (nullable)`
— no stored `due_date` column: the monthly monitoring cadence confirmed in Part G is computed on
read via `RemisMonitoringService::monitoringDueDate()` (last progress report, or monitoring
start, + 1 month), not persisted, since nothing else needs to query or index on it.

**`completion_reports`** (`3.4`, FRS §XIV)
`id, remis_application_id, completion_date, final_participant_count, compliance_statement, publication_status, data_storage_location, final_outcome (completed|discontinued|withdrawn), archived_at`

**`incidents`** (`3.5`, new module)
`id, remis_application_id, incident_type (participant_complaint|data_breach|confidentiality_breach|psychological_harm|protocol_violation|other), severity, incident_date, reported_by → users.id, description, immediate_actions, status (reported|under_investigation|corrective_action_in_progress|resolved|closed), assigned_to → users.id, corrective_action_required, corrective_action_due_date, corrective_action_status, verified_by → users.id (nullable), verified_at (nullable), created_at`

### 3.5 Entity-relationship summary

```
users ──< research_applications ──1:1── dpreq_applications (DPO track, 1.x)
                                  ├─1:1─ remis_applications (Ethics track, 3.x) ──< endorsement_actions
                                  │                                             ├─< risk_classifications
                                  │                                             ├─< review_assignments
                                  │                                             ├─< decisions
                                  │                                             ├─< progress_reports
                                  │                                             ├─< completion_reports
                                  │                                             └─< incidents ──> notifies dpo_staff (application-layer rule, not FK)
                                  ├─1:1─ clearance_certificates (dual-signed: dpo_signed_by + ethics_signed_by, see 0.4)
                                  └─1:1─ research_team_ndas (Form 2) ──< research_team_nda_signatories

users ──< placements >── dpnda_records (OJT/Trainee NDA, Form 5) ──< ojt_evaluation_reports

{dpreq_applications, remis_applications, incidents} ──polymorphic── documents, status_history, audit_log
```

This is the schema `knowledge-graph.json`'s `Entity` nodes map to 1:1 — the graph models the
*shape* of these relationships for cross-team navigation; this section is the field-level
source of truth. Note the `research_applications` parent is new (`0.4`) — DPREQ and REMIS are
tracks on one application, not two independent applications each with their own clearance.

---

## 4. API / Module Boundaries

**Pattern: modular monolith**, not microservices (justified in §6). One Laravel codebase, one
deployment unit, internal module boundaries enforced by directory structure + service
contracts, not network calls.

```
app/
  Modules/
    Dpreq/        ← owns dpreq_applications, research_team_ndas(+signatories); no other module
                     queries these tables directly
    Dpnda/        ← owns placements, dpnda_records, ojt_evaluation_reports, nda_templates
    Remis/        ← owns remis_applications, endorsement_actions, risk_classifications,
                     review_assignments, decisions, progress_reports, completion_reports
      Incident/    ← owns incidents; calls Shared\Notifications to notify DPO on breach types
  Shared/
    Auth/          ← users, roles, policies
    ResearchApplications/  ← owns research_applications (new, 0.4) — the single Form 1 intake;
                              Dpreq and Remis each create/read their own 1:1 track row, but the
                              shared fields (title, dates, respondents) live and are edited here
    Clearance/      ← owns clearance_certificates (now dual-signed, 0.4); exposes
                       `signAsDpo()`/`signAsEthics()`, only issues the PDF once both are set —
                       this is the module that enforces the "not accessible until both signed"
                       rule, so neither Dpreq nor Remis can accidentally release it unilaterally
    Documents/      ← documents table + storage abstraction
    Notifications/  ← notifications table + channel dispatch (in-app/email/SMS)
    AuditLog/       ← audit_log table, write-only service, subscribed to domain events
    Reporting/      ← read-only queries across module tables for 5.x reports
    Verification/   ← public endpoint(s) for QR/tracking-number lookups
```

**Rule:** a module may read another module's data only through that module's public service
interface (e.g. `Remis\IncidentService::notifyDpoIfBreach()`), never via direct Eloquent model
access across the boundary — except `Reporting`, which is explicitly allowed cross-module
read-only access since its entire job is aggregating across modules (`5.1` requires it).
`Dpreq` and `Remis` both depend on `Shared\ResearchApplications` and `Shared\Clearance` (new,
`0.4`) — this is intentional coupling to shared infrastructure, not to each other; `Dpreq` never
calls `Remis` directly or vice versa, they each only call the two new shared services.

### Example REST endpoints (illustrative, not exhaustive)
```
POST   /api/research-applications                  submit Form 1 — creates the shared record,
                                                     plus its 1:1 dpreq_applications and
                                                     remis_applications rows (0.4)
POST   /api/research-applications/{id}/team-nda/sign  a team member signs the Form 2 NDA
PATCH  /api/dpreq/applications/{id}/status          DPO screening/review/decision transitions
POST   /api/remis/applications/{id}/endorsements    Adviser/Program Head/Dean action
POST   /api/remis/applications/{id}/screening       Ethics Secretariat decision
POST   /api/remis/applications/{id}/risk            Ethics Reviewer classification
POST   /api/remis/applications/{id}/decision        Ethics Committee Chair decision
POST   /api/remis/applications/{id}/incidents        file an incident
POST   /api/clearance/{research_application_id}/sign-dpo      DPO Staff signs the DPO half
POST   /api/clearance/{research_application_id}/sign-ethics   Ethics Chair signs their half —
                                                     either endpoint triggers issuance once both
                                                     signatures exist (0.4)
POST   /api/dpnda/placements                        create OJT/trainee placement
POST   /api/dpnda/records/{id}/sign                  trainee/department-head signature (Form 5)
GET    /api/reports/{report-key}?filters=...         any of the 13 defined reports
GET    /verify/{tracking-number-or-qr-token}         PUBLIC, unauthenticated, read-only
```

If `8.0`'s Inertia-vs-SPA decision (resolved in `architecture.md`) lands on Inertia, these
become Inertia page responses instead of pure JSON, but the module/service boundary above is
unaffected either way — that decision only changes how the frontend receives module data, not
who owns it.

---

## 5. Deep Dive

### Caching
Given the scale (§1), caching is *not* a load-bearing concern early on. Where it matters:
- Report queries (`5.x`) with heavy aggregation (e.g. Annual Ethics Report) are cache candidates
  (short TTL, e.g. 15 min) once report generation time is measured and found to matter — not a
  day-one requirement.
- Dashboard widgets (`4.3`) can be cached per-user for a few seconds to avoid recomputation on
  rapid navigation.

### Queue / event design
Everything that shouldn't block the requester's HTTP response goes through Laravel Queues
(database driver is sufficient at this scale, per `8.0`; Redis only if queue volume grows):
- Notification dispatch (in-app + email, `4.3`)
- PDF generation (clearance certificates, signed NDAs, reports)
- QR code generation for clearance certificates
- Incident breach-type notification to DPO (`3.5`) — queued so a slow email provider never
  delays the incident-filing response to the reporter

Domain events (Laravel events, in-process — not a separate message bus, unnecessary at this
scale): `ApplicationStatusChanged`, `DocumentUploaded`, `SignatureApplied`,
`IncidentFiled`. `AuditLog` and `Notifications` are both event listeners, not called directly
from controllers — this is what keeps "every module action logs to audit trail" (`4.4`) true
without every controller remembering to call it manually.

### Error handling / retry
- Queued jobs (PDF gen, notifications) use Laravel's built-in retry-with-backoff; failed jobs
  land in a `failed_jobs` table with alerting (not silent failure — a failed clearance PDF
  generation is a real incident, not a log line).
- Signature capture and file uploads validate synchronously (fail fast, clear error to user);
  everything downstream of a successful submission is queued and retried.
- Public verification endpoint fails closed: an unrecognized token returns "not found," never a
  stack trace or partial data.

---

## 6. Trade-off Analysis

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Modular monolith vs. microservices | Modular monolith | Per-module microservices | Institutional scale (§1) doesn't need independent scaling per module; a small team operating 3 deployable services instead of 1 is pure overhead here. Revisit only if one module's load genuinely diverges from the others (unlikely for DPO/ORD volumes). |
| Polymorphic shared tables (`documents`, `status_history`, `audit_log`) vs. per-module tables | Polymorphic/shared | Each module owns its own documents/audit tables | `5.x` reporting and `4.4`'s unified audit trail both need to query "all documents" / "all status changes" / "all audit events" across modules. Per-module tables would need a UNION at query time for every cross-module report; shared tables make that free. Trade-off: slightly less module isolation (acceptable, since these are infrastructure concerns, not business-logic ones). |
| RDBMS for reporting vs. separate analytics store | RDBMS (same DB) | Data warehouse / OLAP store | Report volume and complexity (13 reports, institutional data volumes) don't justify a second system to operate and keep in sync. Revisit if Annual Ethics Report-style aggregations start timing out against the OLTP schema. |
| Queue-backed side effects vs. synchronous | Queued | Synchronous (block until email/PDF done) | PDF rendering and email delivery are the two slowest, most failure-prone steps in every workflow; blocking the requester on them turns a third-party outage into a user-facing outage. |
| Tracking number as human-facing ID vs. surrogate key only | Both — `tracking_number` (business key, FRS-mandated format) + `id` (internal PK) | Expose `id` directly | FRS explicitly specifies `REC-YYYY-NNNN` as a user-facing identifier (§V); using it as the primary key would make yearly-reset numbering awkward with standard auto-increment PKs, so it's a unique indexed column, not the PK. |

## What to revisit as the system grows
- **Object storage:** local disk → S3-compatible, once `7.0`'s hosting decision lands (already
  designed for via Laravel Filesystem abstraction, per `8.0`).
- **Read replica** for the `Reporting` module if report queries start contending with
  transactional writes during OJT-intake bursts.
- **SSO integration** (`8.0` open question) — the `users` table already has a nullable
  `sso_subject_id` so this doesn't require a schema migration to add later.
- **Splitting `Remis` into its own service** only if incident/monitoring volume grows enough
  that its load profile genuinely diverges from DPREQ/DPNDA — not expected at PCC's scale, but
  the module boundary in §4 is drawn so that split wouldn't require a rewrite if it ever
  happens.
