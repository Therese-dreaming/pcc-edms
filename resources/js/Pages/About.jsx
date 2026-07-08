import { Head, Link } from '@inertiajs/react';
import {
    IconArrowLeft,
    IconBuildingBank,
    IconCertificate,
    IconFileText,
    IconFlask,
    IconShieldLock,
    IconSignature,
} from '@tabler/icons-react';

const MODULES = [
    {
        icon: IconShieldLock,
        name: 'DPREQ',
        owner: 'Data Privacy Office (DPO)',
        description:
            'The online application for data privacy clearance — the single intake form that starts both the DPO and Ethics review tracks for a study.',
    },
    {
        icon: IconSignature,
        name: 'DPNDA',
        owner: 'Data Privacy Office (DPO)',
        description:
            'Digital signing and storage of non-disclosure agreements for on-the-job trainees and student teachers handling personal data.',
    },
    {
        icon: IconFlask,
        name: 'REMIS',
        owner: 'Office of Research and Development (ORD), via the Research Ethics Committee',
        description:
            'The Research Ethics Management Information System — endorsement, screening, review, decision, monitoring, and archiving for research studies.',
    },
];

const CAPABILITIES = [
    'Online application for DPO and Research Ethics Committee clearances',
    'Online submission of supporting requirements and documents',
    'Online signing of NDAs for researchers and on-the-job trainees',
    'A centralized, searchable digital document repository',
    'Workflow automation across review, endorsement, and approval steps',
    'On-demand report generation for compliance and oversight',
];

export default function About() {
    return (
        <>
            <Head title="About" />

            <div className="min-h-screen bg-stone-50 font-sans">
                <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                    <Link
                        href={route('login')}
                        className="mb-8 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                    >
                        <IconArrowLeft size={16} aria-hidden="true" />
                        Back to login
                    </Link>

                    <div className="mb-10 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-700 shadow-sm">
                            <IconBuildingBank size={28} className="text-white" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">
                                About PCC-EDMS
                            </h1>
                            <p className="font-subtitle mt-1 text-stone-600">
                                Pasig Catholic College — Electronic Document Management System
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                            <div className="border-b border-stone-200 bg-stone-50/50 px-6 py-4">
                                <h2 className="text-lg font-semibold text-stone-900">What it is</h2>
                            </div>
                            <div className="p-6 space-y-3 text-sm leading-relaxed text-stone-700">
                                <p>
                                    PCC-EDMS is a single digital platform shared by two offices at Pasig
                                    Catholic College: the <strong>Data Privacy Office (DPO)</strong> and the{' '}
                                    <strong>Office of Research and Development (ORD)</strong>, acting through
                                    its <strong>Research Ethics Committee (REC)</strong>. Before this system,
                                    data privacy clearances and research ethics reviews ran as separate,
                                    largely paper-based processes. PCC-EDMS brings both under one roof so a
                                    single application can move through both tracks without duplicate
                                    paperwork.
                                </p>
                            </div>
                        </section>

                        <section className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                            <div className="border-b border-stone-200 bg-stone-50/50 px-6 py-4">
                                <h2 className="text-lg font-semibold text-stone-900">Purpose</h2>
                            </div>
                            <div className="p-6 space-y-3 text-sm leading-relaxed text-stone-700">
                                <p>
                                    The system exists to let researchers, on-the-job trainees, and
                                    institutional reviewers handle every step of a data privacy or research
                                    ethics clearance online — from initial application through endorsement,
                                    screening, review, decision, monitoring, and archiving — with a
                                    verifiable, auditable trail at each step.
                                </p>
                                <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 pt-2">
                                    {CAPABILITIES.map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600"></span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                            <div className="border-b border-stone-200 bg-stone-50/50 px-6 py-4">
                                <h2 className="text-lg font-semibold text-stone-900">The three modules</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {MODULES.map((mod) => (
                                    <div key={mod.name} className="flex items-start gap-4 rounded-lg border border-stone-200 p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                                            <mod.icon size={20} className="text-primary-700" strokeWidth={2} aria-hidden="true" />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="font-semibold text-stone-900">{mod.name}</h3>
                                                <span className="text-xs text-stone-500">{mod.owner}</span>
                                            </div>
                                            <p className="mt-1 text-sm text-stone-600 leading-relaxed">{mod.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                            <div className="border-b border-stone-200 bg-stone-50/50 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <IconCertificate size={20} className="text-primary-700" strokeWidth={2} aria-hidden="true" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-stone-900">Clearance verification</h2>
                                </div>
                            </div>
                            <div className="p-6 text-sm leading-relaxed text-stone-700">
                                <p>
                                    Every clearance issued through PCC-EDMS carries a system-generated
                                    tracking number. Anyone can confirm a clearance certificate's
                                    authenticity and current validity — without needing an account — through
                                    the{' '}
                                    <Link href={route('verify')} className="font-medium text-primary-700 hover:underline">
                                        public verification portal
                                    </Link>
                                    . The portal only ever shows whether a clearance is valid; it does not
                                    expose the underlying study details or personal information.
                                </p>
                            </div>
                        </section>

                        <section className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                            <div className="border-b border-stone-200 bg-stone-50/50 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                        <IconFileText size={20} className="text-primary-700" strokeWidth={2} aria-hidden="true" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-stone-900">Who it's for</h2>
                                </div>
                            </div>
                            <div className="p-6 text-sm leading-relaxed text-stone-700">
                                <p>
                                    Students, faculty, and staff conducting research or handling personal
                                    data at Pasig Catholic College — along with the DPO staff, ethics
                                    secretariat, reviewers, committee members, and academic endorsers
                                    (advisers, program heads, deans) who process those applications.
                                </p>
                            </div>
                        </section>
                    </div>

                    <p className="mt-10 text-center text-xs text-stone-500">
                        Pasig Catholic College — Electronic Document Management System
                    </p>
                </div>
            </div>
        </>
    );
}
