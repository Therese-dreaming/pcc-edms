# PCC-EDMS Documentation

PCC Electronic Document Management System — a single platform shared by the **Data Privacy
Office (DPO)** and the **Office of Research and Development (ORD)**, via the **Research Ethics
Committee (REC)**, covering data-privacy clearances, OJT/trainee NDAs, and research ethics
review. See `0.1-purpose-and-scope.md` for the full scope statement.

This README is the entry point. If you're new here, read in the order below rather than
alphabetically — the numbering reflects dependency order, not just topic grouping.

## Start here if you're...

**...picking up implementation work (continuing this session or a new one):** read
**`HANDOFF.md`** first — it's the session-to-session status report: what's built and
browser-verified, what's explicitly deferred, real bugs found during verification worth knowing
about before you hit them again, and the recommended next module. Then see
`../GETTING_STARTED.md` at the project root to actually run the app.

**...confirming requirements (DPO / ORD / IT):** read `9.1-review-and-open-questions.md` first
— it's a two-page summary of what the system does and every open question that needs your
answer, without making you read all 28 files.

**...reviewing the proposed technical design:** read `architecture.md` (stack decisions) and
`system-design.md` (data model, module boundaries) — these are what `9.0`'s master prompt asked
for.

**...implementing a module:** read the `0.x` foundation files, then the `X.x` files for your
module, then `system-design.md` §3 for the exact schema, then `testing-strategy.md` for what
your module needs test coverage on.

**...checking what changed and why:** read `CHANGELOG.md`.

**...just want the story, not the spec:** read **`WORKFLOWS.md`** — a chronological, plain-English
walkthrough of what happens when someone submits a DPREQ, a DPNDA, gets an incident filed, etc.,
cross-checked against the actual code rather than just the spec files below.

## Document Index

### Implementation status (read this first if picking up dev work)
| File | Contents |
|---|---|
| `HANDOFF.md` | Session-to-session status: what's built and verified, bugs found and fixed, what's deferred, recommended next step |
| `../GETTING_STARTED.md` | How to run the app locally — setup, test accounts, golden-path walkthrough, troubleshooting |
| `WORKFLOWS.md` | Chronological narrative of every workflow (account setup, DPREQ+REMIS, DPNDA, Incidents, verification), written against the actual code |

### 0.x — Foundations
| File | Contents |
|---|---|
| `0.1-purpose-and-scope.md` | System name, owning offices, scope, out-of-scope, success criteria |
| `0.2-stakeholders-and-roles.md` | All 14 roles (DPO-side + REMIS-side + Admin — DPO Approver and Student Teacher retired 2026-07-06) and the capability matrix |
| `0.3-glossary.md` | Term definitions used across every other file |
| `0.4-dpo-ethics-integration.md` | **New.** How DPO (`1.x`) and Ethics/REMIS (`3.x`) share one application intake and each issue its own independent certificate (the original dual-signed joint clearance was retired 2026-07-25) — read this before `1.x`/`3.x` |

### 1.x — Module 1: DPREQ (DPO)
| File | Contents |
|---|---|
| `1.1-dpreq-application-form.md` | Form fields, clearance certificate output |
| `1.2-dpreq-workflow.md` | Status lifecycle, screening checklist, notifications |
| `1.3-dpreq-documents.md` | Accepted file types, naming, repository placement, retention |

### 2.x — Module 2: DPNDA (DPO)
| File | Contents |
|---|---|
| `2.1-dpnda-nda-template.md` | NDA record fields, template management |
| `2.2-dpnda-workflow.md` | Sign/countersign status lifecycle, notifications |

### 3.x — Module 3: REMIS (ORD/REC)
Aligned against the authoritative `REMIS_Functional_Requirements_Specification.md` — see
`CHANGELOG.md` for what changed and why.

| File | Contents |
|---|---|
| `3.1-remis-application-form.md` | Form fields (incl. Participants/Ethics sections), clearance certificate + QR verification |
| `3.2-remis-screening-risk.md` | Administrative screening (Ethics Secretariat) and risk classification (Ethics Reviewer/Chair) |
| `3.3-remis-review-workflow.md` | Full lifecycle incl. the academic endorsement chain (Adviser → Program Head → Dean) |
| `3.4-remis-monitoring-archiving.md` | Monitoring (progress reports) and Completion Module |
| `3.5-remis-incident-reporting.md` | **New module.** Incident types, tracking, corrective action, DPO cross-notification |

