import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';

// docs/3.5-remis-incident-reporting.md
export default function Create({ remisApplication }) {
    const { data, setData, post, processing, errors } = useForm({
        incident_type: 'participant_complaint',
        severity: 'low',
        incident_date: '',
        description: '',
        immediate_actions: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('incidents.store', remisApplication.id));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Report Incident — {remisApplication.tracking_number}</h2>}>
            <Head title="Report Incident" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="incident_type" value="Incident Type" />
                                <select
                                    id="incident_type"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.incident_type}
                                    onChange={(e) => setData('incident_type', e.target.value)}
                                >
                                    <option value="participant_complaint">Participant Complaint</option>
                                    <option value="data_breach">Data Breach</option>
                                    <option value="confidentiality_breach">Confidentiality Breach</option>
                                    <option value="psychological_harm">Psychological Harm</option>
                                    <option value="protocol_violation">Protocol Violation</option>
                                    <option value="other">Other Ethics Concern</option>
                                </select>
                                {(data.incident_type === 'data_breach' || data.incident_type === 'confidentiality_breach') && (
                                    <p className="mt-1 text-sm text-amber-600">
                                        DPO Staff will be notified immediately for this incident type (docs/3.5).
                                    </p>
                                )}
                            </div>

                            <div>
                                <InputLabel htmlFor="severity" value="Severity" />
                                <select
                                    id="severity"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.severity}
                                    onChange={(e) => setData('severity', e.target.value)}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="incident_date" value="Date of Incident" />
                                <TextInput
                                    id="incident_date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.incident_date}
                                    onChange={(e) => setData('incident_date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.incident_date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value="Description" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="immediate_actions" value="Immediate Actions Taken" />
                                <textarea
                                    id="immediate_actions"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={data.immediate_actions}
                                    onChange={(e) => setData('immediate_actions', e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton disabled={processing}>Report Incident</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
