# Testing Strategy — PCC-EDMS

Produced via `/engineering:testing-strategy`. Scoped against the data model and module
boundaries in `system-design.md` and the stack in `architecture.md` (Pest/PHPUnit backend,
Vitest + React Testing Library frontend, per `8.0`).

## Guiding principle

This system's risk profile isn't performance — it's **correctness of who-can-do-what, and
proof of what happened.** Given DPO's ownership of personal data and REC's ownership of ethics
sensitive research, the two things that must never silently fail are: (1) an unauthorized role
performing a state-changing action, and (2) an audit trail entry not being written for a
state-changing action. Coverage effort below is weighted accordingly, not evenly.

## Testing Pyramid (target shape)

```
        /  E2E (Playwright/Dusk) \      ~15 flows — one per critical path per module
       /  Integration (Pest)      \     ~40% of backend test volume — module boundaries, workflows
      /   Unit (Pest + Vitest)     \    ~55% of test volume — business logic, validation, components
```

Given this is a workflow/forms system, not a computation-heavy one, integration tests carry
more of the confidence burden than in a typical pyramid — a unit test on a status-transition
method in isolation proves less than an integration test that the whole endorsement chain
actually advances correctly.

---

## Strategy by Component Type

### Workflow / status transitions (DPREQ `1.2`, DPNDA `2.2`, REMIS `3.3`)
**Type:** Integration tests (Pest), one suite per module's `status_history`-driven lifecycle.
**Why integration, not unit:** the value is in proving the *whole chain* behaves correctly
end-to-end (e.g. REMIS: submit → all 3 endorsement steps → screening → risk classification →
review → decision → clearance issued), not that any single transition function works alone.
**Cover:**
- Every legal transition in the diagrams in `1.2`/`2.2`/`3.3` succeeds and writes a
  `status_history` row with correct `from_status`/`to_status`/`changed_by`.
- Every illegal transition (e.g. attempting `For Review` → `Clearance Issued` skipping
  `Approved`) is rejected with a clear error, not silently allowed.
- Branch paths: `For Revision` → resubmit → re-enters `For Review` correctly (not restarting
  the whole endorsement chain — confirm this is the intended behavior with ORD, flag as a test
  case that encodes an assumption).
- REMIS's four decision outcomes (`Approved`/`Approved with Conditions`/`Deferred`/
  `Disapproved`) each route correctly — this is the single highest-value new test suite, since
  the old spec only had two outcomes and this pass added two more (`CHANGELOG.md`).

### Authorization / role boundaries (`0.2`, `4.1`)
**Type:** Unit tests on Laravel Policies (fast, one per capability-matrix cell) + integration
tests confirming policies are actually wired to every relevant endpoint.
**Cover:**
- Every ✔ cell in `0.2`'s capability matrix has a passing test that the role *can* perform the
  action.
- Every non-✔ cell has a passing test that the role *cannot* — this is the more important half;
  a missing-deny test is a security gap, not just a coverage gap.