### 4.x — Shared Infrastructure
| File | Contents |
|---|---|
| `4.1-user-roles-permissions.md` | User creation, validation, rights management |
| `4.2-file-management-naming.md` | Naming convention, repository structure, versioning |
| `4.3-esignature-notifications.md` | E-signature requirements, notification dashboards/channels |
| `4.4-audit-trail-status-tracking.md` | Audit event types, audit trail report, applicant-facing status view |

### 5.x — Reports
| File | Contents |
|---|---|
| `5.1-reports-shared.md` | Applications by Department, Compliance Monitoring, **Incident Summary (new)** |
| `5.2-reports-ord.md` | Risk Level, Reviewer Workload, Annual Ethics Report, Archive Studies |
| `5.3-reports-dpo.md` | NDA/placement reports — flags the need for a first-class `Placement` entity |

### 6.x–9.x — Prompts, Deployment, Stack, Planning Deliverables
| File | Contents |
|---|---|
| `6.0-master-prompt.md` | **Deprecated** — superseded by `9.0` |
| `7.0-deployment.md` | Deployment readiness requirements, hosting checklist (still open) |
| `8.0-tech-stack.md` | Confirmed stack (React + Laravel) + previously-open decisions |
| `9.0-master-prompt.md` | The master prompt this whole planning pass executes |
| `9.1-review-and-open-questions.md` | **Output of running `9.0` steps 1–2:** understanding summary + consolidated open-questions list |

### Planning Deliverables (this pass)
| File | Contents |
|---|---|
| `architecture.md` | ADRs resolving the 4 (+1) open tech decisions from `8.0`/`4.3` |
| `system-design.md` | Component diagram, normalized data model, API/module boundaries |
| `testing-strategy.md` | Test pyramid, coverage targets, example test cases, identified gaps |
| `knowledge-graph.json` / `knowledge-graph.md` | Machine-readable entity/relationship graph + maintenance guide |
| `CHANGELOG.md` | Every substantive doc edit made during the REMIS realignment pass, with rationale |

### Source specification
| File | Contents |
|---|---|
| `REMIS_Functional_Requirements_Specification.md` | The authoritative FRS for the Ethics/REMIS track — source of truth for the review-workflow detail in `3.x` |
| `../reqs/DPO EFORM 1/2/3/5 SAMPLE.pdf` | EVP-approved source forms for the researcher-facing intake (Form 1), Research Team NDA (Form 2), joint clearance certificate (Form 3), and OJT/Trainee NDA (Form 5) — source of truth for `0.4`, `1.1`, `1.3`, `2.1` |

## Status of this documentation set

As of 2026-07-02: all `0.x`–`5.x` files have been reconciled against the REMIS FRS (see
`CHANGELOG.md`), a previously-missing Incident Reporting module has been added (`3.5`), and a
full architecture/data-model/testing proposal has been produced (`architecture.md`,
`system-design.md`, `testing-strategy.md`) per `9.0`'s instructions. A second reconciliation
pass then incorporated `reqs/`'s EVP-approved forms, revealing that DPREQ and REMIS are two
internal review tracks on one shared application rather than two independent ones — see
`0.4-dpo-ethics-integration.md` and `CHANGELOG.md`'s "DPO ↔ Ethics integration pass."

**Implementation has since begun (per `9.0` step 5) and is well underway** — DPREQ, DPNDA,
REMIS's core lifecycle, Incident Reporting, and the public verification portal are built and
browser-verified against a real MySQL database, with PDF generation for every certificate/NDA.
See **`HANDOFF.md`** for exactly what's done, what's deferred, and what to do next. The 🔴 open
items in `9.1-review-and-open-questions.md` that concern DPO/ORD policy specifics (not schema or
module boundaries) remain genuinely unresolved and the system currently assumes the
simpler/more-inclusive answer where it had to pick one — see `HANDOFF.md` §5 for specifics.
