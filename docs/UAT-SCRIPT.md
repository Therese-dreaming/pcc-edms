# UAT Script — PCC-EDMS Go-Live Sign-Off

_Written 2026-08-31 for the Phase D UAT round in `ROADMAP-TO-COMPLETION.md`: run these scenarios
on staging with real office staff, mark each Pass/Fail, and sign off per module. Every status,
button label, and gate below is taken from the running code (`app/Modules/*`, `app/Shared/*`) and
`docs/WORKFLOWS.md`, not from memory._

## Purpose

This script exercises every go-live-critical path of the three tracks — **DPREQ** (data-privacy
clearance), **REMIS** (ethics review), **DPNDA** (OJT/trainee NDAs) — plus incidents, reports,
the public verification portal, and the audit trail. One pass through Scenarios 1–14 is a complete
UAT round. A clean round is an input to the go/no-go decision; it does not replace the deployment
checklist (`DEPLOYMENT_CHECKLIST.md`).

## Environment prerequisites

A fresh instance is required before the round (and recommended between rounds):

```bash
composer install
npm install
php artisan migrate:fresh --seed   # wipes the database and seeds the test accounts
npm run build                      # or `npm run dev` for hot-reload during the session
php artisan serve                  # web server — http://localhost:8000
php artisan queue:work             # queue worker — REQUIRED, or no PDF will ever render
```

- **All seeded passwords are `password`.**
- Clearance certificates, exemption certificates, NDA PDFs, and deficiency notices are generated
  as queued jobs — keep `php artisan queue:work` running the whole round, and allow a few seconds
  after an issuance before expecting the download link.
- Email uses the `log` mailer by default: anything "emailed" (co-researcher signing links,
  trainee account invitations, notifications) appears in `storage/logs/laravel.log` instead of a
  real inbox. Wherever a step says "open the emailed link," paste the `/nda/sign/...` or
  `/join/invitation/...` URL from that log file. See `docs/EMAIL_SETUP.md` for real mail.
- `/verify` is rate-limited to 10 lookups per minute per IP — do the Scenario 12 lookups once,
  not in a loop.

## Seeded test accounts

Seeded by `database/seeders/UserSeeder.php`. Password for every account: `password`.

| Email | Role |
|---|---|
| `researcher@pcc.test` | Researcher (Internal) — submits Form 1 |
| `dpo.staff@pcc.test` | DPO Staff — screens/endorses DPREQ |
| `dpo.approver@pcc.test` | DPO Approver — approves DPREQ, signs DPO half of joint clearance |
| `coordinator@pcc.test` | Department Coordinator — creates OJT placements (DPNDA) |
| `trainee@pcc.test` | OJT Trainee — signs Form 5 NDA |
| `adviser@pcc.test` | Adviser — first REMIS endorsement step |
| `programhead@pcc.test` | Program Head — second REMIS endorsement step |
| `dean@pcc.test` | Dean — third REMIS endorsement step |
| `secretariat@pcc.test` | Ethics Secretariat — REMIS screening |
| `reviewer@pcc.test` | Ethics Reviewer — risk classification + review recommendation |
| `chair@pcc.test` | Ethics Committee Chair — assigns reviewers, issues decision |
| `admin@pcc.test` | System Administrator |

> Note: the table above is reproduced from `GETTING_STARTED.md` for reference, with two
> corrections. (1) The DPO Approver **role was retired 2026-07-06** and `UserSeeder.php` no
> longer creates that account — DPO Staff (`dpo.staff@pcc.test`) owns the entire DPO track end
> to end, and all scenarios below use only that account. (2) The "joint clearance" phrasing on
> the DPO Approver and Chair rows predates 2026-07-25: the two offices now issue **independent
> certificates** — DPO signs the DPREQ clearance, the Chair signs the REMIS clearance/exemption,
> and neither waits for the other (see `docs/0.4`).

## Number conventions used below

