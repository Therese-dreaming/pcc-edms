# PCC-EDMS — Workflow Narratives

A plain-English, chronological walkthrough of what actually happens in this system, end to end,
for each thing a person can submit. This is a companion to the numbered spec files (`1.x`–`3.x`),
not a replacement for them — those describe *the rules*; this describes *the story*. Every
status name, role name, and tracking-number format below is taken directly from the code
(`app/Modules/*/Models/*.php`'s `LEGAL_TRANSITIONS`, the matching `*WorkflowService`, and the
policies that gate each action), not just the docs, so it stays accurate if the two ever drift.

## Before any of this: getting an account

> **Rewritten 2026-07-25.** `/register` no longer exists — open self-registration was removed, then
> replaced with adviser-run class enrolment so onboarding a 50-student class doesn't mean typing 50
> people in by hand. See `docs/4.1`.

**The usual way — a class cohort (most researchers arrive this way):**

1. An **Adviser** creates a class once at `/adviser/cohorts` (name, department/level/course/section,
   which applicant role joiners get, and optional limits: an expiry date, an expected headcount, and
   allowed email domains). The system mints a 10-character **join code** and shows it with a
   copyable link and a QR code to project in class.
2. The adviser shares that one code/link/QR. **Each student enrols themselves** at the public
   `/join/{code}`, entering their own name, email, student number and chosen password.
3. Enrolment is refused with a specific explanation if the class is closed, past its expiry, at its
   headcount cap, or if the email is outside the allowed domains — and nothing is created in those
   cases. The adviser can close the class or regenerate the code at any time, which instantly
   invalidates every copy of the old link.
4. The account is created with `account_status = pending_validation` and **the role from the cohort**,
   so it never sees `/select-role`. A verification email goes out; clicking it fires Laravel's
   `Verified` event, which `ActivateUserOnEmailVerification` turns straight into
   `account_status = active`. Until then the `verified` middleware holds them at `/verify-email`.
5. The student appears on the adviser's roster as **Enrolled**. The adviser can remove them from the
   class, which never deletes an account that may already own submissions.

**The fallback — adviser adds someone directly:** for students who can't self-enrol, the adviser adds
them from the cohort page by name + email (one at a time, or by pasting a list straight from a
spreadsheet). Each gets a single-use, 14-day invitation link (`/join/invitation/{token}`) to set
their own password. **No account exists until they accept**, so no-shows leave no shell accounts.

**One-offs and staff:** for a single applicant who isn't part of a class, the adviser adds them via a
cohort's manual add-member (which sends the same invitation link) — the standalone one-applicant form
was retired 2026-07-25 once cohorts covered it. Every *other* role — Department Coordinator, DPO
Staff, Adviser, Program Head, Dean, Ethics Secretariat, Ethics Reviewer, Ethics Committee Chair,
System Administrator — is admin-created only (Admin → User Management, single or bulk CSV import).
Those accounts get the role assigned directly and a password-setup email.

With a role in hand, what a person can *submit* depends entirely on which one they have.

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

### 2a. The DPO track (DPREQ) — collapsed to Review → Approve (2026-07-25)

```
draft → submitted → under_review → approved → clearance_issued
                        ↓
                    returned  ──→ submitted (resubmit)   (and under_review → rejected)
```

- **DPO Staff** takes the application **under review** (one action; the old separate `screening` and
  `endorsed` hops were retired 2026-07-25). From there they can **return it** to the applicant with
  comments (→ `returned`, applicant notified, can resubmit → back to `submitted`), **request an
  additional document** (a mandatory revision request that blocks approval until supplied — item 7),
  or **reject** it (→ `rejected`, terminal).
- **DPO Staff** approves it (→ `approved`) — gated until the Research Team NDA is fully signed **and**
  no required revision item is outstanding. Approval immediately issues the Data Privacy Clearance
  **independently** of the Ethics track (2026-07-25) — it is no longer withheld for a joint signature.

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

### 3. Two independent clearances (updated 2026-07-25)

> **Changed 2026-07-25:** clearances are now issued **independently per department**, not as one
> joint dual-signed certificate. See `docs/0.4` for the full model and the retired joint version.

Both signature events above call into the same `ClearanceService`, independently of each other —
neither track knows or cares whether the other has finished. A single `ClearanceCertificate` row
per `research_application` holds **two independent issuances**: the DPO side (`dpreq_*`) and the
Ethics side (`remis_*`). Each side issues the moment its own signature lands — no waiting:

- **DPO approval** immediately sets a fresh **Control Number** (`DPREQ-2026-NNNNNN`),
  `dpreq_issued_at`/`dpreq_valid_until`/`dpreq_qr_token`, generates the Data Privacy Clearance
  PDF, notifies the applicant ("your DPO clearance is ready to download"), and transitions the
  **DPREQ** application `approved → clearance_issued` (terminal — DPREQ's story ends here).
- **An approving Ethics decision** does the same on the `remis_*` columns (Control Number
  `REMIS-2026-NNNNNN`), generates the Research Ethics Clearance PDF, notifies the applicant, and
  transitions the **REMIS** application to `clearance_issued` → then automatically straight into
  `monitoring`, because that's the study actually starting.

The shared `research_applications.overall_status` reads `partially_cleared` while only one side
has issued, and `clearance_issued` once both have. There's no fixed order and no cross-dependency:
either side can clear on its own even if the other is still in review, returned, or rejected.
Each Control Number is unique, never reused, and verifies independently at `/verify`.

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

Anyone — no login required — can go to `/verify`, enter a certificate **Control Number**
(`DPREQ-2026-NNNNNN` or `REMIS-2026-NNNNNN`) or scan a certificate's QR code (same lookup), and
get back: the clearance type (Data Privacy *or* Research Ethics), whether it's valid or expired,
its Control Number, issue date, and expiry date. Nothing else — no research title, no applicant
name, no study details. Since clearances issue independently (updated 2026-07-25), each Control
Number resolves to **exactly one track** and reports only that track's validity — the DPO and
Ethics clearances of the same study may have different issue/expiry dates, or one may exist while
the other hasn't issued yet. The lookup only ever returns a certificate whose own side has issued.

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
