# Architecture Decision Records — PCC-EDMS

Produced via `/engineering:architecture`, executing `9.0-master-prompt.md` step 3(a)/(d):
resolves the four open decisions flagged in `8.0-tech-stack.md`, and confirms alignment with
`7.0-deployment.md`'s portability requirements. Pairs with `system-design.md` (data model, API
boundaries). Per the user's instruction for this pass, these decisions are made and justified
directly rather than left pending — override any of them and the rest of `system-design.md`
still holds, since none of these choices change the module boundaries or schema.

**Deciders:** DPO, ORD/REC, PCC IT (for final sign-off — these are proposed-and-justified, not
institutionally confirmed; see 🟡 items in `9.1-review-and-open-questions.md`).

> **2026-07-02, revised:** None of the five ADRs below change as a result of
> `0.4-dpo-ethics-integration.md` (the DPO↔Ethics joint-clearance reconciliation) — that
> revision affects `system-design.md`'s §3 data model and §4 module boundaries only. Stack,
> auth, storage, and e-signature choices are unaffected.
>
> **2026-07-02, second revision:** ADR-003 (database engine) changed from PostgreSQL to
> **MySQL**, per the requester's explicit direction when confirming the stack. All other ADRs
> unchanged.

---

## Overview: Resolved System Architecture

| Layer | Choice |
|---|---|
| Frontend | React (confirmed, `8.0`) |
| Frontend/backend integration | **Inertia.js** (ADR-001) |
| Backend | Laravel, latest LTS (confirmed, `8.0`) |
| Authentication | **Laravel Breeze/Fortify (session-based), SSO-ready** (ADR-002) |
| Authorization | Laravel Policies + Gates mapped to `0.2`'s capability matrix (unchanged from `8.0`) |
| Database | **MySQL 8.0+** (ADR-003, confirmed by requester) |
| File storage | **Laravel Filesystem, local disk now, S3-compatible driver ready** (ADR-004) |
| E-signature | Typed-name + timestamp + IP/device log, `signature_pad` canvas capture for the visual signature (see ADR-005 in "Additional decisions" below) |
| Queue | Laravel Queues, database driver | 
| PDF generation | `spatie/laravel-pdf` |

---

## ADR-001: Inertia.js vs. Separate React SPA + Laravel REST API

**Status:** Implemented (2026-07-02 onward — every module (`DPREQ`, `DPNDA`, `REMIS`, Reporting,
Admin) is built entirely on Inertia page responses; no separate REST/API layer exists or has
been needed)
**Date:** 2026-07-02
**Deciders:** Dev team, IT (infra implications)

### Context
`8.0-tech-stack.md` left this as the single decision affecting "almost every layer" —
authentication mechanism, state management, form handling, and API surface all depend on it.
PCC-EDMS is an internal, authenticated, form-and-workflow-heavy institutional system (§1 of
`system-design.md`) — not a public API product and not a system with a stated mobile-app
requirement.

### Decision
Use **Inertia.js**.

### Options Considered

#### Option A: Inertia.js
| Dimension | Assessment |
|---|---|
| Complexity | Low — no separate API auth layer, no CORS, routing lives in Laravel |
| Cost | Low — one fewer moving part to build and maintain |
| Scalability | Sufficient — Inertia doesn't limit horizontal scaling of the Laravel app |
| Team familiarity | Assumed moderate (standard Laravel+React pairing, well-documented) |

**Pros:** Session-based auth "just works" with Laravel's native tooling (no token management);
one routing system instead of two; faster to build the 3-module, form-heavy UI this system
mostly is; smaller surface area for a small team to own long-term.
**Cons:** Tighter coupling between frontend and Laravel's response cycle; a future standalone
mobile app or third-party API consumer would need a genuinely separate API layer added later.

#### Option B: Separate React SPA + Laravel REST API
| Dimension | Assessment |
|---|---|
| Complexity | Higher — token auth (Sanctum), CORS config, two deploy artifacts |
| Cost | Higher — more infrastructure surface, more to secure and monitor |
| Scalability | Marginally better for independent frontend/backend scaling (not a driver here) |
| Team familiarity | Assumed similar |

