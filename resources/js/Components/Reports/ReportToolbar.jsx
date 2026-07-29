import { Link } from '@inertiajs/react';
import { IconArrowLeft, IconDownload } from '@tabler/icons-react';

// Shared "back to reports + export CSV" bar for every report page. Redesign system
// (.claude/skills/redesign): pill controls, neutral secondary button, text link with the
// brand-safe strong-red for the "All reports" back link.
export default function ReportToolbar({ csvHref, children }) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <Link
                href={route('reports.index')}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-fg-primary-strong hover:underline"
            >
                <IconArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                All reports
            </Link>
            <div className="flex items-center gap-3">
                {children}
                {csvHref && (
                    <a
                        href={csvHref}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-medium bg-surface-primary px-4 text-sm font-semibold text-fg-secondary transition-colors hover:border-primary hover:bg-surface-tertiary hover:text-primary"
                    >
                        <IconDownload size={16} aria-hidden="true" /> Export CSV
                    </a>
                )}
            </div>
        </div>
    );
}
