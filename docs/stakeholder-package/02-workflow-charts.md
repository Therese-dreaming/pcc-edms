# PCC-EDMS — Workflow Charts

Diagrams below use [Mermaid](https://mermaid.js.org/) syntax — they render automatically in
GitHub, GitLab, VS Code (with the Mermaid extension), and most modern Markdown viewers. Every
state name is taken directly from `docs/WORKFLOWS.md`, which was itself cross-checked against
the running code, not just the design docs.

---

## a) Account registration → role selection

A new user's account is a shell until they verify their email and pick a role — but only for
self-registering "applicant" roles. Every internal review role (DPO Staff, Ethics Secretariat,
Adviser, Admin, etc.) is created directly by an Administrator and skips this flow entirely.

```mermaid
flowchart TD
    A[Register at /register] --> B[Account created:\nstatus = pending_validation]
    B --> C[Verification email sent]
    C --> D{Link clicked?}
    D -- Yes --> E[status = active]
    D -- No --> C
    E --> F{Role already assigned?}
    F -- No, self-registered --> G[Redirect to /select-role:\nInternal/External Researcher,\nOJT Internal/External]
    G --> H[Role set — account usable]
    F -- Yes, admin-created role\ne.g. DPO Staff, Adviser, Admin --> H
```

---

## b) DPREQ + REMIS — one submission, two tracks, joint clearance

The central workflow of the system: a single Form 1 submission fans out into a DPO track and an
Ethics track that run independently, then converge on one clearance certificate.

```mermaid
flowchart TD
    S[Applicant submits Form 1] --> P[research_application created]
    P --> D1[DPREQ created:\nstatus = submitted]
    P --> R1[RemisApplication created:\nstatus = under_endorsement]
    P --> N1[Research Team NDA created:\nstatus = pending_signatures]

    subgraph DPO["DPO Track (DPREQ)"]
        D1 --> D2[DPO Staff screens]
        D2 -- incomplete --> D3[Returned] --> D1
        D2 -- complete --> D4[Under Review]
        D4 --> D5[DPO Staff endorses]
        D5 --> D6{DPO Staff final decision}
        D6 -- Reject --> D7[Rejected — terminal]
        D6 -- Approve* --> D8[Approved]
    end

    subgraph ETH["Ethics Track (REMIS)"]
        R1 --> R2[Adviser -> Program Head -> Dean\nsequential endorsement]
        R2 -- return --> R3[For Revision] --> R1
        R2 -- reject --> R4[Disapproved — terminal]
        R2 -- all approve --> R5[Ethics Secretariat screening]
        R5 -- incomplete --> R3
        R5 -- complete --> R6[Risk classification +\nreviewer assignment]
        R6 --> R7[Ethics Reviewer panel review]
        R7 --> R8{Ethics Committee Chair decision}
        R8 -- Disapproved --> R4
        R8 -- Deferred --> R7
        R8 -- Approved / Approved w/ Conditions --> R9[Ethics track signs]
    end

    N1 --> N2{All team members signed?}
    N2 -- Yes --> N3[NDA Completed]
    N3 -.gates.-> D6

    D8 --> J[Joint Clearance Certificate\nawaits both signatures]
    R9 --> J
    J --> K{Both dpo_signed_at AND\nethics_signed_at present?}
    K -- No --> J
    K -- Yes --> L[Certificate issued:\nQR code + PDF generated\napplicant notified]
    L --> M1[DPREQ -> clearance_issued\nterminal]
    L --> M2[REMIS -> clearance_issued\n-> monitoring, automatically]
```
*\* DPO Staff's final approval is blocked until the Research Team NDA is fully signed (dotted gate above).*

---

## c) REMIS Monitoring → Completion

```mermaid
flowchart TD
    A[Study in status: monitoring] --> B[Researcher files monthly\nprogress reports]
    B --> C[Assigned reviewers log\ncompliance verdict — informational only]
    A --> D[Incidents may be filed at\nany time — see chart d]
    A --> E[Researcher submits Final\nEthics Completion Report]
    E --> F[Status -> closed]
    F --> G[Status -> archived\nresearcher + reviewers notified]
```

---

## d) Incident reporting — independent of study status

```mermaid
flowchart TD
    A[Researcher or Ethics Secretariat/\nReviewer/Chair files incident] --> B[Notify Ethics Committee Chair\n+ Ethics Secretariat]
    A --> C{Type = Data Breach or\nConfidentiality Breach?}
    C -- Yes --> D[Also notify DPO Staff directly]
    C -- No --> E
    B --> E[reported]
    E --> F[under_investigation]
    F --> G[corrective_action_in_progress]
    G --> H[resolved]
    H --> I[closed]
    F -.-> H

    subgraph CA["Corrective action — tracked independently"]
        CA1[in_progress] --> CA2[completed] --> CA3[verified]
    end
```

---

## e) DPNDA — OJT/Trainee NDA (Form 5)

A separate workflow from (b) above — it belongs to a placement, not a research study, and is
started by the Department Coordinator, not the trainee.

```mermaid
flowchart TD
    A[Dept Coordinator creates placement\n+ DPNDA record: status = draft] --> B[Coordinator sends for signing]
    B --> C[status = sent_for_signing\ntrainee notified]
    C --> D{Trainee action}
    D -- Signs --> E[status = trainee_signed\ncoordinator notified]
    D -- Declines w/ reason --> F[status = declined — terminal\ncoordinator + DPO notified]
    E --> G[Coordinator countersigns]
    G --> H[status = completed\nPDF generated\ntrainee + coordinator + DPO notified]
    H --> I[Coordinator may later upload\nOJT Evaluation Report]
```
