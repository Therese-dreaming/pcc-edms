import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Table, THead, TBody, Tr, Th, Td, EmptyRow } from '@/Components/Table';
import { Head, Link, router } from '@inertiajs/react';
import { IconHistory, IconDownload, IconRestore, IconColumns, IconX } from '@tabler/icons-react';
import { useState } from 'react';

export default function VersionHistory({ documentableType, documentableId, documentTypes, versions }) {
    const documentableLabel = documentableType.replace('App\\Modules\\', '').replace('Models\\', '').replace(/\\/g, ' ');

    // Reviewer side-by-side comparison (stakeholder-additional-features.md, "Versioned File
    // Submission"): pick two versions of the same document type and view them in adjacent panes.
    // `compare` holds { left, right } document objects, or null when the compare view is closed.
    const [selected, setSelected] = useState({}); // keyed by document_type -> [ids]
    const [compare, setCompare] = useState(null);

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    };

    const toggleSelect = (documentType, docId) => {
        setSelected((prev) => {
            const current = prev[documentType] || [];
            let next;
            if (current.includes(docId)) {
                next = current.filter((id) => id !== docId);
            } else {
                // keep at most two, dropping the oldest selection
                next = [...current, docId].slice(-2);
            }
            return { ...prev, [documentType]: next };
        });
    };

    const openCompare = (group) => {
        const ids = selected[group.document_type] || [];
        const docs = ids.map((id) => group.documents.find((d) => d.id === id)).filter(Boolean);
        if (docs.length !== 2) return;
        // Show the older version on the left, newer on the right.
        const [left, right] = [...docs].sort((a, b) => a.version - b.version);
        setCompare({ documentType: group.document_type, left, right });
    };

    const handleRestore = (documentId, documentType, version) => {
        if (!confirm(`Restore version ${version} of ${documentType} as the current version? This will make all other versions of this document type older.`)) {
            return;
        }
        router.post(route('documents.restore', documentId), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const isPreviewable = (mime) => mime && (mime === 'application/pdf' || mime.startsWith('image/'));

    const PreviewPane = ({ doc }) => (
        <div className="flex-1 min-w-0">
            <div className="mb-2 rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
                <span className="font-semibold">v{doc.version}</span>
                {doc.is_current_version && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">Current</span>
                )}
                <span className="ml-2 text-zinc-500">{doc.original_filename}</span>
                <span className="ml-2 text-zinc-400">· {new Date(doc.created_at).toLocaleString()} · {doc.uploaded_by || 'System'}</span>
            </div>
            {isPreviewable(doc.mime_type) ? (
                <iframe
                    title={`Version ${doc.version} preview`}
                    src={route('documents.preview', doc.id)}
                    className="h-[70vh] w-full rounded-md border border-zinc-200 bg-white"
                />
            ) : (
                <div className="flex h-[70vh] flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-center text-sm text-zinc-500">
                    <p>No inline preview for this file type ({doc.mime_type || 'unknown'}).</p>
                    <a href={route('documents.download', doc.id)} className="mt-2 text-primary-700 hover:underline">
                        Download v{doc.version}
                    </a>
                </div>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    icon={IconHistory}
                    title="Document Version History"
                    description={`All versions of documents attached to ${documentableLabel} #${documentableId}.`}
                />
            }
        >
            <Head title="Document Version History" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {versions.length === 0 ? (
                        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
                            <IconHistory size={32} className="mx-auto text-zinc-300" />
                            <p className="mt-3 text-zinc-500">No documents found for this record.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {versions.map((group) => {
                                const picked = selected[group.document_type] || [];
                                return (
                                <div key={group.document_type}>
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-600">
                                            {group.document_type}
                                        </h2>
                                        <button
                                            type="button"
                                            disabled={picked.length !== 2}
                                            onClick={() => openCompare(group)}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            title={picked.length === 2 ? 'Compare the two selected versions' : 'Select two versions to compare'}
                                        >
                                            <IconColumns size={14} />
                                            Compare selected ({picked.length}/2)
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                                        <Table ariaLabel={`Versions of ${group.document_type}`}>
                                            <THead>
                                                <Tr>
                                                    <Th>Compare</Th>
                                                    <Th>Version</Th>
                                                    <Th>File Name</Th>
                                                    <Th>Size</Th>
                                                    <Th>Uploaded By</Th>
                                                    <Th>Uploaded At</Th>
                                                    <Th>Status</Th>
                                                    <Th className="text-right">Actions</Th>
                                                </Tr>
                                            </THead>
                                            <TBody>
                                                {group.documents.length === 0 ? (
                                                    <EmptyRow colSpan={8} />
                                                ) : (
                                                    group.documents.map((doc) => (
                                                        <Tr key={doc.id}>
                                                            <Td>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={picked.includes(doc.id)}
                                                                    onChange={() => toggleSelect(group.document_type, doc.id)}
                                                                    aria-label={`Select v${doc.version} for comparison`}
                                                                    className="h-4 w-4 rounded border-zinc-300 text-primary-700 focus:ring-primary-600"
                                                                />
                                                            </Td>
                                                            <Td>v{doc.version}</Td>
                                                            <Td>{doc.original_filename}</Td>
                                                            <Td>{formatFileSize(doc.size_bytes)}</Td>
                                                            <Td>{doc.uploaded_by || 'System'}</Td>
                                                            <Td>{new Date(doc.created_at).toLocaleString()}</Td>
                                                            <Td>
                                                                {doc.is_current_version ? (
                                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                                        Current
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                                                                        Older
                                                                    </span>
                                                                )}
                                                            </Td>
                                                            <Td className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <a
                                                                        href={route('documents.download', doc.id)}
                                                                        className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                                                    >
                                                                        <IconDownload size={14} />
                                                                    </a>
                                                                    {!doc.is_current_version && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRestore(doc.id, doc.document_type, doc.version)}
                                                                            className="inline-flex items-center justify-center rounded-md border border-primary-300 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
                                                                            title={`Restore v${doc.version} as current`}
                                                                        >
                                                                            <IconRestore size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </Td>
                                                        </Tr>
                                                    ))
                                                )}
                                            </TBody>
                                        </Table>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-6">
                        <Link
                            href={route('dashboard')}
                            className="text-sm text-primary-700 hover:underline"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {compare && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/40 p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
                            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-700">
                                Comparing {compare.documentType}: v{compare.left.version} ↔ v{compare.right.version}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCompare(null)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                                <IconX size={14} /> Close
                            </button>
                        </div>
                        <div className="flex flex-1 flex-col gap-4 overflow-auto p-5 lg:flex-row">
                            <PreviewPane doc={compare.left} />
                            <PreviewPane doc={compare.right} />
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
