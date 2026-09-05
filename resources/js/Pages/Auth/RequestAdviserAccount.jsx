import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    IconArrowLeft,
    IconArrowRight,
    IconLoader2,
    IconShieldCheck,
    IconUsersGroup,
} from '@tabler/icons-react';
import { notifyResultError, notifySuccess } from '@/lib/confirm';

export default function RequestAdviserAccount({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        account_type: 'employee_researcher',
        email: '',
        institution: '',
        department: '',
        purpose: '',
    });

    const isAdviser = data.account_type === 'external_adviser';

    useEffect(() => {
        if (status) notifySuccess(status);
    }, [status]);

    const submit = (event) => {
        event.preventDefault();
        post(route('adviser-request.store'), {
            onSuccess: () => reset(),
            onError: () =>
                notifyResultError('Request not submitted', 'Please check the highlighted fields and try again.'),
        });
    };

    const inputClass = (error) => `
        block w-full rounded-[10px] border bg-paper-50 px-4 py-3 text-paper-900
        placeholder:text-paper-400 transition-colors focus:bg-white focus:outline-none
        ${
            error
                ? 'border-danger/50 focus:border-danger focus:ring-4 focus:ring-danger/10'
                : 'border-paper-200 hover:border-paper-300 focus:border-primary-700 focus:ring-4 focus:ring-primary-700/10'
        }
    `;

    return (
        <>
            <Head title="Request an account" />

            <main className="min-h-screen bg-paper-50 px-5 py-10 font-sans text-paper-900 sm:px-8">
                <div className="mx-auto w-full max-w-[560px]">
                    <Link
                        href={route('login')}
                        className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-paper-600 hover:text-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/20"
                    >
                        <IconArrowLeft size={18} />
                        Back to sign in
                    </Link>

                    <div className="mb-8 flex items-start gap-3.5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-primary-800 text-white">
                            <IconUsersGroup size={22} />
                        </span>
                        <div>
                            <p className="mb-2 font-subtitle text-[11px] font-bold uppercase tracking-[0.11em] text-primary-700">
                                Account onboarding
                            </p>
                            <h1 className="font-display text-3xl font-extrabold leading-none tracking-[-0.045em]">
                                Request an account
                            </h1>
                            <p className="mt-3 font-subtitle text-sm leading-relaxed text-paper-600">
                                For employee or faculty researchers filing their own applications, and for advisers, heads, or principals of external researchers working with PCC. The Data Privacy Office reviews each request; once approved, you&apos;ll receive an email to set your password.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-paper-200 bg-white p-6 sm:p-8">
                        <Field label="I am requesting an account as a…" required error={errors.account_type}>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[
                                    { value: 'employee_researcher', label: 'Employee / Faculty researcher', hint: 'File your own research applications' },
                                    { value: 'external_adviser', label: 'External adviser', hint: 'Onboard and supervise a class of researchers' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setData('account_type', opt.value)}
                                        className={`rounded-[10px] border px-4 py-3 text-left transition-colors ${
                                            data.account_type === opt.value
                                                ? 'border-primary-700 bg-primary-50 ring-4 ring-primary-700/10'
                                                : 'border-paper-200 bg-paper-50 hover:border-paper-300'
                                        }`}
                                    >
                                        <span className="block font-subtitle text-sm font-bold text-paper-900">{opt.label}</span>
                                        <span className="mt-0.5 block font-subtitle text-xs text-paper-500">{opt.hint}</span>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Full name" required error={errors.name}>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={inputClass(errors.name)}
                                required
                            />
                        </Field>

                        <Field label="Email address" required error={errors.email}>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={inputClass(errors.email)}
                                placeholder="you@school.edu.ph"
                                required
                            />
                        </Field>

                        <Field label="Institution / School" error={errors.institution}>
                            <input
                                type="text"
                                value={data.institution}
                                onChange={(e) => setData('institution', e.target.value)}
                                className={inputClass(errors.institution)}
                                placeholder="e.g. PCC Graduate School, PLP"
                            />
                        </Field>

                        <Field label="Department / Office" error={errors.department}>
                            <input
                                type="text"
                                value={data.department}
                                onChange={(e) => setData('department', e.target.value)}
                                className={inputClass(errors.department)}
                            />
                        </Field>

                        <Field label="Purpose of the request" required error={errors.purpose}>
                            <textarea
                                rows="4"
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                                className={inputClass(errors.purpose)}
                                placeholder={isAdviser
                                    ? 'Briefly describe who you advise and why you need an account (e.g. I supervise MAED students conducting research at PCC).'
                                    : 'Briefly describe your role and the research you intend to submit (e.g. I am a faculty member in the College of Education conducting institutional research).'}
                                required
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group mt-1 flex h-[54px] items-center justify-center gap-2.5 rounded-[10px] bg-primary-800 px-6 font-subtitle font-bold text-white transition-colors hover:bg-primary-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/25 disabled:cursor-wait disabled:opacity-70"
                        >
                            {processing ? (
                                <>
                                    <span>Submitting</span>
                                    <IconLoader2 size={18} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>Submit request</span>
                                    <IconArrowRight size={18} stroke={2.5} className="transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 flex items-center justify-center gap-2 font-subtitle text-xs text-paper-500">
                        <IconShieldCheck size={15} aria-hidden="true" />
                        Your details are used only to review this request.
                    </p>
                </div>
            </main>
        </>
    );
}

function Field({ label, required = false, error, children }) {
    return (
        <div className="grid gap-2">
            <label className="font-subtitle text-[13px] font-bold text-paper-800">
                {label} {required && <span className="text-danger">*</span>}
            </label>
            {children}
            {error && <p className="font-subtitle text-sm text-danger-text">{error}</p>}
        </div>
    );
}
