import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    IconBuildingBank,
    IconMapPin,
    IconSchool,
    IconUserCheck,
    IconWorld,
} from '@tabler/icons-react';

const ROLE_DISPLAY = {
    researcher_internal: {
        label: 'Internal Researcher',
        description: 'Faculty, staff, or students conducting research within PCC.',
        icon: IconSchool,
    },
    researcher_external: {
        label: 'External Researcher',
        description: 'Researchers affiliated with an outside institution.',
        icon: IconWorld,
    },
    ojt_trainee_internal: {
        label: 'OJT Internal',
        description: 'On-the-job trainees placed within a PCC department.',
        icon: IconBuildingBank,
    },
    ojt_trainee_external: {
        label: 'OJT External',
        description: 'On-the-job trainees placed with an external partner.',
        icon: IconMapPin,
    },
};

export default function SelectRole({ roles }) {
    const [submittingId, setSubmittingId] = useState(null);

    const selectRole = (role) => {
        if (submittingId) {
            return;
        }

        setSubmittingId(role.id);
        router.post(
            route('role.select.store'),
            { role_id: role.id },
            { onError: () => setSubmittingId(null) },
        );
    };

    return (
        <>
            <Head title="Select Your Role" />

            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-700 shadow-sm mb-5">
                            <IconUserCheck size={28} className="text-white" aria-hidden="true" />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight mb-2">
                            Tell us who you are
                        </h1>
                        <p className="font-subtitle text-stone-600 max-w-xl mx-auto">
                            Pick the option that describes you to continue. This decides which
                            forms and applications you'll see — you can't change it yourself
                            afterward.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {roles.map((role) => {
                            const display = ROLE_DISPLAY[role.name];
                            if (!display) {
                                return null;
                            }

                            const Icon = display.icon;
                            const isSubmitting = submittingId === role.id;

                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => selectRole(role)}
                                    disabled={submittingId !== null}
                                    className="group flex flex-col items-center text-center bg-white rounded-lg border border-stone-200 shadow-sm p-6 hover:border-primary-300 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 border border-primary-100 group-hover:bg-primary-100 transition-colors mb-4">
                                        <Icon size={26} className="text-primary-700" strokeWidth={1.75} aria-hidden="true" />
                                    </div>
                                    <h2 className="font-display text-base font-semibold text-stone-900 mb-1.5">
                                        {display.label}
                                    </h2>
                                    <p className="text-sm text-stone-600 leading-relaxed">
                                        {display.description}
                                    </p>
                                    <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-700">
                                        {isSubmitting ? 'Selecting…' : 'Select'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <p className="mt-8 text-center text-xs text-stone-500">
                        Not one of these? An administrator can assign a different role to your
                        account.
                    </p>
                </div>
            </div>
        </>
    );
}
