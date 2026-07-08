# PCC-EDMS — Role RACI Matrix

**R** = Responsible (does the work) · **A** = Accountable (owns the outcome, final say) ·
**C** = Consulted (input sought before the step) · **I** = Informed (notified after the step)

Derived from `docs/0.2-stakeholders-and-roles.md`'s capability matrix and `docs/WORKFLOWS.md`'s
"who can do what" table. DPO-side rows are confirmed with DPO (2026-07-06); REMIS-side rows are
sourced from the REMIS FRS and are considered confirmed.

---

## Module 1 — DPREQ (DPO track)

DPO Staff is the sole DPO-side role (DPO Approver was retired as a separate role, confirmed
2026-07-06) — it owns every step below end to end, including final approval.

| Step | Applicant | DPO Staff |
|---|---|---|
| Submit application (Form 1) | **R/A** | I |
| Screen for completeness | I | **R/A** |
| Return for correction | I | **R/A** |
| Substantive review | I | **R/A** |
| Endorse for final approval | I | **R/A** |
| Reject | I | **R/A** |
| Approve (gated on Team NDA complete) | I | **R/A** |
| Clearance issuance (joint, see Clearance table) | I | I |

## Module 1 — Research Team NDA (Form 2)

| Step | Team Lead | Co-researchers | DPO Staff |
|---|---|---|---|
| NDA auto-created on Form 1 submit | I | I | I |
| Sign as leader | **R/A** | — | I |
| Sign as member | — | **R/A** (each) | I |
| Mark complete (system, once all signed) | I | I | I |

## Module 2 — DPNDA (OJT/Trainee NDA, Form 5)

| Step | Dept Coordinator | Trainee | DPO Staff |
|---|---|---|---|
| Create placement + draft NDA | **R/A** | I | — |
| Send for signing | **R/A** | I | — |
| Sign | I | **R/A** | — |
| Decline (with reason) | I | **R/A** | I |
| Countersign / complete | **R/A** | I | I |
| Upload OJT Evaluation Report | **R/A** | — | — |

## Module 3 — REMIS academic endorsement chain

| Step | Researcher | Adviser | Program Head | Dean |
|---|---|---|---|---|
| Submit application (Form 1) | **R/A** | I | — | — |
| Adviser endorsement | I | **R/A** | I | — |
| Program Head endorsement | I | I | **R/A** | I |
| Dean endorsement | I | — | I | **R/A** |
| Return with comments (any step) | **R** (revises) | C | C | C |
| Reject (any step, terminal) | I | C | C | C |

## Module 3 — REMIS administrative screening & risk classification

| Step | Researcher | Ethics Secretariat | Ethics Reviewer | Ethics Committee Chair |
|---|---|---|---|---|
| Administrative screening | I | **R/A** | — | I |
| Return for revision / issue deficiency notice | I | **R/A** | — | I |
| Assign tracking number | I | **R/A** | — | — |
| Assign reviewers | I | I | I | **R/A** |
| Risk classification | I | I | **R/A** | C |

## Module 3 — REMIS substantive review & decision

| Step | Researcher | Ethics Reviewer(s) | Ethics Committee Chair |
|---|---|---|---|
| Substantive review & recommendation | I | **R/A** (each reviewer) | C |
| Consolidate recommendations | — | C | **R/A** |
| Issue decision (Approved / Cond. / Deferred / Disapproved) | I | I | **R/A** |
| Sign Ethics track's half of joint clearance | I | I | **R/A** |

## Joint clearance certificate (convergence point)

| Step | DPO Staff | Ethics Committee Chair | Applicant |
|---|---|---|---|
| Sign DPO half | **R/A** | I | I |
| Sign Ethics half | I | **R/A** | I |
| System issues certificate (both signatures present) | I | I | **I** (only now, receives it) |

## REMIS monitoring & completion

| Step | Researcher | Ethics Reviewer(s) | Ethics Secretariat |
|---|---|---|---|
| Submit monthly progress report | **R/A** | I | — |
| Log compliance verdict | I | **R** | I |
| Submit Final Ethics Completion Report | **R/A** | I | I |
| Close & archive (system, on submission) | I | I | I |

## Incident reporting

| Step | Researcher | Ethics Secretariat | Ethics Reviewer | Ethics Committee Chair | DPO Staff |
|---|---|---|---|---|---|
| File incident | **R** | **R** | **R** | **R** | — |
| Immediate notification | I | **A** | I | **A** | I (breach types only) |
| Investigate / assign / add notes | I | **R** | C | **R/A** | I (breach types only) |
| Track corrective action | I | **R** | C | **A** | — |
| Verify corrective action | I | C | — | **R/A** | — |

## Administration (cross-cutting)

| Step | System Administrator | All other roles |
|---|---|---|
| Create/edit any user account | **R/A** | — |
| Assign/change any role | **R/A** | — |
| View own application status | I | **R/A** (self only) |
| Manage NDA templates (if enabled) | **R/A** | I |
