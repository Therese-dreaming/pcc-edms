import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';

// FRS §IX Revision Management — shared panel for both the REMIS and DPREQ show pages. Staff raise
// requests; the applicant responds (text and/or a file). `revisions` is the prop the show
// controllers build: { track, items, canRaise, isApplicant, ... }.
export default function RevisionPanel({ revisions }) {
    const { track, items = [], canRaise, isApplicant } = revisions ?? {};

    const raiseForm = useForm({ item: '', kind: 'comment', is_mandatory: true, due_date: '' });

    const submitRaise = (e, applicationId) => {
        e.preventDefault();
        raiseForm.post(route('revisions.raise', [track, applicationId]), {
            preserveScroll: true,
            onSuccess: () => raiseForm.reset(),
        });
    };

    const applicationId = revisions?.applicationId;

    const statusPill = (status) => {
        const map = {
            open: 'bg-amber-100 text-amber-800',
            responded: 'bg-surface-tertiary text-fg-secondary',
            resolved: 'bg-emerald-100 text-emerald-800',
            waived: 'bg-zinc-100 text-zinc-600',
        };
        return map[status] ?? 'bg-zinc-100 text-zinc-600';
    };

    const openCount = items.filter((i) => i.status === 'open' || i.status === 'responded').length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-600">
                    Revision Requests
                </h3>
                {openCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {openCount} awaiting action
                    </span>
                )}
            </div>

            {items.length === 0 && (
                <p className="rounded-lg bg-zinc-50 px-4 py-4 text-sm text-zinc-500 ring-1 ring-inset ring-zinc-200">
                    No revision requests.
                </p>
            )}

            <div className="space-y-3">
                {items.map((req) => (
                    <RequestRow key={req.id} req={req} isApplicant={isApplicant} canManage={canRaise} statusPill={statusPill} />
                ))}
            </div>

            {canRaise && (
                <form onSubmit={(e) => submitRaise(e, applicationId)} className="space-y-2 rounded-lg bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
                    <p className="text-xs font-semibold text-zinc-700">Request a revision or additional document</p>
                    <textarea
                        rows={2}
                        value={raiseForm.data.item}
                        onChange={(e) => raiseForm.setData('item', e.target.value)}
                        placeholder="Describe what the applicant must address or supply…"
                        className="w-full rounded-md border-zinc-300 text-sm shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                    />
                    <InputError message={raiseForm.errors.item} />
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <select
                            value={raiseForm.data.kind}
                            onChange={(e) => raiseForm.setData('kind', e.target.value)}
                            className="rounded-md border-zinc-300 text-xs shadow-sm"
                        >
                            <option value="comment">Comment / change</option>
                            <option value="document_required">Document required</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-zinc-600">
                            <input type="checkbox" checked={raiseForm.data.is_mandatory} onChange={(e) => raiseForm.setData('is_mandatory', e.target.checked)} className="rounded border-zinc-300 text-primary-700" />
                            Mandatory (blocks resubmission)
                        </label>
                        <button
                            type="submit"
                            disabled={raiseForm.processing || !raiseForm.data.item.trim()}
                            className="ml-auto rounded-md bg-primary-700 px-3 py-1.5 font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
                        >
                            Send request
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function RequestRow({ req, isApplicant, canManage, statusPill }) {
    const [showRespond, setShowRespond] = useState(false);
    const respondForm = useForm({ response: '', file: null });

    const submitRespond = (e) => {
        e.preventDefault();
        respondForm.post(route('revisions.respond', req.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { respondForm.reset(); setShowRespond(false); },
        });
    };

    const act = (name) => router.post(route(`revisions.${name}`, req.id), {}, { preserveScroll: true });

    return (
        <div className="rounded-lg border border-zinc-200 p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-zinc-800">{req.item}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        {req.kind === 'document_required' ? 'Document required' : 'Comment'}
                        {req.is_mandatory ? ' · mandatory' : ' · optional'}
                    </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(req.status)}`}>{req.status}</span>
            </div>

            {(req.responses ?? []).length > 0 && (
                <ul className="mt-2 space-y-1 border-l-2 border-zinc-100 pl-3 text-xs text-zinc-600">
                    {req.responses.map((r) => (
                        <li key={r.id}>
                            {r.response}
                            {r.document_id && <span className="ml-1 text-primary-700">· document attached</span>}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
                {isApplicant && (req.status === 'open' || req.status === 'responded') && (
                    <button type="button" onClick={() => setShowRespond((v) => !v)} className="text-xs font-semibold text-primary-700 hover:underline">
                        {showRespond ? 'Cancel' : 'Respond'}
                    </button>
                )}
                {canManage && (req.status === 'open' || req.status === 'responded') && (
                    <>
                        <button type="button" onClick={() => act('resolve')} className="text-xs font-semibold text-emerald-700 hover:underline">Mark resolved</button>
                        <button type="button" onClick={() => act('waive')} className="text-xs font-semibold text-zinc-500 hover:underline">Waive</button>
                    </>
                )}
            </div>

            {showRespond && (
                <form onSubmit={submitRespond} className="mt-2 space-y-2 rounded-md bg-zinc-50 p-3">
                    <textarea
                        rows={2}
                        value={respondForm.data.response}
                        onChange={(e) => respondForm.setData('response', e.target.value)}
                        placeholder="Your response…"
                        className="w-full rounded-md border-zinc-300 text-sm shadow-sm"
                    />
                    <input type="file" onChange={(e) => respondForm.setData('file', e.target.files[0])} className="text-xs" />
                    <InputError message={respondForm.errors.response} />
                    <button type="submit" disabled={respondForm.processing} className="rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
                        Submit response
                    </button>
                </form>
            )}
        </div>
    );
}
