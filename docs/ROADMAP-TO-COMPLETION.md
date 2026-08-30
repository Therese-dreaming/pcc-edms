# Roadmap to 100% — PCC-EDMS Completion Plan

_Last updated: 2026-08-31 by the senior-team audit. This is the single list of everything left to
finish the project. Items are grouped by who/what unblocks them — work top-down within each
phase. "100%" is defined by `0.1`'s success criteria: 100% paperless DPREQ/REMIS clearance, all
OJT/community-service NDAs e-signed and stored, and all reports produced on demand without
manual compilation — running in production at a PCC-owned domain._

**Current health (2026-08-31):** 152 tests passing (704 assertions), `composer audit` clean,
build clean, all modules functionally complete and browser-verified, `main` committed but **not
pushed** (standing instruction).

---

## Phase A — Engineering work, no stakeholder input needed

These can be picked up by the dev team immediately.

- [ ] **Regenerate `knowledge-graph.md` / `.json`** (v1.2 is stale: still encodes the retired
      joint clearance edge and the pre-collapse DPREQ chain; predates cohorts, revisions,
      exemption, independent certificates). Bump per its own maintenance rules + changelog note.
- [ ] **Reconstruct or formally close the CHANGELOG gap for 2026-07-29..08-30** — real commits
      landed then (14 loophole fixes, SweetAlert layer, DPNDA schedules/calendar, EVP signature,
      Form 2 obligations gate) with no entries. Either reconstruct from git history (done — see
      CHANGELOG's "Reconstructed" section) or accept the reconstruction as the record.
- [ ] **OJT coordinator batch onboarding** — coordinators still onboard trainees one at a time on
      a heavy form. The cohort machinery in `app/Shared/Onboarding/` was built generically for
      exactly this extension (HANDOFF §0). *Was scoped out 2026-07-25 ("advisers/researchers
      first") — confirm priority with requester before starting.*
- [ ] **Submission-history timeline UI + certificate issuance history** — stakeholder "Future
      Enhancements" items, never requested; build only if asked.
- [ ] **Root-level verification screenshots** (12 PNGs committed 2026-08-31) — move to a docs
      assets folder or remove, per requester call.
- [ ] **Load targets** — get DPO/ORD volume estimates (testing-strategy §Gaps) so load testing
      has a number to hit.

## Phase B — Stakeholder decisions required (each blocks code)

Each item names the decision, who owns it, and what code it unblocks.

| Decision | Owner | Unblocks |
|---|---|---|
| Final student/employee variants of the unified application form + remaining field deltas (`9.1` §2b: Type of Research picklist, structured Nature of Study, 8-item ethics checklist, DPA data classification, DPIA flag, 10-item attachments checklist) | Requester / DPO / ORD | Migrating Form 1 fully to the July-7 unified form |
| Should **exempted** studies eventually auto-close/archive, or rest at `clearance_issued` forever? | ORD / REC | Monitoring/archival edge for exemptions |
| Expiry/abandonment rule: how long can an application sit in `returned`/`for_revision`, or a study in `monitoring`, before the system flags/closes it? | DPO + ORD | Retention-adjacent cleanup job |
| `approved_with_conditions`: is there any follow-up check that conditions were met, or is the conditions text purely informational? | ORD / REC | Possible monitoring hook |
| "Record viewed" audit logging: all records or sensitive-only? | DPO | Audit event additions |
| Signing-link expiry value (currently 14 days by default, "configurable" per stakeholder doc) | Requester | One constant (`ResearchTeamNdaService::LINK_EXPIRY_DAYS`) |
| "ODP" (Office for Data Privacy) on the unified form's Part IX — same office as DPO renamed, or distinct? | Requester | Field/label naming on form migration |
| Enable retention purge in production (`RETENTION_PURGE_ENABLED=true`) | **DPO sign-off required** — confirm RA 10173 interpretation of soft-deleted Document rows as the disposal record | The monthly `edms:apply-retention --purge` |
| Login-page policy copy is "Policy draft v0.1" — needs review before production | PCC Admin + DPO + Ethics body + Legal | Go-live |

## Phase C — IT / infrastructure dependent

- [ ] **Hosting decision** (`7.0`): hosting type, PCC-owned domain/DNS, SSL provisioning, DB
      hosting (MySQL 8.0+), backup schedule, queue-worker supervision, CI/CD. Everything in
      `DEPLOYMENT_CHECKLIST.md` hangs on this.
- [ ] **SSO (Microsoft Entra ID)** — provider confirmed (Microsoft 365 / `@pccnet.edu.ph`);
      blocked on PCC IT registering an app and issuing client ID/secret/tenant ID. Architecture
      is SSO-ready (ADR-002: nullable `users.sso_subject_id`).
- [ ] **Real mail delivery** — code side done (`EMAIL_SETUP.md`); needs Mailtrap/SMTP/Mailgun/SES
      credentials + a verified sending domain.
- [ ] **Virus scanning (ClamAV)** — researched, feasible, free; requester deferred until the rest
      is complete AND hosting is chosen (needs `clamd` on the serving machine). Recommended shape:
      `clamd` daemon + socket client, not per-file `clamscan`.
- [ ] **Local-disk backup job** (ADR-004 open action item) — `scripts/backup.sh` exists; wire the
      production cron once hosting is known. Required before go-live: legally-retained documents
      must survive disk failure.
- [ ] **Production queue worker + scheduler** — Browsershot PDF jobs and the retention sweep need
      `queue:work` and cron/Supervisor running in production (GETTING_STARTED + checklist).

## Phase D — Process & go-live

1. [ ] Resolve all Phase B rows (they are the go/no-go inputs).
2. [ ] Phase C infrastructure stood up (staging first, per `7.0` tiers).
3. [ ] **UAT round** with real office staff: run the golden paths in `GETTING_STARTED.md` for
       every role account on staging; sign off per module.
4. [ ] **Training/handover** for DPO staff, Ethics Secretariat/Chair, coordinators — the system
       replaces paper, so the process change is the product.
5. [ ] Legal review of e-signature posture (ADR-005 caveat: typed-name + metadata as operative
       record under RA 8792 — explicit DPO/Legal acceptance recommended).
6. [ ] Deployment checklist run (`DEPLOYMENT_CHECKLIST.md`), backups verified, monitoring/uptime
       tooling chosen.
7. [ ] Push `main` to origin **only with the requester's explicit go-ahead** (standing rule).
8. [ ] Go-live; keep paper fallback for one cycle if DPO wants it.

## Phase E — Front-end redesign (PAUSED by requester)

Do **not** resume without an explicit ask (HANDOFF §0). When resumed:
- Reconcile the mixed state: maroon/paper design-token system (applied to shared components,
  layouts, dashboards) vs. hand-edited pages (`Auth/*.jsx`, `Dpreq/Show.jsx`, `Dpnda/Create.jsx`)
  which use a different aesthetic and must not be restyled without confirmation.
- Write `docs/DESIGN.md` documenting whichever direction wins.

## Explicitly out of scope (decided, don't rebuild)

- Joint dual-signed clearance certificate (retired 2026-07-25 — independent certificates).
- SMS notifications (cost constraint; email is the required channel and is built).
- NDA template versioning / `nda_templates` table (declined 2026-07-04).
- Discontinued/Withdrawn early-exit workflow (declined 2026-07-04; enum kept for forward-compat).
- Digital-signature verification beyond the identity capture already recorded.
- Public self-registration (removed 2026-07-25; staff-issued credentials only).
