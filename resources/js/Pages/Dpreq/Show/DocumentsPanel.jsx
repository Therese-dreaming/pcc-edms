import { IconDownload, IconEye, IconFileDescription } from '@tabler/icons-react';
import {
    PANEL,
    PANEL_HEAD,
    PANEL_TITLE,
    PANEL_EYEBROW,
    documentLabel,
    formatDate,
} from './primitives';

const ACTION_BTN =
    'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px';

// View (inline preview in a new tab) + Download pair for a stored document. `documents.preview`
// serves the file with Content-Disposition: inline so the browser renders it rather than saving.
function DocActions({ documentId }) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            <a
                href={route('documents.preview', documentId)}
                target="_blank"
                rel="noopener noreferrer"
                className={ACTION_BTN}
            >
                <IconEye size={14} aria-hidden="true" />
                View
            </a>
            <a href={route('documents.download', documentId)} className={ACTION_BTN}>
                <IconDownload size={14} aria-hidden="true" />
                Download
            </a>
        </div>
    );
}

// Generated Documents — Form 1 (auto-generated PDF), kept separate from the applicant's
// uploads (concern 6, 2026-07-28). The page passes the `form1Document` it already located.
export function GeneratedDocumentsPanel({ application, form1Document }) {
    return (
        <div className={PANEL}>
            <div className={PANEL_HEAD}>
                <div>
                    <p className={PANEL_EYEBROW}>Generated</p>
                    <h3 className={PANEL_TITLE}>Form 1</h3>
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-6 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <IconFileDescription size={18} className="shrink-0 text-fg-tertiary" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-fg-primary">Form 1 — Application</p>
                        <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                            Auto-generated from this application
                            {form1Document?.version ? ` · v${form1Document.version}` : ''}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {form1Document?.id && (
                        <a
                            href={route('documents.preview', form1Document.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={ACTION_BTN}
                        >
                            <IconEye size={14} aria-hidden="true" />
                            View
                        </a>
                    )}
                    <a href={route('dpreq.form-pdf', application.id)} className={ACTION_BTN}>
                        <IconDownload size={14} aria-hidden="true" />
                        Download
                    </a>
                </div>
            </div>
        </div>
    );
}

// Submitted Documents (concern 5/8) — the applicant's uploaded files across both tracks, each
// labelled by type. The page merges DPREQ + REMIS-track uploads and passes the list in.
export function SubmittedDocumentsPanel({ documents }) {
    if (!documents || documents.length === 0) return null;

    return (
        <div className={PANEL}>
            <div className={PANEL_HEAD}>
                <div>
                    <p className={PANEL_EYEBROW}>Attachments</p>
                    <h3 className={PANEL_TITLE}>Submitted Documents</h3>
                </div>
                <span className="rounded-md bg-surface-tertiary px-2 py-1 text-xs font-semibold tabular-nums text-fg-secondary">
                    {documents.length}
                </span>
            </div>
            <ul className="divide-y divide-border">
                {documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 px-6 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <IconFileDescription size={18} className="shrink-0 text-fg-tertiary" aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-fg-primary">
                                    {documentLabel(d.document_type)}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-fg-tertiary">
                                    {d.original_filename}
                                    {d.uploaded_by?.name ? ` · ${d.uploaded_by.name}` : ''}
                                    {d.created_at ? ` · ${formatDate(d.created_at)}` : ''}
                                </p>
                            </div>
                        </div>
                        <DocActions documentId={d.id} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
