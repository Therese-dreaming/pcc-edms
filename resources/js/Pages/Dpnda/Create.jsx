import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';

// docs/2.1-dpnda-nda-template.md §2.1.b — Form 5 (OJT/Trainee NDA), created by the Department
// Coordinator on behalf of the trainee.
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
            <InputLabel htmlFor={name} value={label} />
            <TextInput
                id={name}
                className="mt-1 block w-full"
                value={data[name]}
                onChange={(e) => setData(name, e.target.value)}
                {...extra}
            />
            <InputError message={errors[name]} className="mt-2" />
        </div>
    );

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Form 5 — Non-Disclosure Agreement for On-The-Job Trainee</h2>}
        >
            <Head title="New DPNDA Record" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-6">
                            <h3 className="text-lg font-semibold">Trainee</h3>
                            <div>
                                <InputLabel htmlFor="trainee_email" value="Trainee Account Email (must already be registered)" />
                                <TextInput
                                    id="trainee_email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.trainee_email}
                                    onChange={(e) => setData('trainee_email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.trainee_email} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {field('trainee_last_name', 'Last Name')}
                                {field('trainee_first_name', 'First Name')}
                                {field('trainee_middle_initial', 'M.I.')}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {field('gender', 'Gender')}
                                {field('age', 'Age', { type: 'number' })}
                                <div>
                                    <InputLabel htmlFor="trainee_type" value="Trainee Type" />
                                    <select
                                        id="trainee_type"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        value={data.trainee_type}
                                        onChange={(e) => setData('trainee_type', e.target.value)}
                                    >
                                        <option value="internal_ojt">Internal OJT</option>
                                        <option value="external_ojt">External OJT</option>
                                        <option value="student_teacher">Student Teacher</option>
                                        <option value="community_service">Community Service</option>
                                    </select>
                                </div>
                            </div>

                            {field('enrolled_school', 'Enrolled In School')}

                            <div className="grid grid-cols-4 gap-4">
                                {field('hours_needed', 'No. of Hours Needed', { type: 'number' })}
                                {field('department', 'Dept')}
                                {field('level', 'Level')}
                                {field('course', 'Course')}
                            </div>
                            {field('section', 'Section')}

                            <h3 className="pt-4 text-lg font-semibold">Address</h3>
                            <div className="grid grid-cols-4 gap-4">
                                {field('address_house_no', 'House No.')}
                                {field('address_street', 'Street')}
                                {field('address_barangay', 'Barangay')}
                                {field('address_city', 'City')}
                            </div>

                            <h3 className="pt-4 text-lg font-semibold">Placement</h3>
                            {field('department_assigned', 'Department Assigned')}
                            {field('pcc_supervisor', 'PCC Supervisor/Coordinator')}
                            {field('endorsed_by', 'Endorsed By')}
                            {field('guardian_name', 'Guardian/Parent Name (if minor)')}

                            <div className="grid grid-cols-2 gap-4">
                                {field('start_date', 'Duration — Start', { type: 'date' })}
                                {field('end_date', 'Duration — End', { type: 'date' })}
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton disabled={processing}>Create NDA Record</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