**Pros:** Clean API boundary reusable by a future mobile app or external integration; frontend
and backend deploy independently.
**Cons:** No stated mobile-app or third-party-integration requirement anywhere in `0.1`–`9.1` to
justify the extra complexity up front; token auth adds real security surface (token storage,
refresh, revocation) for no immediate benefit.

### Trade-off Analysis
The deciding factor is that nothing in the requirements calls for an independent API consumer.
`0.1`'s out-of-scope list doesn't mention a mobile app, and REMIS/DPREQ/DPNDA are all
form-and-approval-workflow UIs best served by Inertia's page-prop model. If a mobile app or
public API becomes a real requirement later, Laravel can expose a versioned REST API alongside
Inertia routes without re-architecting the backend — the module/service boundaries in
`system-design.md` §4 are already REST-shaped underneath, Inertia is just the transport for the
web frontend.

### Consequences
- Easier: auth, forms (Laravel Precognition for server-validated client-side validation),
  routing, initial build velocity.
- Harder: adding a fully independent API consumer later (not free, but not a rewrite either).
- Revisit if: a mobile app, kiosk mode, or external-system integration becomes a real
  requirement.

### Action Items
1. [x] Scaffold with Laravel Breeze's Inertia + React starter kit — done, session 1.
2. [ ] Confirm with dev team that no near-term mobile app is planned — never explicitly asked;
   moot in practice, since every module has been built Inertia-only regardless and no mobile
   requirement has surfaced across any session since.

---

## ADR-002: Authentication — Standalone Accounts vs. Institutional SSO

**Status:** Implemented (standalone path) / Proposed (SSO fast-follow) — standalone email/
password accounts, admin-created accounts, bulk CSV import, and email verification are all
built and in production use (`docs/HANDOFF.md` Parts F–H). SSO itself is not built. The
requester recalls PCC uses Microsoft 365 as a former student (`docs/9.1`, `docs/HANDOFF.md`
Part G addendum item 3) — a likely lead on the provider, not an IT confirmation, and no
credentials exist yet to build against.
**Date:** 2026-07-02

### Context
`8.0` asks whether PCC has an existing institutional login (Google Workspace/Microsoft 365) to
integrate with. No source doc confirms this either way — it's a 🔴 open item in
`9.1-review-and-open-questions.md`, not something this pass can resolve outright.

### Decision
Build **standalone email/password accounts as the default path** (via Laravel Breeze/Fortify),
with the `users` table schema (`system-design.md` §3.1) including a nullable `sso_subject_id`
column from day one so SSO can be added as an *additional* login method later without a schema
migration or breaking existing accounts. This unblocks development now without betting the
whole auth system on an unconfirmed institutional capability.

### Options Considered

#### Option A: Standalone accounts, SSO-ready
**Pros:** No dependency on an IT decision that hasn't been made; external researchers/OJTs
(who likely don't have PCC institutional accounts anyway, per `0.2`'s Researcher (External)/
OJT (External) roles) need standalone accounts regardless — so this path is required either way,
even if SSO is added later for internal users.
**Cons:** Internal staff/faculty get "yet another password" until SSO is layered in.

#### Option B: Institutional SSO only
**Pros:** One login for internal users, centralized deprovisioning when someone leaves PCC.
**Cons:** Doesn't work for external researchers/OJTs/student teachers at all — `0.2`'s role
list explicitly includes external actors who need accounts. SSO-only would require a *second*
auth path anyway, so it isn't actually simpler.

### Trade-off Analysis
Because PCC-EDMS's own role list requires external-user accounts regardless of the SSO
decision, "SSO-only" was never really a complete option — it was always going to be
SSO-for-internal + standalone-for-external, or standalone-for-everyone. Building
standalone-for-everyone first, with the schema ready for SSO, means zero rework whichever way
IT's answer lands, and doesn't block current progress on an unanswered question.

### Consequences
- Easier: ship now; onboard external users cleanly.
- Harder: nothing structurally — this is additive, not a fork.
- Revisit when: PCC IT confirms whether Google Workspace/Microsoft 365 SSO is available for
  internal accounts; if yes, add Laravel Socialite for that provider as a second login path.

### Action Items
1. [ ] Confirm with PCC IT whether institutional SSO exists and is usable for this system —
   likely Microsoft Entra ID per the requester's recollection (Part G addendum), but this still
   needs an actual IT confirmation, not a former student's memory.