| What | Format |
|---|---|
| DPREQ tracking number | `DPREQ-YYYY-NNNN` |
| REMIS tracking number | `REC-YYYY-NNNN` |
| Research Team NDA tracking number | `RTNDA-YYYY-NNNN` |
| DPNDA tracking number | `DPNDA-YYYY-NNNN` |
| DPO clearance Control Number | `DPREQ-YYYY-NNNNNN` (6 digits, issued at clearance, never reused) |
| Ethics clearance/exemption Control Number | `REMIS-YYYY-NNNNNN` (6 digits) |

## How to record results

Each scenario ends with a checkbox. Mark `[x]` for Pass, leave `[ ]` and note the failure for
Fail. Failures that block later scenarios (e.g. Scenario 1 failing) stop the round — reseed and
restart.

---

## Scenario 1 — Researcher submits Form 1 (unified intake)

**Account:** `researcher@pcc.test` (Researcher, Internal)

**Steps:**

1. Log in, open **DPREQ → New** (`/dpreq/create`).
2. Fill the application basics: research title, adviser name (`Adam Adviser`), research category,
   applicant category (Student or Employee — the form shows level/course/section for students,
   position for employees), contact number, respondents, target respondent count, data collection
   method, data capturing tool, target start/end dates, and whether minors are involved.
3. Fill the **unified-intake sections** added to Form 1:
   - Funding source type (self-funded / university-funded / externally-funded / other).
   - Recruitment method and target participants (students, employees, faculty, parents,
     community members, minors, vulnerable groups, others).
   - Ethics checklist — answer each item yes / no / not applicable.
   - Risk band (none / minimal / moderate / high) plus a short explanation.
   - Data classification (non-personal / personal information / sensitive personal information /
     privileged information) plus data storage method, who has access, retention period, and
     disposal method.
4. Fill the Form 1 review checklist (voluntary participation, confidentiality, free withdrawal,
   avoid harm, academic use only) and draw the researcher signature (PNG pad).
5. Fill the DPO data-privacy section (purpose, data types, data subjects, retention plan,
   third-party sharing) and the ethics study section (study type, design, sites, target
   population, participant count, inclusion/exclusion criteria, risks, benefits, confidentiality
   measures, consent process, data storage plan).
6. Add one co-researcher (full name + any email address, e.g. `co.researcher@example.test`).
7. Upload the mandatory documents: Research Proposal, Consent Form, Research Instrument
   (plus Parent Consent and Assent Form if you ticked minors involved). Optionally attach one
   additional supporting document with a label.
8. Submit.

**Expected result:**

