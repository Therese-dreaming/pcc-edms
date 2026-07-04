import { Link } from '@inertiajs/react';

// Shared "back to reports + export CSV" bar for every report page (docs/5.1-5.3 "export
// PDF/Excel" — CSV stands in for Excel, see App\Shared\Reports\Support\CsvResponse).
export default function ReportToolbar({ csvHref, children }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <Link href={route('reports.index')} className="text-sm text-indigo-600 hover:underline">
                &larr; All Reports
            </Link>
            <div className="flex items-center gap-3">
                {children}
                {csvHref && (
                    <a
                        href={csvHref}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Export CSV
                    </a>
                )}
            </div>
        </div>
    );
}