2. [ ] If yes, IT registers an app in Entra ID and issues a client ID/secret/tenant ID — required
   before any Socialite integration can be built or tested, not just scoped.

---

## ADR-003: Database Engine — MySQL vs. PostgreSQL

**Status:** Confirmed by requester, 2026-07-02
**Date:** 2026-07-02 (superseded same-day — see note)

### Decision
**MySQL.** This overrides the original proposal below (PostgreSQL), per explicit direction from
the requester: "React+Inertia+Laravel+MySQL, since it is a web development project anyways" —
i.e., prioritize the most common/best-supported Laravel hosting target over the reporting-query
ergonomics that motivated the original Postgres recommendation.

### Options Considered

#### Option A: MySQL — **chosen**
| Dimension | Assessment |
|---|---|
| Complexity | Comparable to PostgreSQL under Laravel — both are first-class supported |
| Cost | Comparable |
| Scalability | Sufficient — MySQL 8.0+ supports JSON columns and window functions, closing most of the gap with Postgres for this system's report volume (institutional scale, §1 of `system-design.md`) |
| Hosting/team fit | Best fit for `7.0-deployment.md`'s undecided/likely shared or conventional PHP hosting — MySQL is the more universally available engine on Laravel-targeted hosts, and the requester weighted this over marginal reporting-query ergonomics |

**Pros:** Broadest hosting compatibility (relevant since `7.0` hosting is still undecided);
extremely common Laravel default, lowest operational-surprise risk for a small institutional
dev team; MySQL 8.0+ closes most of the JSON/window-function gap that motivated the original
Postgres lean.
**Cons:** Marginally less ergonomic than Postgres for some heavy cross-tab aggregations in
`5.1`–`5.3` — mitigated by keeping report queries in the `Reporting` module (`system-design.md`
§4) behind a service boundary, so query complexity is isolated and any engine-specific tuning
stays in one place.

#### Option B: PostgreSQL (original recommendation, not chosen)
**Pros:** Slightly better native JSON querying and window-function ergonomics for the
report-heavy read patterns in `5.x`.
**Cons:** Less universally available on conventional PHP/Laravel hosting than MySQL — a real
constraint given `7.0`'s hosting decision isn't made yet.

### Trade-off Analysis
The original ADR-003 leaned Postgres purely on report-query ergonomics. The requester's
priority — MySQL as the standard, best-supported choice for "a web development project," ahead
of hosting decisions in `7.0` being finalized — outweighs that marginal ergonomic gap, especially
since MySQL 8.0+ narrows it substantially (JSON columns, CTEs, window functions all supported).
Nothing in `system-design.md`'s schema (§3) is Postgres-specific; the `json` columns on
`dpreq_applications.data_types`, `audit_log.old_value`/`new_value`, `decisions.signatories`,
etc. all map directly to MySQL's native `JSON` type with no schema changes required.

### Consequences
- Easier: hosting compatibility, team/community familiarity, broadest deployment target support.
- Harder: nothing structural — Eloquent abstracts most engine differences; report queries in the
  `Reporting` module may need minor query-syntax adjustments versus a Postgres-first draft, but
  no schema redesign.
- Revisit: only if a specific report's aggregation performance becomes a real bottleneck at
  production scale — not expected at this system's institutional volume (`system-design.md` §1).

### Action Items
1. [x] Confirm database engine with requester — MySQL, confirmed 2026-07-02.
2. [ ] Use MySQL 8.0+ specifically (not 5.7) to ensure JSON/window-function/CTE support assumed
   above is actually available — local dev already runs 8.4.3, so this is really a note for
   whoever provisions the production database once `7.0`'s hosting decision lands, not an
   open risk today.

---

## ADR-004: Object Storage — Local Disk vs. S3-Compatible

**Status:** Implemented (local disk, S3-ready) — the `documents` disk in `config/filesystems.php`
is driven entirely by `DOCUMENTS_DISK_DRIVER` in `.env` (defaults to `local`), and every file
write in the codebase goes through `DocumentService`/`Storage::disk('documents')`, never a raw
filesystem call. Switching to S3 when `7.0`'s hosting decision lands is a `.env` change only.
**Date:** 2026-07-02

### Decision
**Local disk now, via Laravel's Filesystem abstraction, with an S3-compatible driver
pre-wired and switchable via `.env` alone** — no code changes required to move later.

