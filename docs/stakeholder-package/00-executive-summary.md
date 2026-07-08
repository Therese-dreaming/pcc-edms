# PCC-EDMS — Executive Summary

**For:** Data Privacy Office (DPO), Office of Research and Development (ORD) / Research Ethics
Committee (REC), PCC IT
**Purpose of this document:** a one-page, non-technical summary to support a stakeholder
sign-off meeting.

---

## What is PCC-EDMS?

The PCC Electronic Document Management System (PCC-EDMS) is a single online platform, shared by
two PCC offices, that replaces paper-based forms and manual routing for:

- **Data-privacy clearances** for research and data-collection activities (DPO)
- **Non-disclosure agreements** for OJTs, trainees, and student teachers (DPO)
- **Research ethics review** — from submission through academic endorsement, ethics review,
  monitoring, and study close-out (ORD/REC)

Instead of a researcher filling out separate paper forms for DPO and for the Research Ethics
Committee, they fill out **one online application**. That single submission is automatically
routed to both offices' internal review processes, which run in parallel. A study only receives
its official clearance certificate once **both** offices have signed off — neither office can
release it unilaterally.

## Who is it for?

| Office | What they get |
|---|---|
| **DPO** | Online intake and review for data-privacy clearances and NDAs, a searchable document repository, e-signatures, and reports on NDA/placement activity |
| **ORD / REC** | Online intake and review for research ethics applications, the full academic endorsement chain, risk-tiered review, ongoing study monitoring, incident reporting, and ethics reporting |
| **Researchers, OJTs, trainees, student teachers** | One online form instead of paper, a status tracker for their application, and electronic signing of NDAs |
| **The public** | A no-login page to verify whether a clearance certificate is genuine and still valid |

## A note on where the project actually stands

This document set is being produced **now**, as a stakeholder alignment and sign-off pass — not
literally before any work began. Development is already underway: the online application form,
the DPO review track, the ethics review track, NDA e-signing, incident reporting, and the public
verification page have all been built and tested against real data. What has **not** yet
happened is: (1) formal DPO/ORD sign-off on the requirements captured here, and (2) a small
number of policy decisions (listed in [`05-open-questions-and-assumptions.md`](05-open-questions-and-assumptions.md))
that the system currently handles using the simplest, most inclusive assumption until told
otherwise.

## What sign-off is being requested?

1. Confirmation that the scope, roles, and workflows described in
   [`01-functional-design-document.md`](01-functional-design-document.md) match how DPO and
   ORD/REC actually want these processes to work.
2. Answers to the open questions in
   [`05-open-questions-and-assumptions.md`](05-open-questions-and-assumptions.md) — mostly policy
   specifics (retention periods, exact form fields, risk-classification thresholds) rather than
   anything that changes the system's structure.
3. Acknowledgement that a handful of infrastructure decisions (hosting, institutional login) are
   still pending IT input and do not block the above.

Detailed supporting material: [`02-workflow-charts.md`](02-workflow-charts.md) (how a submission
flows through the system), [`03-role-raci-matrix.md`](03-role-raci-matrix.md) (who does what),
and [`04-system-context-diagram.md`](04-system-context-diagram.md) (how the system fits together
at a high level).
