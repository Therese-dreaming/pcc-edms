# PCC-EDMS — Workflow Narratives

A plain-English, chronological walkthrough of what actually happens in this system, end to end,
for each thing a person can submit. This is a companion to the numbered spec files (`1.x`–`3.x`),
not a replacement for them — those describe *the rules*; this describes *the story*. Every
status name, role name, and tracking-number format below is taken directly from the code
(`app/Modules/*/Models/*.php`'s `LEGAL_TRANSITIONS`, the matching `*WorkflowService`, and the
policies that gate each action), not just the docs, so it stays accurate if the two ever drift.

## Before any of this: getting an account

1. Someone registers at `/register` (name, email, password). The account is created with
   `role_id = null` and `account_status = pending_validation`, and is flagged
   `self_registered = true` — the account is a shell until it proves it owns the email address.
2. A verification email goes out. Clicking the link fires Laravel's `Verified` event, which a
   listener (`ActivateUserOnEmailVerification`) turns straight into `account_status = active` — no
   admin step in between.
3. Because the account still has no role, the very next authenticated page load (any page —
   there's a global middleware checking this on every request, not just the first one) redirects
   to `/select-role`: four options, **Internal Researcher, External Researcher, OJT Internal, OJT
   External**. Picking one sets `role_id` and the account can finally do something.
4. Every *other* role — Department Coordinator, DPO Staff, Adviser, Program Head,
   Dean, Ethics Secretariat, Ethics Reviewer, Ethics Committee Chair, System Administrator — is
   never self-service. An admin creates or edits the account (Admin → User Management) and picks
   the role directly; that account is never `self_registered`, so it skips `/select-role`
   entirely even if left role-less on purpose.

With a role in hand, what a person can *submit* depends entirely on which one they picked.

---

## DPREQ + REMIS — one form, two tracks that converge

This is the one every researcher touches, and it's really **one submission that becomes two
parallel records**, not two separate things a researcher fills out twice.

### 1. Submission (Form 1)

A researcher (any role except `dpo_staff` — an "applicant" role like Internal/
External Researcher) fills out one form covering both the data-privacy questions (DPO track) and
the study-design/ethics questions (Ethics track). Submitting it, in one database transaction,
creates:

- A shared `research_application` row (the parent record both tracks hang off of).
- A **`DpreqApplication`**, tracking number `DPREQ-2026-NNNN`, status `draft` → immediately
  `submitted`.
- A **`RemisApplication`**, tracking number `REC-2026-NNNN`, status `draft_submitted` →
  immediately `under_endorsement` (endorsement step set to `adviser`).
- A **Research Team NDA** (Form 2, tracking `RTNDA-2026-NNNN`) with the submitting researcher
  pre-filled as the "leader" signatory, status `pending_signatures`. This is *not* the same thing
  as DPNDA (see below) — it's a per-application NDA for the research team itself, and it has to
  reach `completed` before the DPO track can be approved.

Notifications fire immediately: the applicant and DPO Staff both hear about the DPREQ submission;
the applicant and the Adviser both hear about the REMIS submission needing endorsement.

From here the two tracks run independently and mostly in parallel.

### 2a. The DPO track (DPREQ)

```
draft → submitted → screening → under_review → endorsed → approved → clearance_issued
                        ↓                          ↓
                    returned                    rejected
                        ↓
                    submitted (resubmit)
```

- **DPO Staff** starts screening, and either **returns it** to the applicant with comments
  (→ `returned`, applicant notified, can resubmit → back to `submitted`) or **passes screening**
  (→ `under_review`).
- **DPO Staff** endorses it, moving it to final sign-off (→ `endorsed`), or can **reject** it
  outright at this stage (→ `rejected`, terminal).
- **DPO Staff** approves it — the same role that screened and endorsed it (DPO Approver was
  retired as a separate role, 2026-07-06) — but this step is gated: approval is blocked with an
  error until the Research Team NDA (above) is fully signed. Once it goes through (→ `approved`),
  DPO Staff's signature is recorded against the shared clearance certificate.

### 2b. The Ethics track (REMIS) — the academic endorsement chain first

```
under_endorsement → for_screening → for_review → approved / approved_with_conditions
      ↓  (chain: adviser → program_head → dean)         ↓                  ↓
  for_revision (return) or disapproved (reject)      deferred          disapproved
```

- **Adviser → Program Head → Dean**, in that order, each either approve (advances to the next
  endorser, or to `for_screening` once the Dean signs off), **return** it (→ `for_revision`,
  researcher fixes it and resubmits to wherever it left off), or **reject** it (→ `disapproved`,
  terminal).
- **Ethics Secretariat** does administrative screening once endorsement clears: "complete"
  (→ `for_review`) or "incomplete"/"returned for compliance" (→ `for_revision`).
- **Ethics Committee Chair** assigns one or more **Ethics Reviewers** to the study.
- Each assigned **Ethics Reviewer** independently classifies risk (minimal/moderate/high) and
  submits a recommendation on their own review-assignment row — this is a panel, not a single
  reviewer, and every assigned reviewer must submit before anyone can decide.
- Once every reviewer has submitted, the **Ethics Committee Chair** issues the formal decision:
  `approved`, `approved_with_conditions`, `deferred` (→ back to `for_review` later), or
  `disapproved` (terminal). Approval or approval-with-conditions signs the Ethics side of the
  clearance certificate.

### 3. Where DPO approval and Ethics decision converge: the joint clearance

Both signature events above call into the same `ClearanceService`, independently of each other —
neither track knows or cares whether the other has finished. A single `ClearanceCertificate` row
per `research_application` accumulates a `dpo_signed_at` and an `ethics_signed_at`. **Only once
both are present** does the certificate actually issue: `issued_at`/`valid_until`/a QR `qr_token`
get set, a joint clearance PDF is generated, the applicant is notified once ("your joint clearance
is ready to download"), and:

- The **DPREQ** application transitions `approved → clearance_issued` (terminal — DPREQ's story
  ends here).
- The **REMIS** application transitions to `clearance_issued`, and then — automatically, no
  separate action — straight into `monitoring`, because that's the study actually starting.

If one track finishes first (say DPO approves before Ethics decides), the certificate just sits
half-signed until the other side catches up. There's no fixed order.

### 4. Monitoring, while the study is running

While a REMIS application sits in `monitoring`:

- The researcher (only the study's own applicant) files **progress reports** roughly monthly
  (docs/3.4's assumed cadence, confirmed with the requester) — status of study, participants
  recruited, any ethics concerns/deviations. Each assigned reviewer is notified and can log a
  compliance verdict (compliant / minor issues / major issues / non-compliant) against it, purely
  informational — it never blocks anything.
- **Incidents** (see below) can be filed against the study at any point during monitoring,
  independent of this report cadence.
- Eventually the researcher submits a **Final Ethics Completion Report** (completion date, final
  participant count, compliance statement, publication status, data storage location). Submitting
  it *is* acceptance — in the same action the study moves `monitoring → closed → archived` and
  everyone (researcher + all assigned reviewers) is notified it's closed and archived.

---

## Incident Reporting — independent of the status lifecycle above

An incident can be filed by the study's own researcher, or by Ethics Secretariat/Reviewer/Chair,
against any REMIS application at any point — it deliberately doesn't pause or interact with
`monitoring`'s own status.

```
reported → under_investigation → corrective_action_in_progress → resolved → closed
                                          (or straight to resolved)
```

1. **Filing**: type (participant complaint / data breach / confidentiality breach / psychological
   harm / protocol violation / other), severity (low/medium/high/critical), description. Filing
   always notifies the Ethics Committee Chair and Ethics Secretariat. If the type is **data breach
   or confidentiality breach specifically**, DPO Staff is *also* notified directly — this is the
   one concrete place the Incident module reaches back across to the DPO side.
2. **Ethics Secretariat or Ethics Committee Chair** (or whoever it's assigned to) can assign it to
   someone, add timestamped investigation notes, and move it through
   `under_investigation → corrective_action_in_progress → resolved → closed`.
3. Separately, a **corrective action** can be attached (required action + due date), then marked
   completed, then verified by a manager — this status (`in_progress → completed → verified`) is
   independent of the incident's own `reported`/`resolved`/`closed` status above.

---

## DPNDA — the OJT/Trainee NDA (Form 5)

This is a genuinely separate workflow from DPREQ/REMIS above — it has nothing to do with a
research study. It exists for **On-the-Job trainees and student teachers who need to sign a
non-disclosure agreement before starting a placement**, and it's the **Department Coordinator**
who starts it, not the trainee.

```
draft → sent_for_signing → trainee_signed → coordinator_countersigned → completed
                  ↓
              declined
```

1. **Department Coordinator** creates a placement (trainee's account email, department assigned,
   supervisor, duration) — this creates the `Placement` and a `DpndaRecord`, tracking number
   `DPNDA-2026-NNNN`, status `draft`.
2. Coordinator **sends it for signing** (→ `sent_for_signing`); the trainee is notified.
3. **Trainee** either **signs** (typed name + signature capture) → `trainee_signed`, notifying the
   coordinator that a countersignature is needed, or **declines** with a reason → `declined`
   (terminal), notifying both the coordinator and DPO Staff.
4. **Coordinator countersigns** → the record moves through `coordinator_countersigned` straight
   into `completed` in the same action (no separate "mark complete" step) — a PDF of the fully
   executed NDA is generated, and the trainee, coordinator, and DPO Staff are all notified it's
   done.
5. Once `completed`, the coordinator can later upload an **OJT Evaluation Report** for that
   placement — a document, not a status transition.

---

## Public Clearance Verification

Anyone — no login required — can go to `/verify`, enter a `DPREQ-` or `REC-` tracking number (or
scan a certificate's QR code, same lookup), and get back: valid or expired, both tracking numbers,
issue date, and expiry date. Nothing else — no research title, no applicant name, no study
details. This only ever reads from the `ClearanceCertificate` created in the convergence step
above; it can't be reached before both signatures exist.

---

## Quick reference: who can do what

| Action | Who |
|---|---|
| Submit Form 1 (starts DPREQ + REMIS) | Any applicant role (not DPO Staff) |
| Screen / return / endorse a DPREQ | DPO Staff |
| Approve a DPREQ | DPO Staff |
| Reject a DPREQ | DPO Staff |
| Endorse a REMIS application | Adviser → Program Head → Dean, in order |
| Screen a REMIS application | Ethics Secretariat |
| Assign REMIS reviewers | Ethics Committee Chair |
| Classify risk + recommend | The assigned Ethics Reviewer(s) |
| Decide a REMIS application | Ethics Committee Chair |
| Submit progress/completion reports | The study's own applicant |
| File an incident | The study's applicant, or Ethics Secretariat/Reviewer/Chair |
| Manage an incident (assign, notes, transition) | Ethics Secretariat, Ethics Committee Chair, or whoever it's assigned to |
| Create a DPNDA placement | Department Coordinator |
| Sign / decline a DPNDA | The named trainee |
| Countersign a DPNDA | The placement's Department Coordinator |
| Assign any role, manage any account | System Administrator |
