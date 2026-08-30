# Training Guide — Role Quick-Reference (PCC-EDMS)

_Written 2026-08-31 for the Phase D training/handover in `ROADMAP-TO-COMPLETION.md`. One section
per role: what the person does day-to-day, which pages they use, what notifications they receive,
and the one thing they must never do. Companion documents: `docs/WORKFLOWS.md` (the full
processes), `docs/UAT-SCRIPT.md` (hands-on practice scenarios), `GETTING_STARTED.md` (accounts
and environment)._

## Before the role sections

- **One person, one account.** Every action is written to the audit trail with your name. There
  is no "office login."
- **Your typed full name is your legal signature** (RA 8792). Signing also records the time,
  your IP address, and your device.
- **Notifications** arrive two ways: the in-app bell (top right; full history at
  `/notifications`) and email. Until real mail is configured, emails are written to
  `storage/logs/laravel.log` instead — see `docs/EMAIL_SETUP.md`.
- **PDFs** (clearances, exemption certificates, NDAs, deficiency notices) are generated in the
  background; if a download link does not appear within moments, tell the system administrator
  — the queue worker may be down.
- Password for all training accounts is `password`; change it at `/profile` in production.

---

## Researcher (Internal / External)

**Day-to-day:**
- Submit one Form 1 at `/dpreq/create` — it starts both the data-privacy (DPREQ) and ethics
  (REMIS) tracks at once. Fill every section, including funding source, participants, ethics
  checklist, risk band, and data classification, and upload the required documents.
- Add co-researchers (name + email) on Form 1 — each becomes an NDA signatory.
- Answer revision requests from staff (text and/or file) and resubmit when a record is returned.
- After the DPO approves, sign the Research Team NDA; the leader can resend or remove
  co-researcher signing links.
- Download your Data Privacy Clearance and Research Ethics Clearance / Certificate of Exemption.
- While your approved study is monitored: file a monthly progress report; end the study by
  submitting the Final Ethics Completion Report (closes and archives the record).
- If a data/confidentiality breach incident pauses your monitoring, put corrective actions in
  place, then click Resume Monitoring.

**Pages:** `/dashboard`, `/dpreq` and `/dpreq/create`, `/remis/{id}`, `/incidents`, notification bell.

**Notifications:** submission received; returned for correction / revision requested; DPO
approved — sign the Team NDA; endorsement progress; decision issued; clearance/exemption ready to
download; monitoring resumed.

**Never do this:** let anyone else sign for you — or sign for a co-researcher. Each signature is
an individual legal act tied to one identity.

---

## Adviser

**Day-to-day:**
- First step of the REMIS endorsement chain for applications from your own classes/advisees:
  Approve (forward to the Program Head), Return with Comments, or Reject.
- Onboard your classes once per term at `/adviser/cohorts`: create a cohort, share the join
  code/link/QR in class; students enrol themselves. Set the optional expiry, headcount cap, and
  allowed email domains; close the class or regenerate the code any time.
- For students who cannot self-enrol, add them manually (one at a time or a pasted list) — they
  receive a single-use invitation link; no account exists until they accept.
- Watch your endorser dashboard for applications waiting on you.

**Pages:** `/dashboard`, `/adviser/cohorts`, `/remis/{id}`.

**Notifications:** REMIS application awaiting your endorsement; resubmitted application back at
your step; endorsement advanced.

**Never do this:** endorse a study you have not actually reviewed — your endorsement, remarks,
and signature are recorded permanently on the record.

---

## Program Head

**Day-to-day:**
- Second step of the endorsement chain: review what the Adviser endorsed, then Approve (forward
  to the Dean), Return with Comments, or Reject.
- Monitor your endorser dashboard for pending endorsements.

**Pages:** `/dashboard`, `/remis/{id}`.

**Notifications:** REMIS application awaiting your endorsement; resubmissions returning to your
step.

**Never do this:** share your account or let staff endorse from your login — the endorsement
records your name, IP, and device, and the audit trail will show it was you.

---

## Dean

**Day-to-day:**
- Final academic endorsement: Approve (sends the application to the Ethics Secretariat for
  screening), Return with Comments, or Reject (terminal — the application is disapproved).

**Pages:** `/dashboard`, `/remis/{id}`.

**Notifications:** REMIS application awaiting your endorsement; resubmissions returning to your
step.

**Never do this:** delegate your approval to an assistant or secretary — only your account may
perform the Dean's endorsement.

---

## DPO Staff

**Day-to-day:**
- You own the whole DPO track. For each DPREQ: Start Review; Return for Correction with
  comments; raise mandatory revision/document requests in the revision panel; Reject with reason;
  or Approve.
- Approval opens the Research Team NDA for signing; the Data Privacy Clearance (Control Number
  `DPREQ-YYYY-NNNNNN`) issues automatically once every team member has signed — you cannot
  approve while mandatory revision items are outstanding.
- You receive data-breach and confidentiality-breach incidents from REMIS studies — treat them
  as potential Data Privacy Act matters.
- Declined trainee NDAs come to you for the record; completed NDAs feed your reports.
- Run the DPO reports; review the audit trail.

**Pages:** `/dpreq`, `/dpnda`, `/incidents`, `/reports`, `/admin/audit-trail`.

**Notifications:** new DPREQ submission / resubmission; NDA declined; NDA fully executed;
DPO-relevant incident filed.

