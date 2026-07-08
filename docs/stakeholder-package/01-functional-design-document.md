# Functional Design Document (FDD) — PCC-EDMS

**Status:** Draft for stakeholder review and sign-off.
**Sources:** `docs/0.1`–`docs/5.3`, `docs/REMIS_Functional_Requirements_Specification.md`.
Every requirement below is traceable to one of those files; items not sourced from a confirmed
document are explicitly marked **[ASSUMPTION]** and are also tracked in
[`05-open-questions-and-assumptions.md`](05-open-questions-and-assumptions.md).

---

## 1. Scope

### 1.1 In scope
| # | Capability | Serves |
|---|---|---|
| a | Online application for DPO and REC clearances | Both offices |
| b | Online submission of supporting requirements/documents | Both offices |
| c | Online signing of NDAs for researchers, OJTs, and trainees | DPO |
| d | Digital, searchable document repository | Both offices |
| e | Workflow automation (routing, notifications, status tracking) | Both offices |
| f | Report generation | Both offices |

### 1.2 Out of scope **[ASSUMPTION — confirm]**
- Financial/budget management for research grants
- HR/payroll systems for OJTs
- Learning management (LMS) functions for student teachers
- Public-facing research publication/portal features

### 1.3 Success criteria **[ASSUMPTION — confirm]**
- 100% of DPREQ and REMIS applications processed without paper forms
- All OJT/community-service NDAs signed and stored electronically
- All defined reports (§6) generatable on demand, without manual data compilation

---

## 2. The core model: one intake, two tracks, one joint output

A research application has **one intake, two internal review tracks, one joint output**:

- A researcher submits **one form** ("Form 1").
- That single submission creates two parallel, independently-run records: a **DPO track**
  (data-privacy review) and an **Ethics track** (REMIS — research ethics review).
- Both tracks converge on a single **joint clearance certificate**, co-signed by the DPO and the
  Research Ethics Head. The certificate is not released to the applicant until **both**
  signatures exist — this is a hard system rule, not a documentation nuance.
- OJT/Trainee NDAs (a separate instrument, "Form 5") are unrelated to research applications
  entirely — they belong to placements, not studies.

---

## 3. Actors and roles

| Role | Office | Description |
|---|---|---|
| Researcher (Internal / External) | Applicant | Submits research applications |
| OJT / Trainee (Internal / External) | Applicant | Placed for on-the-job training (includes student teachers, who are not a separate category) |
| Department/Office Coordinator | Host unit | Starts and countersigns OJT/trainee NDAs |
| DPO Staff | DPO | Sole DPO-side role — screens, reviews, endorses, and approves DPO-track applications end to end |
| Adviser → Program Head → Dean | Academic | Sequential academic endorsement of ethics applications |
| Ethics Secretariat | ORD/REC | Administrative screening, tracking number assignment |
| Ethics Reviewer | ORD/REC | Risk classification, substantive ethics review |
| Ethics Committee Chair | ORD/REC | Assigns reviewers, issues final ethics decision |
| System Administrator | IT | User/role management, system configuration |

DPO-side role definitions are confirmed with DPO (2026-07-06); REMIS-side roles are sourced
directly from the REMIS Functional Requirements Specification. Full capability matrix:
[`03-role-raci-matrix.md`](03-role-raci-matrix.md).

---

## 4. Module requirements

### 4.1 Module 1 — DPREQ (Data Privacy Clearance, DPO)

**Purpose:** review and clear research/data-collection activity for data-privacy compliance
before it begins.

The system shall:
1. Present one combined application form (Form 1) covering both data-privacy and ethics
   questions, submitted once per research application.
2. Require applicant declaration and signature before submission.
3. Require upload of: approved respondent-head letter (or pending request), research proposal,
   research instrument, adviser's endorsement letter, and (if minors are respondents) parental
   consent materials.
4. Route submitted applications to DPO Staff for completeness screening.
5. Allow DPO Staff to return an application with mandatory comments, or advance it to review.
6. Allow DPO Staff to endorse a reviewed application for final approval, or reject it with reason.
7. Block DPO Staff's final approval until the associated Research Team NDA (§4.2) is fully executed.
8. Notify the applicant and DPO Staff at submission, return, endorsement, approval/rejection, and
   clearance issuance.

### 4.2 Module 2 — DPNDA (Non-Disclosure Agreements, DPO)

Two distinct NDA instruments:

**a) Research Team NDA (Form 2)** — signed by the research team lead and every co-researcher.
The system shall:
1. Auto-create a Research Team NDA record when Form 1 is submitted, pre-filled with the
   submitting researcher as team lead.
2. Require every listed team member to sign before the record is marked complete.
3. Block DPO-track approval (§4.1) until this record is complete.

**b) OJT/Trainee NDA (Form 5)** — a separate workflow, unrelated to research applications.
The system shall:
1. Allow a Department Coordinator to create a placement record and associated NDA (trainee name,
   department, supervisor, duration).
2. Notify the named trainee to review and sign, or decline with a reason.
3. Require Department Coordinator countersignature after the trainee signs, completing the NDA in
   the same action.
4. Generate a signed PDF of the completed NDA.
5. Allow the coordinator to later upload an OJT Evaluation Report against a completed placement.

### 4.3 Module 3 — REMIS (Research Ethics Review, ORD/REC)

**Purpose:** manage the ethics review lifecycle for a research application, from academic
endorsement through monitoring and archiving.

The system shall:
1. Route a submitted application through sequential academic endorsement: Adviser → Program Head
   → Dean. Each endorser may approve (advance), return with comments, or reject (terminal).
