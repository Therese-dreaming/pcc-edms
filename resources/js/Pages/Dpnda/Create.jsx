import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm } from '@inertiajs/react';
import { IconSignature } from '@tabler/icons-react';

// docs/2.1-dpnda-nda-template.md §2.1.b — Form 5 (OJT/Trainee NDA), created by the Department
// Coordinator on behalf of the trainee.
const PANEL = 'overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-resting';
const PANEL_EYEBROW = 'text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700';
const MICRO_LABEL = 'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg-tertiary';
const TEXT_INPUT =
    'block w-full rounded-full border border-border-medium bg-surface-secondary px-4 py-2.5 text-[0.8125rem] text-fg-primary placeholder:text-fg-tertiary shadow-sm transition focus:border-primary-600 focus:outline-none focus:ring-[3px] focus:ring-primary-600/15';
const PRIMARY_BTN =
    'inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        trainee_email: '',
        trainee_last_name: '',
        trainee_first_name: '',
        trainee_middle_initial: '',
        gender: '',
        age: '',
        enrolled_school: '',
        hours_needed: '',
        trainee_type: 'internal_ojt',
        department: '',
        level: '',
        course: '',
        section: '',
        address_house_no: '',
        address_street: '',
        address_barangay: '',
        address_city: '',
        department_assigned: '',
        pcc_supervisor: '',
        endorsed_by: '',
        start_date: '',
        end_date: '',
        guardian_name: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dpnda.store'));
    };

    const field = (name, label, extra = {}) => (
        <div>
            <label htmlFor={name} className={`mb-1.5 block ${MICRO_LABEL}`}>
                {label}
            </label>
            <input
                id={name}
                className={TEXT_INPUT}
                value={data[name]}
                onChange={(e) => setData(name, e.target.value)}
                {...extra}
            />
            <InputError message={errors[name]} className="mt-2" />
        </div>
    );

    const sectionHeading = (eyebrow, title) => (
        <div className="border-b border-border bg-surface-tertiary/50 px-6 py-4">
            <p className={PANEL_EYEBROW}>{eyebrow}</p>
            <h3 className="font-display text-sm font-semibold text-fg-primary">{title}</h3>
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconSignature}
                    title="Form 5 — Non-Disclosure Agreement for On-The-Job Trainee"
                    description="Create an NDA record on behalf of the trainee."
                />
            }
        >
            <Head title="New DPNDA Record" />

            <div className="py-8 font-sans text-fg-primary [font-optical-sizing:auto]">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Trainee */}
                        <div className={PANEL}>
                            {sectionHeading('Section A', 'Trainee')}
                            <div className="space-y-5 p-6">
                                <div>
                                    <label htmlFor="trainee_email" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                        Trainee Account Email (must already be registered)
                                    </label>
                                    <input
                                        id="trainee_email"
                                        type="email"
                                        className={TEXT_INPUT}
                                        value={data.trainee_email}
                                        onChange={(e) => setData('trainee_email', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.trainee_email} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {field('trainee_last_name', 'Last Name')}
                                    {field('trainee_first_name', 'First Name')}
                                    {field('trainee_middle_initial', 'M.I.')}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {field('gender', 'Gender')}
                                    {field('age', 'Age', { type: 'number' })}
                                    <div>
                                        <label htmlFor="trainee_type" className={`mb-1.5 block ${MICRO_LABEL}`}>
                                            Trainee Type
                                        </label>
                                        <select
                                            id="trainee_type"
                                            className={TEXT_INPUT}
                                            value={data.trainee_type}
                                            onChange={(e) => setData('trainee_type', e.target.value)}
                                        >
                                            <option value="internal_ojt">Internal OJT</option>
                                            <option value="external_ojt">External OJT</option>
                                            <option value="community_service">Community Service</option>
                                        </select>
                                    </div>
                                </div>

                                {field('enrolled_school', 'Enrolled In School')}

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {field('hours_needed', 'No. of Hours Needed', { type: 'number' })}
                                    {field('department', 'Dept')}
                                    {field('level', 'Level')}
                                    {field('course', 'Course')}
                                </div>
                                {field('section', 'Section')}
                            </div>
                        </div>

                        {/* Address */}
                        <div className={PANEL}>
                            {sectionHeading('Section B', 'Address')}
                            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                                {field('address_house_no', 'House No.')}
                                {field('address_street', 'Street')}
                                {field('address_barangay', 'Barangay')}
                                {field('address_city', 'City')}
                            </div>
                        </div>

                        {/* Placement */}
                        <div className={PANEL}>
                            {sectionHeading('Section C', 'Placement')}
                            <div className="space-y-5 p-6">
                                {field('department_assigned', 'Department Assigned')}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {field('pcc_supervisor', 'PCC Supervisor/Coordinator')}
                                    {field('endorsed_by', 'Endorsed By')}
                                </div>
                                {field('guardian_name', 'Guardian/Parent Name (if minor)')}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {field('start_date', 'Duration — Start', { type: 'date' })}
                                    {field('end_date', 'Duration — End', { type: 'date' })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={processing} className={PRIMARY_BTN}>
                                <IconSignature size={16} strokeWidth={2} />
                                {processing ? 'Creating…' : 'Create NDA Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