- Submission succeeds in one action. Two records exist: `DPREQ-YYYY-NNNN` in status
  **Submitted** and `REC-YYYY-NNNN` in status **Under Endorsement** (adviser's turn).
- The researcher and DPO Staff each get an in-app notification about the DPREQ submission; the
  researcher and the Adviser get one about the REMIS submission. The co-researcher gets a
  heads-up email (no signing link yet — see Scenario 3).
- **No Research Team NDA exists yet** — signing opens only when the DPO approves
  (changed 2026-07-26). Note both tracking numbers for later scenarios.

**Result:** [ ] Pass

---

## Scenario 2 — DPO Staff reviews, requests a mandatory revision, then clears the gate

**Account:** `dpo.staff@pcc.test` (DPO Staff), then `researcher@pcc.test`

**Steps:**

1. As DPO Staff, open the DPREQ application (`/dpreq` → the record) and click **Start Review**
   — status becomes **Under Review**.
2. In the revision panel, raise a **mandatory revision request**: kind *document required*
   (or comment), mark it mandatory, give it an item description (e.g. "Upload the signed data
   privacy impact assessment"), optional due date. Send.
3. Still as DPO Staff, try to **Approve** now.
4. Log in as the researcher, open the same DPREQ record, find the revision request, and
   **respond** with a short note and an uploaded file.
5. Back as DPO Staff, **resolve** the revision request.

**Expected result:**

- The applicant is notified when the revision request is raised.
- Step 3 is **blocked**: approval fails with a message that outstanding required items must be
  provided first. This gate is the point of the scenario.
- After the applicant responds and staff resolves, the revision shows resolved and the approval
  gate is clear.

**Result:** [ ] Pass

---

## Scenario 3 — DPO approval, team NDA signatures, DPO clearance issuance

**Accounts:** `dpo.staff@pcc.test`, then `researcher@pcc.test`, then the co-researcher's signing link

**Steps:**

1. As DPO Staff, **Approve** the application. Confirm the dialog ("Approval opens the Research
   Team NDA for signing...").
2. Log in as the researcher and open the DPREQ record: a **Research Team NDA** panel now exists
   (`RTNDA-YYYY-NNNN`, Pending Signatures) with the researcher as *leader* and the co-researcher
   listed as *Invited*.
3. As the researcher, **Sign this NDA**: type your full name, draw the signature, submit.
4. Retrieve the co-researcher's single-use signing link from `storage/logs/laravel.log`
   (a `/nda/sign/{token}` URL) and open it in a private/incognito window — no login. Type the
   co-researcher's full name and sign.
5. Refresh the DPREQ record.

**Expected result:**

- Approval alone does **not** issue the clearance — status is **Approved**, and the researcher
  receives the "Application approved — sign the Team NDA" notification.
- The DPO clearance issues **only after the last signature**: once the co-researcher signs, the
  NDA becomes **Fully Signed / Completed**, the DPREQ application moves
  **Approved → Clearance Issued**, a fresh Control Number `DPREQ-YYYY-NNNNNN` appears, the
  applicant is notified the clearance is ready to download, and the Data Privacy Clearance PDF
  download link appears (queue worker must have processed the job).
- The Data Privacy Clearance is valid until the study's target end date and is issued
  independently of the ethics track — it does not wait for REMIS.
- (Optional negative check: re-opening the signing link a second time is refused — links are
  single-use and expire after 14 days.)

**Result:** [ ] Pass

---

## Scenario 4 — REMIS endorsement chain: adviser → program head → dean

**Accounts:** `adviser@pcc.test`, `programhead@pcc.test`, `dean@pcc.test`

**Steps:**

1. As the Adviser, open the REMIS record (`/remis/{id}` from Scenario 1) and in **Submit
   Endorsement** choose *Approve (forward to next endorser)*, add remarks, type your full name
   to sign, submit.
2. Repeat as the Program Head, then as the Dean.

**Expected result:**

- The chain advances strictly in order; each endorsement records the endorser, date/time,
   remarks, and e-signature, and the endorsement chain card updates at each step.
- Nobody can act out of turn: the Program Head sees no action until the Adviser approves, and so
   on. (Reject asks for the endorser's account password as confirmation.)
- After the Dean approves, the status becomes **For Screening** and the Ethics Secretariat is
   notified. The researcher is notified at each advance.

**Result:** [ ] Pass

---

## Scenario 5 — Secretariat screening: deficient (with auto notice), then complete

**Accounts:** `secretariat@pcc.test`, then `researcher@pcc.test`

**Steps:**

1. As the Ethics Secretariat, open the REMIS record (now **For Screening**). Tick the
   completeness checklist (proposal attached, consent form attached, instrument attached,
   signatures complete, required templates used) — leave at least one unticked, choose
   **Incomplete** (or *Returned for Compliance*), add comments, and **Submit Screening**.
2. Log in as the researcher: confirm the notification, then **resubmit** the application.
3. Back as the Secretariat, screen again — all items ticked, decision **Complete**, submit.

**Expected result:**

- The deficient outcome moves the application to **For Revision**, notifies the researcher, and
  queues a **deficiency notice PDF** that is generated automatically (check the download on the
  record after the queue worker processes it).
- Resubmission returns the application to **For Screening** (not back to endorsement).
- The complete outcome moves it to **For Review**, and the Ethics Reviewer role gets a heads-up
  that a study is ready for review assignment.

**Result:** [ ] Pass

---

## Scenario 6 — Chair assigns the reviewer panel; reviewers submit

**Accounts:** `chair@pcc.test`, then `reviewer@pcc.test`

**Steps:**

1. As the Ethics Committee Chair, open the REMIS record (now **For Review**) and in **Assign
   Reviewer** enter `reviewer@pcc.test`, click **Assign**. (The panel supports multiple
   reviewers — add more accounts here if your staging environment has them; the seeded set has
   one.)
2. Log in as the reviewer, open the record, and in **Risk Classification & Review**: choose a
   risk level (Minimal/Expedited, Moderate/Committee, or High/Full Board) with rationale, give a
   verdict (Met / Concerns / Not met) on each of the ethics review criteria, choose a
   recommendation (Approve / Minor Revision / Major Revision / Disapprove), add comments, and
   **Submit Review**.

**Expected result:**

- The assigned reviewer is notified; only an assigned reviewer can submit a review, and only
  while the application is **For Review**.
- After submission, the panel card shows the reviewer's risk classification and recommendation,
  and the chair sees how many reviewers have submitted.

**Result:** [ ] Pass

---

## Scenario 7 — Chair decides: Approved → ethics clearance + monitoring starts

**Account:** `chair@pcc.test`, then `researcher@pcc.test`

**Steps:**

1. As the Chair, with every assigned reviewer having submitted, open **Issue Decision**, choose
   **Approved**, add remarks, type your full name to sign, optionally draw the signature, submit.
2. Refresh the REMIS record.

**Expected result:**

- If any assigned reviewer had not submitted, the decision would be blocked — it is allowed only
  when the whole panel has reported.
- The application moves to **Clearance Issued** and then automatically straight into
  **Monitoring**; the researcher is notified of the decision and of the clearance.
- A fresh Control Number `REMIS-YYYY-NNNNNN` is issued and the **Research Ethics Clearance** PDF
  becomes downloadable (queue worker).
- The **Monitoring & Completion** card appears with the progress-report area: the researcher can
  file the monthly Research Progress Report (status of study, participants recruited, ethics
  concerns, protocol deviations, corrective actions, attachments).
- The shared overall status reads **Partially Cleared** if the DPO side had not issued yet, or
  **Clearance Issued** once both tracks have (Scenario 3 already cleared the DPO side, so it
  should read fully cleared).

**Result:** [ ] Pass

---

## Scenario 8 — Exempted decision: Certificate of Exemption, no monitoring

**Accounts:** `researcher@pcc.test`, then the full chain quickly, ending with `chair@pcc.test`

**Steps:**

1. As the researcher, submit a **second** Form 1 (any minimal-risk study; all fields as in
   Scenario 1).
2. Run the chain quickly on this second application: adviser → program head → dean endorse
   (Scenario 4), secretariat screens **Complete** (Scenario 5, step 3), chair assigns
   `reviewer@pcc.test` and the reviewer submits (Scenario 6).
3. As the Chair, **Issue Decision** with outcome **Exempted (Certificate of Exemption)**,
   remarks, typed signature.

**Expected result:**

- The Ethics side issues a **Certificate of Exemption** (not a clearance): Control Number
  `REMIS-YYYY-NNNNNN`, exemption PDF generated, researcher notified that the *exemption* is
  ready to download.
- The study rests at **Clearance Issued**. It does **NOT** enter Monitoring: there is no
  monitoring status, no Monitoring & Completion card with progress reports, and no monthly
  reporting obligation. (Roadmap decision B2: exempted studies never enter monitoring or
  auto-archive.)
- `/verify` for this Control Number labels it correctly — see Scenario 12.

**Result:** [ ] Pass

---

## Scenario 9 — Data-breach incident: monitoring auto-pauses, researcher resumes

**Accounts:** `researcher@pcc.test` (or any ethics role), then `chair@pcc.test` / `secretariat@pcc.test` / `dpo.staff@pcc.test` (notifications), then `researcher@pcc.test`

**Steps:**

1. On the **monitoring** study from Scenario 7, click **Report Incident** and file an incident:
   type **Data Breach**, severity (e.g. High), date of incident, description, optional immediate
   actions.
2. Check the notifications of the Ethics Committee Chair, Ethics Secretariat, and DPO Staff.
3. Refresh the REMIS record.
4. As the researcher (the study's own applicant), click the **Resume Monitoring** button shown in
   the "Monitoring is paused" banner.

**Expected result:**

- Filing notifies the Chair and the Secretariat immediately; because the type is a Data Breach,
  **DPO Staff is also notified directly** (the REMIS → DPO integration point).
- The study status flips **Monitoring → Monitoring Paused** automatically; progress reports are
  suspended while paused.
- Only the study's own researcher sees/uses the **Resume Monitoring** button; clicking it returns
  the status to **Monitoring** and notifies the researcher that monitoring has resumed.
- (Optional extension: as Secretariat or Chair, work the incident itself — assign it, add
  investigation notes, move it reported → under investigation → corrective action in progress →
  resolved → closed, and set/complete/verify a corrective action.)

**Result:** [ ] Pass

---

## Scenario 10 — Coordinator creates a placement; trainee signs; coordinator countersigns

**Accounts:** `coordinator@pcc.test`, then `trainee@pcc.test`

**Steps:**

1. As the Department Coordinator, open **DPNDA → New** (`/dpnda/create`). Enter the trainee's
   email `trainee@pcc.test` (an existing account), names, enrolled school, trainee type
   (internal OJT / external OJT / community service), department assigned, PCC supervisor,
   start and end dates (end on/after start), guardian if applicable. Submit.
2. Open the new record (`DPNDA-YYYY-NNNN`, Draft) and **Send for Signing**.
3. As the trainee, open the record and **sign**: type full name, draw signature, submit.
4. As the coordinator, **countersign** the same way.

**Expected result:**

- The trainee is notified when the NDA is ready for signing; the coordinator is notified that a
  countersignature is needed once the trainee signs.
- Countersigning moves the record through **Coordinator Countersigned** straight into
  **Completed** in the same action (no separate "mark complete" step), generates the fully
  executed NDA PDF (queue worker), and notifies the trainee, the coordinator, and DPO Staff.
- (Optional negative check: on a fresh placement, have the trainee **Decline** with a reason —
  the record becomes Declined, terminal, and both the coordinator and DPO Staff are notified.)
- (Optional: after completion, the coordinator can upload the OJT Evaluation Report for the
  placement.)

**Result:** [ ] Pass

---

## Scenario 11 — Coordinator batch-imports placements from CSV

**Account:** `coordinator@pcc.test`

**Steps:**

1. Prepare a CSV with the header row:
   `trainee_email,trainee_last_name,trainee_first_name,gender,age,enrolled_school,hours_needed,trainee_type,department,level,course,section,department_assigned,pcc_supervisor,endorsed_by,start_date,end_date,guardian_name`
   and three data rows:
   - Row A — valid, known trainee: `trainee@pcc.test`, `internal_ojt`, valid dates.
   - Row B — valid, **unknown** trainee: e.g. `new.trainee@example.test`, `external_ojt`,
     valid dates.
   - Row C — invalid: e.g. a malformed email (or a duplicate of Row A's email, or `end_date`
     before `start_date`).
2. Open `/dpnda/import` and upload the file (**Preview import**).
3. Review the preview, then **Confirm import**.

**Expected result:**

- The preview lists every row and flags **Row C as invalid with the specific reason** (bad
  email / duplicate email in file / date problem), and shows 2 valid of 3. Nothing is created
  before confirm.
- Confirming creates placements + draft DPNDA records for the two valid rows only, skipping the
  invalid one, and reports the created/skipped counts.
- Row B's unknown trainee gets an **account invited automatically** (trainee role per
  `trainee_type`) with a setup email — the invited count is reported; Row A reuses the existing
  account without creating a duplicate.
- The new records appear in `/dpnda` as Drafts, ready for Scenario 10's signing flow.

**Result:** [ ] Pass

---

## Scenario 12 — Public /verify returns the right instrument label

**Account:** none — `/verify` is public (use a private window)

**Steps:**

1. Look up the DPO Control Number from Scenario 3.
2. Look up the REMIS Control Number from Scenario 7 (approved study).
3. Look up the REMIS Control Number from Scenario 8 (exempted study).
4. Look up a made-up number, e.g. `REMIS-2026-000000`.

**Expected result:**

- Step 1 returns track DPO, instrument **"Data Privacy Clearance"**, valid/expired flag, Control
  Number, issue date, expiry date — and nothing else (no title, no applicant name).
- Step 2 returns track ETHICS, instrument **"Research Ethics Clearance"**.
- Step 3 returns track ETHICS, instrument **"Certificate of Exemption from Research Ethics
  Clearance"** — exemption certificates are labeled as exemptions, not clearances.
- Step 4 returns the same generic not-found result as a malformed lookup — no hint whether the
  number was close to a real one, and no personal data ever.

**Result:** [ ] Pass

---

## Scenario 13 — Reports index per role + CSV export

**Accounts:** `dpo.staff@pcc.test`, `secretariat@pcc.test` (or `chair@pcc.test`), `admin@pcc.test`, `researcher@pcc.test`

**Steps:**

1. As **DPO Staff**, open `/reports`.
2. As **Ethics Secretariat** (repeat with the Chair if desired), open `/reports`.
3. As **System Administrator**, open `/reports`.
4. As the **researcher**, open `/reports`.
5. As DPO Staff, open one DPO report (e.g. Pending DPO Approvals) and export it as CSV
   (the `?format=csv` export).

**Expected result:**

- DPO Staff sees the shared reports (Applications by Department, Incident Summary, Compliance
  Monitoring) **plus the DPO reports**: NDAs by Department and Grade Level, Pending DPO
  Approvals, OJTs Accommodated, Trainee Whereabouts, OJT Evaluation Report Compliance.
- Secretariat/Chair sees the shared reports **plus the ORD reports**: Applications by Risk
  Level, Reviewer Workload, Annual Ethics Report, Archive Studies Report.
- The Administrator sees everything. The researcher (and any non-report role) is refused with
  "You do not have access to this report" — visibility is per role, not just per login.
- The CSV download contains the same filtered rows shown on screen.

**Result:** [ ] Pass

---

## Scenario 14 — Audit trail access and record-view logging

**Accounts:** `admin@pcc.test` (also `dpo.staff@pcc.test`, `chair@pcc.test`), then `researcher@pcc.test` and `secretariat@pcc.test`

**Steps:**

1. As the researcher, open a DPREQ, a REMIS, a DPNDA record, and an incident (any of the ones
   created above).
2. As **System Administrator**, open **Admin → Audit trail** (`/admin/audit-trail`) and filter by
   event type.
3. Try opening `/admin/audit-trail` as the researcher and as the Ethics Secretariat.

**Expected result:**

- The audit trail lists every status change, approval, signature, and notification from the
  round, with actor and timestamp, filterable by date range, event type, user, and record.
- The researcher's record views from step 1 are logged as `dpreq_application.viewed`,
  `remis_application.viewed`, `dpnda_record.viewed`, and `incident.viewed` — views of sensitive
  records are part of the trail.
- Only **System Administrator, DPO Staff, and Ethics Committee Chair** can open the audit trail.
  The researcher and the Secretariat are refused (403).

**Result:** [ ] Pass

---

## Sign-off

| Module | Scenarios | Pass? | Signed (name / role / date) |
|---|---|---|---|
| DPREQ (DPO clearance) | 1, 2, 3 | | |
| REMIS endorsement + screening + review | 4, 5, 6 | | |
| REMIS decision + clearance + exemption | 7, 8 | | |
| Monitoring + incidents | 7, 9 | | |
| DPNDA (single + batch import) | 10, 11 | | |
| Public verification | 12 | | |
| Reports | 13 | | |
| Audit trail | 14 | | |
