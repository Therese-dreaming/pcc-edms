# PCC-EDMS — Open Questions and Assumptions: Sign-Off Sheet

> **2026-08-31 (audit) — PARTIALLY STALE:** this sheet (≈2026-07-06) predates the 2026-07-25
> architectural reversal and several answers. Do not re-litigate: retention schedule is
> CONFIRMED (7 yrs issued / 3 yrs rejected) and BUILT (`config/retention.php`,
> `edms:apply-retention`); breach-incident auto-pause of monitoring is BUILT
> (`IncidentService::autoPauseMonitoring`); the joint dual-signed clearance is RETIRED
> (independent per-track certificates). The dual-signature "hard system rule" in the other
> package files is likewise retired. Controlling texts: `docs/0.4`, `docs/1.2`,
> `docs/WORKFLOWS.md`, `docs/CHANGELOG.md`.

Every row below is either tagged **ASSUMPTION** or **🔴 open** in the underlying spec (see
`docs/9.1-review-and-open-questions.md` and `docs/0.4-dpo-ethics-integration.md` for full detail
and rationale). None of these affect the system's overall structure — they are policy specifics
the system currently handles using the simplest, most inclusive default until answered.

Items already resolved (🟢 confirmed, or 🟡 resolved by architectural decision) are **not**
listed here — they're documented in the source files for reference but don't need stakeholder
action.

| # | Question | Current assumption | Needs decision from | Sign-off |
|---|---|---|---|---|
| 1 | What is the exact retention schedule (years) for issued DPREQ clearances vs. rejected applications, and does DPNDA differ? | Undecided — no retention deletion logic is built yet | DPO / Legal | ☐ |
| 2 | What are the exact criteria thresholds for Minimal / Moderate / High risk classification? | FRS names the three tiers and their review tracks, not the criteria that place a study into each one | Research Ethics Committee | ☐ |
| 3 | Who is allowed to file an incident, and should Data Breach / Confidentiality Breach incidents automatically place the study's monitoring on hold? | Anyone on the study, or Ethics Secretariat/Reviewer/Chair, may file; no automatic hold | ORD | ☐ |
| 4 | Should "record viewed" (not just "record changed") events be logged for all records, or sensitive ones only? | Undecided — not yet built either way | DPO / ORD | ☐ |
| 5 | Does every Form 1 submission require the full REMIS track (endorsement chain → screening → risk classification → committee review), or only studies meeting some risk threshold? | Every submission goes through both tracks | ORD / Ethics Secretariat | ☐ |
| 6 | All deployment/hosting items: hosting type, domain, SSL, database hosting, backup schedule, CI/CD. | Undecided — system is built to not hardcode any of these | PCC IT | ☐ |
| 7 | PCC IT needs to register an app in Microsoft Entra ID (Azure AD) and issue a client ID/secret/tenant ID before SSO can be wired up and tested. (PCC's use of Microsoft 365 / `pccnet.edu.ph` is now confirmed — this row is just the remaining IT provisioning step.) | Standalone email/password accounts built and in use now; schema is SSO-ready, Entra ID confirmed as the target, provisioning not yet done | PCC IT | ☐ |
| 8 | Is a typed name + timestamp + IP/device log, plus a drawn-signature image, legally sufficient as an e-signature for these documents (per RA 8792), or does DPO/Legal require a certified third-party e-signature provider? | Hybrid typed-name + drawn-image approach is implemented and treated as legally sufficient | DPO / Legal | ☐ |

---

## For context: decisions already made and confirmed (informational only)

These do not need sign-off — listed here so stakeholders know they were considered and closed,
not overlooked:

- Monitoring/progress-report cadence: monthly (confirmed with the requester, since most studies
  finish in 3–4 months).
- Bulk CSV import for OJT batch role assignment: required and built.
- SMS notifications: deliberately not built — the project runs on free infrastructure aside from
  hosting, and SMS gateways are a paid service. Email covers the FRS-required notification
  channel.
- A separate "Discontinued/Withdrawn" workflow branch for stalled studies: declined — a stalled
  study can simply remain in Monitoring indefinitely.
- Multi-version NDA template management: declined for now — the current fixed NDA template is
  stable; revisit only if the NDA text itself needs to change over time.
- Panel review (multiple Ethics Reviewers per application, consolidated by the Chair): confirmed
  and built, matching the FRS's plural "assigns reviewers" / "consolidates recommendations"
  language.
- Database engine: MySQL 8.0+. Frontend/backend integration: Inertia.js (React + Laravel).
- **DPO role list (confirmed 2026-07-06):** DPO Approver is retired as a separate role — DPO
  Staff is the sole DPO-side role and now owns the full track including final approval.
- **Student Teacher (confirmed 2026-07-06):** not a distinct trainee category — tracked as
  ordinary internal/external OJT placements. The standalone "Student Teachers by Grade Level"
  report was removed.
- **DPREQ form fields, file sizes (10MB), and DPO screening checklist (confirmed 2026-07-06):**
  current implementation is correct as-is, no changes needed.
- **NDA template fields, Form 2/Form 5 (confirmed 2026-07-06):** correct as-is, no DPO/Legal
  changes requested.
- **Compliance Monitoring Report (confirmed 2026-07-06):** DPO's and ORD's versions stay
  separate despite the shared name.
- **Trainee whereabouts (confirmed 2026-07-06):** a placement-schedule snapshot is sufficient;
  no real-time check-in needed.
- **Audit trail read access (confirmed 2026-07-06):** Admin, DPO Staff, and Ethics Committee
  Chair.
- **Research Ethics Head (confirmed 2026-07-06):** the same person as the Ethics Committee
  Chair, just two labels for one role — already modeled this way.
- **Research Team NDA / Form 2 for solo researchers (confirmed 2026-07-06):** still required,
  even for a 1-person research "group" — already built this way.
- **Virus scanning on uploads (confirmed 2026-07-06):** deliberately deferred until the rest of
  the project is complete, not an open IT policy question in the meantime.