2. On Dean approval, route to Ethics Secretariat for administrative completeness screening
   against a defined checklist; automatically generate a deficiency notice on an incomplete or
   returned-for-compliance result.
3. Support risk classification (Minimal / Moderate / High) by an Ethics Reviewer, deriving the
   review track (Expedited / Committee / Full Board).
4. Allow the Ethics Committee Chair to assign one or more Ethics Reviewers per application.
5. Require every assigned Ethics Reviewer to submit a recommendation before a decision can be
   issued (panel review, not single-reviewer).
6. Allow the Ethics Committee Chair to issue one of: Approved, Approved with Conditions,
   Deferred, or Disapproved.
7. On a positive decision, sign the Ethics track's half of the joint clearance certificate.
8. On clearance issuance, automatically transition the application into Monitoring.
9. During Monitoring, accept monthly progress reports from the researcher and reviewer compliance
   verdicts against them (informational only — does not block anything).
10. Accept a Final Ethics Completion Report from the researcher, which — on submission — closes
    and archives the study in the same action.
11. Support standalone incident reporting (§4.4) at any point during an active or monitored
    study, independent of the status lifecycle above.

### 4.4 Incident Reporting (part of REMIS)

The system shall:
1. Allow the study's researcher, or Ethics Secretariat/Reviewer/Chair, to file an incident
   against any REMIS application at any time.
2. Capture incident type (Participant Complaint, Data Breach, Confidentiality Breach,
   Psychological Harm, Protocol Violation, Other), severity, and description.
3. Immediately notify the Ethics Committee Chair and Ethics Secretariat on filing.
4. Additionally notify DPO Staff directly when the incident type is Data Breach or
   Confidentiality Breach — the one point where the Incident module reaches across to the DPO
   side.
5. Track incident status (Reported → Under Investigation → Corrective Action in Progress →
   Resolved → Closed) independent of the study's own status.
6. Support an attached corrective action (required action, due date, status, verification)
   tracked independently of the incident's own status.

### 4.5 Shared infrastructure

The system shall:
1. Maintain one user/role model shared by all modules, with role-based permission checks on
   every module action.
2. Enforce a consistent, auto-generated file naming and repository placement convention for every
   uploaded or generated document.
3. Capture an e-signature (typed name + timestamp + IP/device, plus a drawn-signature image for
   visual familiarity) on every signing event, and lock signed documents from further edits.
4. Provide in-app and email notification channels, with role-specific dashboards (new
   submissions, pending-my-action, returned/awaiting-applicant, overdue monitoring, recently
   completed).
5. Maintain an immutable, filterable audit trail of every record creation, status change,
   document upload, signature event, and role change.
6. Provide applicants a simplified status tracker, and internal reviewers the full status +
   comment history, for any record.

### 4.6 Public verification

The system shall:
1. Provide a public, unauthenticated page where anyone can enter a DPREQ/REC tracking number, or
   scan a certificate's QR code, and receive: valid/expired status, both tracking numbers, issue
   date, expiry date — and nothing else (no names, no study details).
2. Only ever resolve against a clearance certificate that has both required signatures.

---

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Data sensitivity | All modules handle personal data under the Philippine Data Privacy Act; REMIS additionally handles ethics-sensitive research data. Every write requires an attributable, immutable audit record. |
| Scale | Institutional, not internet-scale — estimated low hundreds of DPREQ/REMIS applications/year, 500+ DPNDA records/year concentrated at OJT intake periods. **[ASSUMPTION — validate with DPO/ORD]** |
| Availability | Business-hours-critical; planned maintenance downtime acceptable, unplanned downtime during a submission deadline is not. |
| Portability | Must not be architecturally locked to a specific host, domain, or storage backend ahead of a hosting decision. |
| Auditability | Correctness and traceability of every state change takes priority over raw performance, given the sensitivity of the data involved. |

---

## 6. Reports

| Report | Owner | Key metrics |
|---|---|---|
| Applications by Department | Shared | Application counts by status, by department |
| Compliance Monitoring Report | Shared | Compliant / minor / major / non-compliant counts |
| Incident Summary | ORD (DPO cc'd on breach types) | Incident counts by type, severity, status; time-to-resolution |
| Application by Risk Level | ORD | Minimal/Moderate/High breakdown |
| Reviewer Workload | ORD | Active assignments, completed reviews, turnaround time per reviewer |
| Annual Ethics Report | ORD | Full-year submission/approval/rejection summary |
| Archive Studies Report | ORD | Archived studies list with outcome |
| NDAs per department/grade level | DPO | Completed NDA counts, cross-tabbed |
| Pending DPO approvals | DPO | In-flight applications with reasons/comments |
| Student teachers per grade/dept/school | DPO | Placement counts, cross-tabbed |
| OJTs accommodated per month/year | DPO | Placement counts, cross-tabbed, trended |
| OJT/student teacher whereabouts | DPO | Active placements as of a given date |
| Departments with/without OJT evaluation reports | DPO | Compliance list, two-sided |

Full field-level detail: `docs/5.1-reports-shared.md`, `docs/5.2-reports-ord.md`,
`docs/5.3-reports-dpo.md`.

---

## 7. What this document does not cover

Deployment/hosting decisions, database schema, and API design are covered in
`docs/architecture.md` and `docs/system-design.md` — technical documents intended for the
implementation team, not this stakeholder package. Open policy questions requiring stakeholder
input are consolidated in
[`05-open-questions-and-assumptions.md`](05-open-questions-and-assumptions.md).
