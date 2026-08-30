# Certificate Signatories — Configuration Guide

Every name and title printed on PCC-EDMS generated certificates is configurable **without
touching code or templates**. Change the people holding office by editing `.env`, then clear the
config cache (`php artisan config:clear`, or `config:cache` in production) and regenerate any
affected PDFs (they are rendered on demand by queued jobs — delete the stored PDF document row or
re-issue to see new names on an existing record).

Confirmed current as of 2026-08-31 (requester confirmation).

## Where each signatory appears

| Document | Signatory | Source |
|---|---|---|
| Research Ethics Clearance Certificate (`remis-clearance.blade.php`) | REC Chair + REC Member | `config('rec.chair')`, `config('rec.member')` |
| Certificate of Exemption (`remis-exemption.blade.php`) | REC Chair + REC Member | same |
| Data Privacy Clearance (`dpreq-clearance.blade.php`) | Name: the `dpo_staff` user who approved (`clearance_certificates.dpo_signed_by`) · Title: `config('pdf.dpo_officer_title')` | account data + config |
| DPO forms with EVP approval block (`pdf/partials/_approval.blade.php`: Form 1 PDF, Form 2 NDA, Form 5 NDA) | EVP name/title + signature image | `config('pdf.approval_signatory')`, `config('pdf.approval_title')`, `config('pdf.approval_signature')` |

## Env overrides (all optional — defaults in `config/rec.php` and `config/pdf.php`)

```dotenv
# REC (ethics) signatories — config/rec.php
REC_CHAIR_NAME="Dr. Perlita R. Antonio"
REC_CHAIR_TITLE="Chair, Institutional Research Ethics Committee"
REC_MEMBER_NAME="Dr. Antonio L. Cruz"
REC_MEMBER_TITLE="Member, Institutional Research Ethics Committee/ORD"

# EVP approval block — config/pdf.php
EVP_NAME="Dr. Jennifer S. Apolinario"
EVP_TITLE="Executive Vice President"
EVP_SIGNATURE_PATH="images/signatures/evp.png"   # public-relative path to the captured PNG

# DPO clearance title — config/pdf.php
DPO_OFFICER_TITLE="DPO Officer"
```

## Notes

- **The DPO clearance signature name is not a setting** — it is the account name of whoever with
  the `dpo_staff` role approved the application. Personnel change there = update the user account
  (Admin → Users), not `.env`. Only the printed *title* is configurable.
- **EVP signature image:** place the captured PNG at `public/images/signatures/evp.png` (or set
  `EVP_SIGNATURE_PATH`). If the file is missing the approval block falls back to a blank signature
  line — PDFs still generate.
- **REC layout source of truth:** `reqs/REMIS-certs/REC-Clearance-Certificate.pdf` and
  `REC-Exemption-Certificate.pdf` (stakeholder 2026-07-31). If the committee composition changes,
  update `.env` first; only touch the Blade templates if the *layout* itself changes.
- Legal note (ADR-005): for workflow e-signatures (endorsements, decisions, NDAs) the operative
  record is typed name + timestamp + IP/device captured at signing time — those are never
  affected by this config.
