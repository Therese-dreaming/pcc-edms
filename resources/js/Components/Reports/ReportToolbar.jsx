import { Link } from '@inertiajs/react';
import { IconArrowLeft, IconDownload } from '@tabler/icons-react';

// Shared "back to reports + export CSV" bar for every report page (docs/5.1-5.3 "export
// PDF/Excel" — CSV stands in for Excel, see App\Shared\Reports\Support\CsvResponse).
export default function ReportToolbar({ csvHref, children }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline">
                <IconArrowLeft size={16} aria-hidden="true" /> All Reports
            </Link>
            <div className="flex items-center gap-3">
                {children}
                {csvHref && (
                    <a
                        href={csvHref}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                        <IconDownload size={16} aria-hidden="true" /> Export CSV
                    </a>
                )}
            </div>
        </div>
    );
}
