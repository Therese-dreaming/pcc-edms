import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import SignaturePad from '@/Components/SignaturePad';
import { IconDownload, IconHistory } from '@tabler/icons-react';
import {
    PANEL, PANEL_HEAD, PANEL_TITLE, PANEL_EYEBROW, MICRO_LABEL, PRIMARY_BTN,
    titleCase, formatDate,
} from './primitives';

const DOC_BTN =
    'inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs font-medium text-fg-secondary shadow-sm transition hover:border-border-medium hover:bg-surface-tertiary hover:text-fg-primary active:translate-y-px';

// Research Team NDA panel (Form 2) — signatory list, add-member form, and the sign form.
// Handlers and forms are owned by the page and passed in; this component is presentational.
export default function NdaPanel({
    application, nda, mySignatory, canManageMembers,
    signForm, memberForm, onResendMember, onRemoveMember,
}) {
    if (!nda) return null;

    return (
        <div className={PANEL}>
            <div className={PANEL_HEAD}>
                <div>
                    <p className={PANEL_EYEBROW}>Form 2</p>
                    <h3 className={PANEL_TITLE}>Research Team NDA</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-medium tabular-nums text-fg-tertiary">{nda.tracking_number}</span>
                        <span className="text-border-medium">•</span>
                        <span className={`font-medium ${nda.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {nda.status === 'completed' ? 'Fully Signed' : titleCase(nda.status)}
                        </span>
                    </div>
                </div>
                {nda.documents && nda.documents.length > 0 && (
                    <div className="flex items-center gap-2">
                        <a href={route('dpreq.nda-pdf', application.id)} className={DOC_BTN}>
                            <IconDownload size={14} aria-hidden="true" />Download
                        </a>
                        <a
                            href={route('documents.versions.index', {
                                documentableType: 'App\\Modules\\Dpreq\\Models\\DpreqApplication',
                                documentableId: application.id,
                                document_type: 'nda_pdf',
                            })}
                            className={DOC_BTN}
                        >
                            <IconHistory size={14} aria-hidden="true" />Version History
                        </a>
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200/70">
                    <p className="text-xs leading-relaxed text-amber-900">
                        This NDA must be fully signed before DPO Staff can approve the application.
                    </p>
                </div>

                {/* Signatories */}
                <div className="space-y-2.5">
                    <h4 className={MICRO_LABEL}>Signatories</h4>
                    {nda.signatories && nda.signatories.length > 0 ? (
                        <div className="space-y-2">
                            {nda.signatories.map((s) => (
                                <div
                                    key={s.id}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-inset ${s.signed_at ? 'bg-emerald-50/60 ring-emerald-200/70' : 'bg-surface-tertiary ring-border'}`}
                                >
                                    <div>
                                        <p className="text-[0.8125rem] font-medium text-fg-primary">{s.full_name}</p>
                                        <p className="text-xs text-fg-tertiary">{s.role}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-right">
                                        {s.signed_at ? (
                                            <span className="text-xs font-medium tabular-nums text-emerald-700">Signed {formatDate(s.signed_at)}</span>
                                        ) : s.invited_at ? (
                                            <span className="text-xs font-medium text-amber-600">
                                                Invited{s.token_expires_at && new Date(s.token_expires_at) < new Date() ? ' · link expired' : ''}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-fg-tertiary">Pending</span>
                                        )}
                                        {canManageMembers && s.role !== 'leader' && !s.signed_at && (
                                            <span className="flex items-center gap-2">
                                                <button type="button" onClick={() => onResendMember(s)} className="text-xs font-semibold text-primary-700 hover:underline">Resend</button>
                                                <button type="button" onClick={() => onRemoveMember(s)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg bg-surface-tertiary py-6 text-center ring-1 ring-inset ring-border">
                            <p className="text-xs text-fg-tertiary">No signatories assigned yet.</p>
                        </div>
                    )}

                    {canManageMembers && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                memberForm.post(route('dpreq.nda.members.add', application.id), {
                                    preserveScroll: true,
                                    onSuccess: () => memberForm.reset(),
                                });
                            }}
                            className="mt-3 space-y-2 rounded-lg bg-surface-tertiary p-3 ring-1 ring-inset ring-border"
                        >
                            <p className="text-xs font-medium text-fg-secondary">Add a co-researcher — they''ll get a unique email link to sign.</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                    <TextInput className="w-full text-sm" placeholder="Full name" value={memberForm.data.full_name} onChange={(e) => memberForm.setData('full_name', e.target.value)} />
                                    <InputError message={memberForm.errors.full_name} className="mt-1" />
                                </div>
                                <div>
                                    <TextInput type="email" className="w-full text-sm" placeholder="Email address" value={memberForm.data.email} onChange={(e) => memberForm.setData('email', e.target.value)} />
                                    <InputError message={memberForm.errors.email} className="mt-1" />
                                </div>
                            </div>
                            <button type="submit" disabled={memberForm.processing || !memberForm.data.full_name || !memberForm.data.email} className="inline-flex items-center gap-1.5 rounded-md bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50">
                                {memberForm.processing ? 'Sending…' : 'Add member & send link'}
                            </button>
                        </form>
                    )}
                </div>
                {/* Sign NDA */}
                {mySignatory && !mySignatory.signed_at && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            signForm.post(route('dpreq.sign-nda', application.id));
                        }}
                        className="mt-5 space-y-3 rounded-lg bg-primary-50 p-4 ring-1 ring-inset ring-primary-200/70"
                    >
                        <h4 className="text-[0.8125rem] font-semibold text-fg-primary">Sign this NDA</h4>

                        {/* Form 2 — OBLIGATIONS OF THE RESEARCHER/S. The signer must review and
                            accept all eight obligations before signing. */}
                        <div className="rounded-lg border border-primary-200 bg-white p-3">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-secondary">
                                Obligations of the Researcher/s
                            </p>
                            <ol className="list-decimal space-y-1 pl-4 text-[0.6875rem] leading-relaxed text-fg-secondary">
                                <li>I will use the data gathered solely for the purpose of conducting the study.</li>
                                <li>I will not disclose, publish, or otherwise disseminate confidential information to any third party without the prior written consent of the school.</li>
                                <li>I shall not use the information for any commercial, personal, or other unauthorized purpose.</li>
                                <li>I will anonymize participants&rsquo; identities and responses and will keep it confidential.</li>
                                <li>I will maintain reasonable security measures in the storage such as password protected files or other appropriate measures.</li>
                                <li>I will avoid exposing participants to harm or risk.</li>
                                <li>Upon completion of the study, I will return or destroy all confidential information and all copies at the school&rsquo;s request.</li>
                                <li>I will promptly share a copy of the study in PDF form by uploading it in the EDMS, if the school requests it.</li>
                            </ol>
                            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-md bg-primary-50 p-2.5 ring-1 ring-inset ring-primary-200">
                                <input
                                    type="checkbox"
                                    checked={signForm.data.obligations_accepted}
                                    onChange={(e) => signForm.setData('obligations_accepted', e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-primary-300 text-primary-700 focus:ring-primary-600"
                                />
                                <span className="text-xs font-medium leading-snug text-fg-primary">
                                    I have read and agree to abide by all Obligations of the Researcher/s listed above.
                                </span>
                            </label>
                            <InputError message={signForm.errors.obligations_accepted} className="mt-1" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-fg-secondary">Full Name</label>
                            <TextInput
                                placeholder="Type your full name to sign"
                                className="block w-full text-sm"
                                value={signForm.data.typed_full_name}
                                onChange={(e) => signForm.setData('typed_full_name', e.target.value)}
                            />
                            <InputError message={signForm.errors.typed_full_name} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-fg-secondary">Signature</label>
                            <SignaturePad onChange={(image) => signForm.setData('signature_image', image)} />
                        </div>

                        <button
                            type="submit"
                            disabled={signForm.processing || !signForm.data.obligations_accepted}
                            className={`${PRIMARY_BTN} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {signForm.processing ? 'Signing…' : 'Sign NDA'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}