- Specifically: an Adviser cannot skip ahead and act as Program Head; a REMIS Ethics Reviewer
  cannot issue a final Decision (that's Ethics Committee Chair only); DPO Staff cannot approve
  a REMIS application and vice versa (module isolation, `system-design.md` §4).
- Unauthorized attempts return a clear access-denied response **and** write an audit event
  (`4.4` requires unauthorized actions to be logged, not just blocked).

### Audit trail (`4.4`, FRS §XVI)
**Type:** Integration tests, treated as a cross-cutting concern tested against *every* module's
write paths, not a standalone module.
**Cover:**
- Every state-changing action across all modules produces exactly one corresponding
  `audit_log` row (not zero, not duplicated).
- `audit_log` rows are provably immutable at the application layer — a test that attempts an
  update/delete on an existing audit row via any exposed path must fail.
- Filtering (by date range, module, user, record ID, event type per `4.4`) returns correct
  results — test with overlapping/edge-case filters, not just the happy path.

### Documents (`4.2`)
**Type:** Integration tests.
**Cover:**
- Re-uploading a document creates a new version and does not overwrite/delete the prior version
  (`4.2`'s explicit requirement).
- Soft-delete: a "deleted" document is hidden from normal listing but still retrievable for
  audit purposes; hard-delete is never reachable by a non-admin role (test this as a negative
  case, same reasoning as authorization above).
- File type/size validation matches the accepted-types tables in `1.3`/`2.1`/`3.1` exactly —
  these tables differ per document type, so a generic "any PDF works" test isn't sufficient
  coverage; enumerate per document type.

### E-signature (`4.3`, ADR-005 in `architecture.md`)
**Type:** Integration tests.
**Cover:**
- A completed signature event stores signer, role, timestamp, IP, and exact document version
  signed (per `4.3`'s explicit field list) — assert all five, not just "a signature exists."
- Signed documents become read-only; any subsequent edit attempt requires a new
  version/amendment record rather than mutating the signed one.
- Multi-signer flows (DPNDA: trainee → coordinator → optional DPO countersignature) enforce
  correct ordering and don't allow a later signer to sign before an earlier one has.

### Incident reporting and cross-module notification (`3.5` — new module)
**Type:** Integration test, explicitly, because this is the newest and least-validated part of
the spec (added this pass, not FRS-battle-tested elsewhere in the doc set).
**Cover:**
- Filing an incident with `incidentType = Data Breach` or `Confidentiality Breach` triggers a
  notification to DPO Staff (the specific cross-module edge in `knowledge-graph.json`) — this
  is the one test case that directly validates the DPO↔REMIS integration point the whole
  realignment pass was built around.
- Filing any other incident type does **not** notify DPO Staff (negative case — proves the
  condition is scoped correctly, not "notify DPO on everything").
- Corrective action tracking fields transition correctly (Not Started → In Progress →
  Completed → Verified) and `verified_by`/`verified_at` are only set on the Verified
  transition.

### Reports (`5.1`–`5.3`)
**Type:** Integration tests, data-driven (seed known fixture data, assert exact report output).
**Cover:** all 13 report definitions, each with at least one test that seeds representative
records across multiple departments/statuses/date ranges and asserts the aggregation is
correct — these are exactly the kind of GROUP BY/cross-tab logic that's easy to get subtly
wrong (off-by-one date ranges, wrong join direction on the `placements`↔`ojt_evaluation_reports`
LEFT JOIN in `system-design.md` §3.3, etc.).
**Specifically flag:** the "departments without uploaded evaluation reports" report (`5.3`) as
worth an explicit test, since it depends on a LEFT JOIN returning the *absence* of a row
correctly — a common source of report bugs.

### Public verification portal (`3.1`, `1.1`)
**Type:** Integration + a security-focused test set, since this is the one unauthenticated
surface in the whole system.
**Cover:**
- Valid tracking number/QR token returns clearance validity status only — no personal data
  beyond what `3.1` specifies as portal-visible.
- Invalid/expired/revoked token returns a generic "not found/invalid" response — never a stack
  trace, never information that would let someone enumerate valid tracking numbers by
  observing different error messages for "wrong format" vs. "not found."
- Rate-limit this endpoint (not explicitly specified anywhere in the docs — flagging as a gap,
  see below).

### Frontend (React/Inertia)
**Type:** Component tests (Vitest + RTL) for forms and dashboards; a small number of E2E flows
for the critical paths only (see below) — not E2E for every screen.
**Cover:** form validation matches backend validation rules exactly (client/server parity, to
avoid a form that "looks" valid but is rejected server-side); role-conditional UI (a
Researcher never sees an Ethics Reviewer's review form, even via URL manipulation — backend
authorization is the real gate, but the UI shouldn't offer actions it knows will be denied).

---

## Coverage Targets

| Area | Target | Rationale |
|---|---|---|
| Policies / authorization | 100% of capability-matrix cells | Security boundary — no exceptions |
| Workflow transitions | 100% of legal + illegal transitions per module | Correctness of the core product |
| Audit log write coverage | 100% of state-changing endpoints | Compliance requirement, not optional |
| Report definitions | 100% of the 13 reports, ≥1 data-driven test each | Reports are the DPO/ORD-facing deliverable |
| General backend business logic | 80%+ line coverage | Standard bar; not the primary confidence signal here |
| Frontend components | Critical forms + dashboards only, not 100% | E2E/integration carry more weight than exhaustive component coverage for this kind of app |

## Example Test Cases (illustrative)

```
[Pest] test('ethics committee chair can issue Approved with Conditions decision')
[Pest] test('ethics reviewer cannot issue a final decision')
[Pest] test('adviser rejection at endorsement step ends application without reaching secretariat')
[Pest] test('filing a Data Breach incident queues a notification job addressed to DPO Staff role')
[Pest] test('filing a Participant Complaint incident does NOT notify DPO Staff')
[Pest] test('re-uploading research proposal creates version 2, version 1 remains retrievable')
[Pest] test('unauthorized status transition attempt writes an audit_log row with event_type=access_denied')
[Pest] test('reviewer workload report counts only active (non-terminal-status) assignments')
[Pest] test('verification portal returns generic 404 body for both malformed and unknown tracking numbers')
[Vitest] test('DPREQ form blocks submission when a Mandatory attachment is missing, matching 1.1 Section E')
```

## Gaps Identified (not yet specified anywhere in `0.x`–`9.x` — flag for confirmation)

- **Load/volume targets:** `system-design.md` §1 notes application volume is an ASSUMPTION;
  without confirmed numbers, load testing has no target to test against. Needs DPO/ORD
  estimates before a load-test plan can be written.
- **Rate limiting** on the public verification portal is not specified anywhere in the source
  docs — recommend adding this to `4.3` or a new security-requirements note, since it's the
  one endpoint with no auth to fall back on.
- **Concurrent-edit handling:** none of the workflow docs specify what happens if two endorsers
  or reviewers act on the same application near-simultaneously (e.g. Program Head and Dean both
  acting within the same second). Recommend optimistic locking on `status` columns and a test
  for the resulting conflict response.
- **Data retention enforcement:** `1.3`'s retention periods are ASSUMPTION placeholders; there's
  no automated purge/archive job specified to test once real periods are confirmed.
