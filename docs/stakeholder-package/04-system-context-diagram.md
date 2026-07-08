# PCC-EDMS — System Context Diagram

Stakeholder-level view: what the system is, who touches it, and how information flows between
the two owning offices. Deliberately excludes implementation detail (no class names, table
names, or schema) — see `docs/architecture.md` and `docs/system-design.md` for the technical
version this is derived from.

---

## System context

```mermaid
flowchart TB
    subgraph External["People outside the offices"]
        RES[Researchers /\nOJTs / Trainees /\nStudent Teachers]
        PUB[General public\nverifying a clearance]
    end

    subgraph DPOoffice["Data Privacy Office (DPO)"]
        DPOstaff[DPO Staff / Approver]
    end

    subgraph ORDoffice["Office of Research & Development (ORD) / Research Ethics Committee (REC)"]
        ACAD[Adviser -> Program Head -> Dean]
        ETHICS[Ethics Secretariat /\nReviewer / Committee Chair]
    end

    subgraph SYS["PCC-EDMS (single shared platform)"]
        INTAKE[Application Intake\nModule 1 form]
        DPREQ[DPREQ\nData-privacy review track]
        DPNDA[DPNDA\nNDA e-signing]
        REMIS[REMIS\nEthics review, monitoring,\nincident reporting]
        CLEAR[Joint Clearance\n& Verification]
        REPORTS[Reporting]
    end

    RES -- submits application --> INTAKE
    RES -- signs NDA --> DPNDA
    INTAKE -- creates DPO-track record --> DPREQ
    INTAKE -- creates Ethics-track record --> REMIS
    DPOstaff -- screens / reviews / approves --> DPREQ
    ACAD -- endorses --> REMIS
    ETHICS -- screens / classifies risk / reviews / decides --> REMIS
    DPREQ -- signs DPO half --> CLEAR
    REMIS -- signs Ethics half --> CLEAR
    CLEAR -- releases certificate only when both signed --> RES
    PUB -- checks tracking number / QR --> CLEAR
    REMIS -- data-breach incident --> DPOstaff
    DPREQ --> REPORTS
    DPNDA --> REPORTS
    REMIS --> REPORTS
    REPORTS -- reports --> DPOstaff
    REPORTS -- reports --> ETHICS
```

---

## Reading this diagram

- **One front door:** researchers interact with a single intake form, not separate DPO and
  Ethics forms.
- **Two independent back-office tracks:** DPO's review and the Ethics Committee's review happen
  in parallel and don't wait on each other — except at the very end.
- **One convergence point:** the joint clearance certificate is the only place the two tracks'
  outputs meet, and it enforces a hard rule — no release until both offices have signed.
- **One cross-office notification:** REMIS-side data-breach or confidentiality-breach incidents
  are the one case where the Ethics side directly notifies DPO — because a privacy breach inside
  a REC-cleared study is a DPO matter regardless of which office's process surfaced it.
- **DPNDA is separate:** OJT/trainee NDAs are not part of the research-application flow at all —
  they belong to placements, run by Department Coordinators (not shown above since they sit
  outside DPO/ORD as host-department staff).
- **Reporting reads across everything:** both offices get reports computed from the same
  underlying application data, without manual compilation.
