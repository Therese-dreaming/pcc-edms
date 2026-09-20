// Shared constants, formatters, and the page's maroon/paper panel primitives for
// Dpreq/Show. Extracted from the original monolithic Show.jsx with NO visual change —
// these class strings are the page's sanctioned-exception aesthetic (docs/DESIGN.md §2).

export const STATUS_LABELS = {
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned',
    under_review: 'Under Review',
    rejected: 'Rejected',
    approved: 'Approved',
    clearance_issued: 'Clearance Issued',
};

// Helper — snake_case / value formatting.
export const titleCase = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return String(value);
    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const formatDate = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const yesNo = (value) => (value ? 'Yes' : 'No');

// A4 (concern 5) — Form-1 uploads (research proposal, consent, instrument, additional) attach to
// the DPREQ/REMIS application but were never listed on Show. Map the stored `document_type` to a
// readable label; unknown types fall back to a title-cased version of the raw type.
export const DOCUMENT_TYPE_LABELS = {
    Form1Application: 'Form 1 — Application',
    ResearchProposal: 'Research Proposal',
    ConsentForm: 'Consent Form',
    Instrument: 'Data Collection Instrument',
    AdditionalDocument: 'Additional Document',
    nda_pdf: 'Research Team NDA',
    ProgressReportSupportingDocument: 'Progress Report Attachment',
    FinalOutputs: 'Final Output',
    // Intake uploads are stored under their FileLabel token as the document_type.
    RESEARCHPROPOSAL: 'Research Proposal',
    QUESTIONNAIRE: 'Research Instrument',
    APPROVALLETTER: 'Approved Request Letter',
    ENDORSEMENTLETTER: "Adviser's Endorsement Letter",
    INFORMEDCONSENT: 'Consent Form',
    CONSENTLETTER: 'Parent Consent',
    ASSENTFORM: 'Assent Form',
    PERMISSIONLETTER: 'Permission Letter',
    ETHICSFORM: 'Ethics Training Certificate',
    SURVEYFORM: 'Survey Form',
    DATASET: 'Dataset',
    DATAPRIVACYFORM: 'Data Privacy Form',
    OTHERDOCUMENT: 'Other Document',
};

// Generated system documents (have their own UI / download buttons) — kept OUT of the uploaded
// "Submitted Documents" list (concern 6, 2026-07-28).
export const GENERATED_DOC_TYPES = [
    'Form1Application', 'nda_pdf',
    'DpreqClearanceCertificate', 'RemisClearanceCertificate', 'RemisExemptionCertificate',
];

export const documentLabel = (type) => DOCUMENT_TYPE_LABELS[type] ?? titleCase(type);

export const DOCUMENT_STATUS_STYLES = {
    current: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    superseded: 'bg-surface-tertiary text-fg-secondary ring-border',
    archived: 'bg-amber-50 text-amber-700 ring-amber-200/70',
};

export const asList = (value) => {
    if (!value) return null;
    if (Array.isArray(value)) return value.length ? value.join(', ') : null;
    return value;
};

// Shared panel + label primitives so the whole page reads as one system.
export const PANEL =
    'overflow-hidden rounded-lg border border-border bg-surface-secondary shadow-sm';
export const PANEL_HEAD =
    'flex items-center justify-between gap-3 border-b border-border bg-surface-tertiary/50 px-6 py-4';
export const PANEL_TITLE = 'font-display text-sm font-semibold text-fg-primary';
export const PANEL_EYEBROW =
    'text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700';
export const MICRO_LABEL =
    'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg-tertiary';
export const PRIMARY_BTN =
    'inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';
export const SECONDARY_BTN =
    'inline-flex items-center gap-2 rounded-lg border border-border-medium bg-surface-secondary px-4 py-2 text-[0.8125rem] font-semibold text-fg-secondary shadow-sm transition hover:bg-surface-tertiary active:translate-y-px';
export const TEXTAREA =
    'block w-full rounded-lg border border-border-medium bg-surface-secondary px-3 py-2 text-[0.8125rem] text-fg-primary placeholder:text-fg-tertiary shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';
