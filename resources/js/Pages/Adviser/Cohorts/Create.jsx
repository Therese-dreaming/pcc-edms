import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconUsersGroup } from '@tabler/icons-react';

export default function Create({ applicantRoles }) {
    const roleLabels = {
        researcher_internal: 'Internal Researcher',
        researcher_external: 'External Researcher',
    };

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        department: '',
        level: '',
        course: '',
        section: '',
        role_id: applicantRoles[0]?.id ?? '',
        expires_at: '',
        max_members: '',
        allowed_email_domains: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('adviser.cohorts.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconUsersGroup}
                    title="New Class"
                    description="Create the class once, then share its join code with your students."
                />
            }
        >
            <Head title="New Class" />

            <div className="py-8">
                <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                        <div className="p-6">
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="name" value="Class name" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        placeholder="e.g. BSIT-4A Research 2026-2027"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="department" value="Department (optional)" />
                                        <TextInput id="department" className="mt-1 block w-full" value={data.department} onChange={(e) => setData('department', e.target.value)} />
                                        <InputError message={errors.department} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="course" value="Course (optional)" />
                                        <TextInput id="course" className="mt-1 block w-full" value={data.course} onChange={(e) => setData('course', e.target.value)} />
                                        <InputError message={errors.course} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="level" value="Level (optional)" />
                                        <TextInput id="level" className="mt-1 block w-full" value={data.level} onChange={(e) => setData('level', e.target.value)} />
                                        <InputError message={errors.level} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="section" value="Section (optional)" />
                                        <TextInput id="section" className="mt-1 block w-full" value={data.section} onChange={(e) => setData('section', e.target.value)} />
                                        <InputError message={errors.section} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="role_id" value="Students join as" />
                                    <select
                                        id="role_id"
                                        className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm transition-colors focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
                                        value={data.role_id}
                                        onChange={(e) => setData('role_id', e.target.value)}
                                        required
                                    >
                                        {applicantRoles.map((r) => (
                                            <option key={r.id} value={r.id}>{roleLabels[r.name] ?? r.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.role_id} className="mt-2" />
                                </div>

                                <hr className="border-zinc-200" />
                                <p className="text-sm font-medium text-zinc-700">Enrolment limits</p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="expires_at" value="Join code expires (optional)" />
                                        <TextInput id="expires_at" type="date" className="mt-1 block w-full" value={data.expires_at} onChange={(e) => setData('expires_at', e.target.value)} />
                                        <InputError message={errors.expires_at} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="max_members" value="Expected headcount (optional)" />
                                        <TextInput id="max_members" type="number" min="1" className="mt-1 block w-full" placeholder="e.g. 45" value={data.max_members} onChange={(e) => setData('max_members', e.target.value)} />
                                        <InputError message={errors.max_members} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="allowed_email_domains" value="Restrict to email domains (optional)" />
                                    <TextInput
                                        id="allowed_email_domains"
                                        className="mt-1 block w-full"
                                        placeholder="pcc.edu.ph, pccnet.edu.ph"
                                        value={data.allowed_email_domains}
                                        onChange={(e) => setData('allowed_email_domains', e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-zinc-500">
                                        Only these domains can enrol with the code. Leave blank to allow any address
                                        (needed for external researchers).
                                    </p>
                                    <InputError message={errors.allowed_email_domains} className="mt-2" />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <PrimaryButton disabled={processing}>Create class</PrimaryButton>
                                    <Link href={route('adviser.cohorts.index')} className="text-sm text-zinc-600 hover:underline">
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
