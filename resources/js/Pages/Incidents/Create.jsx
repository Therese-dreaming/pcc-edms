import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, useForm } from '@inertiajs/react';
import { IconAlertTriangle } from '@tabler/icons-react';

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
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconAlertTriangle}
                    title={`Report Incident — ${remisApplication.tracking_number}`}
                    description="Document what happened and any immediate actions taken."
                />
            }
        >
            <Head title="Report Incident" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <IconAlertTriangle size={20} className="text-primary-700" strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900">Incident Details</h3>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="incident_type" value="Incident Type" />
                                <select
                                    id="incident_type"
                                    className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
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
                                    <p className="mt-2 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                                        <IconAlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" strokeWidth={2} />
                                        DPO Staff will be notified immediately for this incident type (docs/3.5).
                                    </p>
                                )}
                            </div>

                            <div>
                                <InputLabel htmlFor="severity" value="Severity" />
                                <select
                                    id="severity"
                                    className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
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
                                    rows="4"
                                    className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
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
                                    rows="4"
                                    className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-colors"
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
