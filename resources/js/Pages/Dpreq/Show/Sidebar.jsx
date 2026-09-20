import StatusBadge from '@/Components/StatusBadge';
import CertificateHistory from '@/Components/CertificateHistory';
import {
    PANEL, PANEL_HEAD, PANEL_TITLE, PANEL_EYEBROW, MICRO_LABEL, STATUS_LABELS,
    titleCase, formatDate,
} from './primitives';

const ROW_LABEL = `mb-1.5 ${MICRO_LABEL}`;
const ROW_VALUE = 'text-[0.8125rem] font-medium text-fg-primary';

// Right-hand rail: Overview summary, certificate issuance history, and the full status
// history audit timeline. Sticky only on large screens (the parent applies lg:sticky).
export default function Sidebar({ application, research, clearanceIssued }) {
    const history = application.status_history ?? [];

    return (
        <div className="space-y-6">
            {/* Overview */}
            <div className={PANEL}>
                <div className={PANEL_HEAD}>
                    <div>
                        <p className={PANEL_EYEBROW}>Summary</p>
                        <h3 className={PANEL_TITLE}>Overview</h3>
                    </div>
                </div>
                <div className="divide-y divide-border p-6">
                    <div className="pb-4">
                        <dt className={ROW_LABEL}>Status</dt>
                        <dd>
                            <StatusBadge status={application.status} label={STATUS_LABELS[application.status]} />
                        </dd>
                    </div>
                    <div className="py-4">
                        <dt className={ROW_LABEL}>Applicant Type</dt>
                        <dd className={ROW_VALUE}>
                            {titleCase(application.applicant_type) || (
                                <span className="font-normal italic text-fg-tertiary">Not specified</span>
                            )}
                        </dd>
                    </div>
                    <div className="py-4">
                        <dt className={ROW_LABEL}>Submitted</dt>
                        <dd className={`${ROW_VALUE} tabular-nums`}>{formatDate(application.created_at) || '—'}</dd>
                    </div>

                    {clearanceIssued && (
                        <div className="pt-4">
                            <dt className={`mb-2 ${MICRO_LABEL}`}>Clearance Certificate</dt>
                            <a
                                href={route('dpreq.clearance-pdf', application.id)}
                                className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.8125rem] font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 active:translate-y-px"
                            >
                                Download Form 3
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Certificate Issuance History (stakeholder Future Enhancement, 2026-08-31) */}
            <div className={PANEL}>
                <div className={PANEL_HEAD}>
                    <div>
                        <p className={PANEL_EYEBROW}>Clearance</p>
                        <h3 className={PANEL_TITLE}>Certificate History</h3>
                    </div>
                </div>
                <div className="p-6">
                    <CertificateHistory certificate={research.clearance_certificate} />
                </div>
            </div>

            {/* Status History */}
            <div className={PANEL}>
                <div className={PANEL_HEAD}>
                    <div>
                        <p className={PANEL_EYEBROW}>Audit</p>
                        <h3 className={PANEL_TITLE}>Status History</h3>
                    </div>
                    <span className="rounded-md bg-surface-tertiary px-2 py-1 text-xs font-semibold tabular-nums text-fg-secondary">
                        {history.length}
                    </span>
                </div>

                <div className="p-6">
                    {history.length > 0 ? (
                        <div className="space-y-1">
                            {history.map((h, index) => (
                                <div key={h.id} className="group relative flex gap-3">
                                    {/* Timeline line */}
                                    {index !== history.length - 1 && (
                                        <div className="absolute left-[5px] top-4 h-[calc(100%-4px)] w-px bg-border" />
                                    )}
                                    {/* Dot */}
                                    <div className="relative flex-shrink-0 pt-1.5">
                                        <div className="size-2.5 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 pb-5">
                                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                            <span className="inline-block rounded-md bg-surface-tertiary px-2 py-0.5 text-[0.6875rem] font-medium capitalize text-fg-secondary">
                                                {(h.from_status ?? 'new').replaceAll('_', ' ')}
                                            </span>
                                            <span className="text-border-medium">→</span>
                                            <span className="inline-block rounded-md bg-primary-100 px-2 py-0.5 text-[0.6875rem] font-semibold capitalize text-primary-900">
                                                {(h.to_status ?? '').replaceAll('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-fg-secondary">{h.changed_by?.name ?? 'System'}</p>
                                        <time className="text-xs tabular-nums text-fg-tertiary">
                                            {h.created_at
                                                ? new Date(h.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: 'numeric', minute: '2-digit',
                                                })
                                                : 'N/A'}
                                        </time>
                                        {h.comments && (
                                            <div className="mt-2 rounded-lg bg-surface-tertiary px-3 py-2 ring-1 ring-inset ring-border">
                                                <p className="text-xs italic leading-relaxed text-fg-secondary">&ldquo;{h.comments}&rdquo;</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-6 text-center text-xs text-fg-tertiary">No status history yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}