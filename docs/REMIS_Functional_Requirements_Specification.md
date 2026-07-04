# Research Ethics Management Information System (REMIS)
## Functional Requirements Specification

**Institution:** Pasig Catholic College
**Office:** Office of Research and Development
**Module:** Research Ethics Committee (REC) Clearance

> **Note:** This document covers the REC Clearance module only. REMIS is envisioned as a larger institutional platform, and this specification will be expanded with additional department/module specifications (e.g., other research offices, compliance units) as the project progresses.

---

## Table of Contents

1. [System Purpose](#i-system-purpose)
2. [User Roles](#ii-user-roles)
3. [Application Module](#iii-application-module)
4. [Endorsement Module](#iv-endorsement-module)
5. [Tracking Module](#v-tracking-module)
6. [Administrative Screening Module](#vi-administrative-screening-module)
7. [Risk Classification Module](#vii-risk-classification-module)
8. [Ethics Review Module](#viii-ethics-review-module)
9. [Revision Management Module](#ix-revision-management-module)
10. [Decision Module](#x-decision-module)
11. [Ethics Clearance Module](#xi-ethics-clearance-module)
12. [Monitoring Module](#xii-monitoring-module)
13. [Incident Reporting Module](#xiii-incident-reporting-module)
14. [Completion Module](#xiv-completion-module)
15. [Document Management Requirements](#xv-document-management-requirements)
16. [Audit Trail Requirements](#xvi-audit-trail-requirements)
17. [Reports and Dashboards](#xvii-reports-and-dashboards)

---

## I. System Purpose

The Research Ethics Management Information System (REMIS) shall automate the **submission, review, approval, monitoring, tracking, and archiving** of research ethics applications.

The system shall support the following user groups:
- Students
- Faculty
- Staff
- Institutional researchers

...and shall provide a **centralized repository** for all ethics-related documents.

---

## II. User Roles

| # | Role | Permissions |
|---|------|-------------|
| 1 | **Researcher**<br>• Student<br>• Faculty<br>• Academic Non-Teaching Personnel<br>• Non-teaching Support Personnel | - Create application<br>- Upload documents<br>- Submit revisions<br>- View status<br>- Download ethics clearance |
| 2 | **Adviser** | - Review proposal<br>- Endorse application<br>- Return application |
| 3 | **Program Head** | - Review endorsement<br>- Approve endorsement |
| 4 | **Dean / Academic Head** | - Final academic endorsement |
| 5 | **Ethics Secretariat** | - Receive applications<br>- Conduct administrative screening<br>- Assign tracking numbers<br>- Generate reports |
| 6 | **Ethics Reviewer** | - Access assigned applications<br>- Complete review forms<br>- Submit recommendations |
| 7 | **Ethics Committee Chair** | - Assign reviewers<br>- Consolidate reviews<br>- Issue decisions |
| 8 | **System Administrator** | - Manage users<br>- Configure workflow<br>- Generate system reports |

---

## III. Application Module

**Electronic Form:** Research Ethics Application Form

### A. Research Information (Required Fields)
- Study Title
- Research Category
- Research Type
- Department
- Academic Program
- Funding Source
- Proposed Start Date
- Proposed End Date

### B. Research Team
- Principal Investigator
- Co-Researchers
- Adviser
- Contact Information

### C. Participants
- Target Population
- Number of Participants
- Inclusion Criteria
- Exclusion Criteria
- Vulnerable Population Indicator

### D. Ethics Information
- Risks to Participants
- Benefits
- Confidentiality Measures
- Consent Process
- Data Storage Plan

### E. Document Uploads

**Mandatory:**
- Research Proposal
- Consent Form
- Research Instrument

**Other (as applicable):**
- Parent Consent
- Assent Form
- Permission Letters
- Ethics Training Certificate

### System Validation
> The application **cannot proceed** if mandatory documents are missing.

---

## IV. Endorsement Module

### Workflow

```
Researcher → Adviser → Program Head → Dean → Ethics Secretariat
```

### Actions Available
- Approve
- Return with Comments
- Reject

### System Records (per endorsement action)
- Name of Endorser
- Date and Time
- Remarks
- Electronic Signature

---

## V. Tracking Module

### System-Generated Tracking Number

**Format:** `REC-YYYY-XXXX`

**Example:** `REC-2026-0001`

### Automatically Generated Fields
- Submission Date
- Application Number
- Current Status

### Status Values
- Draft Submitted
- Under Endorsement
- For Screening
- For Review
- For Revision
- Approved
- Approved with Conditions
- Deferred
- Disapproved
- Closed
- Archived

---

## VI. Administrative Screening Module

### Checklist Fields
- [ ] Proposal Attached
- [ ] Consent Form Attached
- [ ] Instrument Attached
- [ ] Signatures Complete
- [ ] Required Templates Used

### Screening Decision
- [ ] Complete
- [ ] Incomplete
- [ ] Returned for Compliance

> The system must **automatically generate a deficiency notice** when an application is marked incomplete or returned for compliance.

---

## VII. Risk Classification Module

### Classification Options
- Minimal Risk
- Moderate Risk
- High Risk

### Review Type Assigned
- Expedited Review
- Committee Review
- Full Board Review

### System Automatically Records
- Classifier
- Date
- Rationale

---

## VIII. Ethics Review Module

### Reviewer Dashboard
- Assigned Applications
- Pending Reviews
- Completed Reviews

### Review Criteria
1. Voluntary Participation
2. Informed Consent
3. Protection from Harm
4. Confidentiality
5. Participant Selection
6. Privacy Protection
7. Ethical Acceptability

### Reviewer Recommendation
- Approve
- Minor Revision
- Major Revision
- Disapprove

### Reviewer Comments
- Free Text Field

---

## IX. Revision Management Module

### Researcher Response Matrix

| Field | Description |
|-------|-------------|
| Reviewer Comment | Original comment from reviewer |
| Researcher Response | Researcher's reply/action taken |
| Document Revised | Which document was revised |
| Version Number | Updated version identifier |

### System Features
- Version Control
- Revision History
- Date Tracking
- Reviewer Reassessment

---

## X. Decision Module

### Committee Decision Options
- Approved
- Approved with Conditions
- Deferred
- Disapproved

### Required Fields
- Decision Date
- Conditions
- Remarks
- Authorized Signatories

---

## XI. Ethics Clearance Module

### Automatically Generated PDF

**Contents:**
- Clearance Number
- Study Title
- Researcher Names
- Approval Date
- Validity Period
- Authorized Signatures
- QR Verification Code

### Additional Features
- Download Feature
- PDF Storage
- Verification Portal

---

## XII. Monitoring Module

### Research Progress Report

**Fields:**
- Status of Study
- Participants Recruited
- Ethics Concerns
- Protocol Deviations
- Corrective Actions

**Additional Function:**
- Upload Supporting Documents

---

## XIII. Incident Reporting Module

### Incident Types
- Participant Complaint
- Data Breach
- Confidentiality Breach
- Psychological Harm
- Protocol Violation
- Other Ethics Concern

### System Functions
- Immediate Notification
- Incident Tracking
- Corrective Action Monitoring

---

## XIV. Completion Module

### Final Ethics Completion Report

**Fields:**
- Completion Date
- Final Participant Count
- Compliance Statement
- Publication Status
- Data Storage Location
- Final Outputs Uploaded

### System Action
- Close Case
- Archive Records

---

## XV. Document Management Requirements

Every document shall have the following metadata:

| Attribute | Description |
|-----------|-------------|
| Document ID | Unique identifier |
| Version Number | Revision tracking |
| Date Uploaded | Upload timestamp |
| Uploaded By | User who uploaded |
| File Type | Format of the file |
| Status | Current document status |

### Supported Formats
- PDF
- DOCX
- XLSX
- PPTX
- JPG
- PNG

---

## XVI. Audit Trail Requirements

The system shall record:
- User
- Date
- Time
- Action Performed
- Document Affected
- IP Address

> **Audit records shall not be editable.**

---

## XVII. Reports and Dashboards

### Administrator Dashboard
- Total Applications
- Pending Reviews
- Approved Applications
- Disapproved Applications
- Average Processing Time

### Reports
- Applications by Department
- Applications by Risk Level
- Reviewer Workload
- Compliance Monitoring Report
- Annual Ethics Report
- Archived Studies Report

---

## Document Status

| Field | Value |
|-------|-------|
| Current Module | REC Clearance |
| Planned Additional Modules | *To be defined (other departments/modules)* |
| Document Type | Functional Requirements Specification (FRS) |