**Never do this:** approve over an unresolved mandatory revision item or before the team NDA is
fully signed — the gates exist for compliance; do not look for ways around them.

---

## Ethics Secretariat

**Day-to-day:**
- Administrative screening once the endorsement chain completes: work the completeness checklist
  and mark **Complete** (goes to review) or **Incomplete / Returned for Compliance** (goes back
  to the researcher and a deficiency notice is generated automatically).
- Manage incidents: assign them, add investigation notes, move them reported → under
  investigation → corrective action → resolved → closed.
- Run the ORD/shared reports.

**Pages:** `/remis/{id}`, `/incidents`, `/reports`.

**Notifications:** application ready for screening; resubmitted application; incident reported.

**Never do this:** mark a screening Complete while a required document is missing — the
deficiency notice exists precisely so gaps are recorded, not absorbed.

---

## Ethics Reviewer

**Day-to-day:**
- Review only the studies the Chair assigns to you: classify the risk (minimal/moderate/high),
  assess each ethics criterion (Met / Concerns / Not met), and submit your recommendation
  (Approve / Minor Revision / Major Revision / Disapprove).
- The Chair cannot decide until every assigned reviewer has submitted — submit promptly.
- During monitoring, log an informational compliance verdict (Compliant / Minor Issues / Major
  Issues / Non-Compliant) on each monthly progress report.
- File an incident if you discover one during review or monitoring.

**Pages:** `/remis/{id}` (assigned studies), `/incidents`.

**Notifications:** you were assigned a review; application resubmitted for review; monitoring /
progress-report activity on your studies.

**Never do this:** submit a review or recommendation for another reviewer's assignment — panels
only work if each verdict is genuinely independent.

---

## Ethics Committee Chair

**Day-to-day:**
- Assign the reviewer panel for each screened application (by reviewer email; one or several).
- Consolidate the panel and issue the decision: Approved, Approved with Conditions, Exempted
  (Certificate of Exemption — no monitoring follows), Deferred (reactivate later), Return for
  Revision, or Disapproved. Your typed signature signs the Ethics certificate.
- Exempted studies rest at clearance issued; approved studies enter monthly monitoring
  automatically.
- Manage incidents alongside the Secretariat; review the audit trail and ORD reports.

**Pages:** `/remis/{id}`, `/incidents`, `/reports`, `/admin/audit-trail`.

**Notifications:** incident reported; application reactivated; clearance/exemption events.

**Never do this:** issue a decision before every assigned reviewer has submitted — the system
blocks it, and consolidating a half-reported panel invalidates the decision.

---

## Department Coordinator

**Day-to-day:**
- Create OJT/trainee placements one at a time (`/dpnda/create`) or in bulk from a CSV at
  `/dpnda/import` (preview shows invalid rows with reasons; nothing is created until you
  confirm; unknown trainee emails are invited automatically).
- Send each draft NDA for signing; countersign after the trainee signs — countersigning
  completes the record and generates the executed NDA PDF.
- After completion, upload the OJT Evaluation Report for the placement.
- Check the deployment calendar (`/dpnda/calendar`) for whereabouts by month.

**Pages:** `/dpnda`, `/dpnda/create`, `/dpnda/import`, `/dpnda/calendar`.

**Notifications:** trainee signed — countersignature needed; NDA declined; NDA fully executed.

**Never do this:** sign for a trainee, or countersign another coordinator's placement — each
signature must come from the person it belongs to.

---

## OJT Trainee

**Day-to-day:**
- When your coordinator sends the NDA for signing: read it, then sign with your typed full name
  (and drawn signature), or Decline with a reason if you cannot agree.
- Maintain your weekly deployment schedule (`/dpnda/schedules`).
- Once the coordinator countersigns, your NDA is completed — keep the PDF.

**Pages:** `/dpnda`, `/dpnda/schedules`, notification bell.

**Notifications:** NDA ready for signing; NDA fully executed.

**Never do this:** let anyone sign your NDA for you — it is your personal non-disclosure
undertaking.

---

## System Administrator

**Day-to-day:**
- Manage accounts at `/admin/users`: create staff accounts (role assigned directly, password
  setup email sent), edit, activate/suspend/deactivate in bulk, or bulk-import from CSV.
- Review external adviser account requests (`/admin/adviser-requests`).
- Investigate problems using the audit trail (`/admin/audit-trail`) — filter by date, event
  type, user, or record; record views are logged too.
- Run any report; keep the environment healthy (queue worker, mail, backups — see
  `DEPLOYMENT_CHECKLIST.md`).

**Pages:** `/admin/users`, `/admin/adviser-requests`, `/admin/audit-trail`, `/reports`.

**Notifications:** adviser account requests; system-level events.

**Never do this:** use admin access to approve, endorse, or sign on behalf of an office — admins
manage accounts and rights, never the workflow decisions themselves.

---

## Where to get help

- **DPREQ / DPNDA process questions:** the Data Privacy Office (DPO Staff).
- **REMIS / incident process questions:** the REC/ORD office (Ethics Secretariat).
- **Accounts, logins, roles, missing notifications:** the System Administrator (PCC IT).
- **Reference material:** `docs/WORKFLOWS.md` (end-to-end narratives), `docs/0.2` (roles and
  capabilities), `docs/UAT-SCRIPT.md` (practice scenarios), `GETTING_STARTED.md` (environment).