### Options Considered

#### Option A: Local disk, S3-ready
**Pros:** No dependency on a storage decision that `7.0-deployment.md` explicitly says isn't
made yet ("Not yet decided"); Laravel's Filesystem makes the eventual switch a config change,
per `7.0`'s own portability mandate ("File storage must be abstracted... local disk now, S3
later without code changes").
**Cons:** Local disk needs a real backup story from day one (documents are legally
retained per `1.3`'s retention rules) — this isn't optional even though it's not S3.

#### Option B: S3-compatible object storage from day one
**Pros:** One less migration to do later; built-in redundancy depending on provider.
**Cons:** Requires committing to a specific provider/cost before hosting is decided (`7.0`),
and before the storage-capacity/backup requirements in `7.0`'s checklist are answered.

### Trade-off Analysis
This is `7.0-deployment.md`'s own recommendation, restated as a formal decision: don't block on
an unmade hosting choice, but don't leave the code coupled to local disk either. The Filesystem
abstraction makes this a non-decision at the code level — the real decision (which provider,
what cost) belongs to whoever finalizes `7.0`, not to this architecture pass.

### Consequences
- Easier: development can start immediately without a storage vendor decision.
- Harder: local disk requires the dev/ops team to own backup scheduling manually until S3
  migration (flag this explicitly in `7.0`'s checklist — it's currently just "Backup schedule
  and retention: confirm," which undersells that this is needed *before* go-live, not after).
- Revisit: the moment `7.0`'s hosting/domain decision is made.

### Action Items
1. [x] Implement all file writes through `Storage::disk('documents')`, never raw filesystem
   calls, so the disk config is the only thing that changes later — done; `DocumentService` is
   the sole write path across every module.
2. [ ] Stand up a local-disk backup job now (don't wait for S3 migration to start backing up
   legally-retained documents) — still not done; genuinely needed before any real go-live, not
   just a nice-to-have.

---

## Additional decision surfaced during this pass

### ADR-005: E-Signature Capture Method

**Status:** Implemented (2026-07-03 — `signature_pad` canvas capture built into DPREQ NDA
signing, DPNDA trainee/coordinator signing, and REMIS endorsement/decision signing; see
`docs/HANDOFF.md` for the session this landed in)
**Date:** 2026-07-02

`4.3-esignature-notifications.md` left three options open. This wasn't one of the four `8.0`
decisions but blocks the same layer (`signature_pad` dependency in `8.0`'s frontend table), so
resolving it here keeps the architecture internally consistent.

**Decision:** Hybrid — **typed full name + timestamp + IP/device log as the legally-operative
signature record** (per Philippine E-Commerce Act, RA 8792, which recognizes electronic
signatures without requiring a biometric/drawn signature), **plus a `signature_pad`
canvas-drawn signature captured alongside it for visual/UX familiarity** on the PDF output. The
canvas image is cosmetic on the certificate; the typed-name + metadata record is what's stored
in `documents`/`audit_log` as the binding signature event (`system-design.md`'s
`clearance_certificates.signed_by` + `audit_log` event).

**Why not third-party e-signature provider:** adds a recurring vendor cost and an external
dependency for a system that's otherwise entirely self-hosted per `7.0`'s portability goals; the
hybrid approach meets the same legal bar without it. Revisit only if DPO/Legal specifically
require a provider with independent certification (e.g. for external legal enforceability
beyond RA 8792).

**Consequences:** Easier — no vendor integration, no per-signature cost. Harder — the
typed-name approach's legal sufficiency should get an explicit nod from DPO/Legal before this
is treated as fully closed (flagged 🔴 in `9.1-review-and-open-questions.md`).

---

## Summary: What This Resolves in `9.0`

Per `9.0-master-prompt.md` step 3, this document plus `system-design.md` together provide:
(a) system architecture — this file; (b) normalized data model — `system-design.md` §3;
(c) API/module boundaries — `system-design.md` §4; (d) portability confirmation — every ADR
above explicitly defers hosting-specific commitments to `.env` and `7.0`, consistent with
`7.0-deployment.md`'s own requirement.

**Per step 4: this architecture and data model should be reviewed and confirmed before any
implementation begins** — see the confirmation gate at the end of this session's summary.
