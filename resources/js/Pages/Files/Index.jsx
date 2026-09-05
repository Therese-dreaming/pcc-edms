import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    IconChevronRight, IconDownload, IconEye, IconFile, IconFileText, IconFileTypePdf,
    IconFolderFilled, IconFolders, IconPhoto, IconSearch, IconUser, IconX,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// File Management System (DPO / System Administrator) — a File-Explorer-style browser over every
// stored document. Folders drill down module -> department -> applicant -> application -> the two
// categories (Generated Documents / Submitted Files) -> files. Everything is server-driven: a
// folder click is just an Inertia GET with a new ?path. Design per .claude/skills/redesign.

function formatBytes(bytes) {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Map a folder "kind" to a tint so the tree levels read at a glance. Category folders carry the
// brand-vs-neutral distinction: generated forms in the red brand tint, submitted uploads neutral.
function folderAccent(folder) {
    if (folder.kind === 'category') {
        return folder.category === 'generated'
            ? 'bg-primary-soft text-primary'
            : 'bg-surface-tertiary text-fg-secondary';
    }
    return 'bg-primary-soft text-primary';
}

function FileTypeIcon({ mime, size = 22 }) {
    if (mime === 'application/pdf') return <IconFileTypePdf size={size} className="text-primary" />;
    if (mime?.startsWith('image/')) return <IconPhoto size={size} className="text-fg-secondary" />;
    if (mime?.includes('word') || mime?.includes('document')) return <IconFileText size={size} className="text-fg-secondary" />;
    return <IconFile size={size} className="text-fg-tertiary" />;
}

function StatusChip({ status }) {
    const map = {
        current: 'bg-success-bg text-success-text',
        superseded: 'bg-surface-tertiary text-fg-secondary',
        archived: 'bg-warning-bg text-warning-text',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? map.superseded}`}>
            {status}
        </span>
    );
}

function Breadcrumbs({ crumbs }) {
    return (
        <nav aria-label="Folder breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                    <span key={crumb.path} className="flex items-center gap-1">
                        {index > 0 && <IconChevronRight size={15} className="text-border-medium" />}
                        {isLast ? (
                            <span className="font-semibold text-fg-primary">{crumb.label}</span>
                        ) : (
                            <Link
                                href={route('files.index', { path: crumb.path || undefined })}
                                className="rounded-md px-1.5 py-0.5 font-medium text-fg-tertiary hover:bg-surface-tertiary hover:text-primary"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

function FolderCard({ folder }) {
    const KindIcon = folder.kind === 'applicant' ? IconUser : IconFolderFilled;
    return (
        <Link
            href={route('files.index', { path: folder.path })}
            className="group flex items-center gap-4 rounded-xl border border-border bg-surface-primary p-4 shadow-resting transition-colors hover:border-primary hover:bg-surface-tertiary"
        >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${folderAccent(folder)}`}>
                <KindIcon size={26} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg-primary">{folder.name}</span>
                {folder.subtitle && (
                    <span className="mt-0.5 block truncate text-xs text-fg-tertiary">{folder.subtitle}</span>
                )}
                <span className="mt-1 block text-xs font-medium text-fg-tertiary">{folder.meta}</span>
            </span>
        </Link>
    );
}

function FileCard({ file }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-primary p-4 shadow-resting">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-tertiary">
                <FileTypeIcon mime={file.mime_type} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-fg-primary" title={file.name}>{file.name}</span>
                    <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold text-fg-tertiary">v{file.version}</span>
                    <StatusChip status={file.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-fg-tertiary" title={file.original_filename}>
                    {file.document_type} · {file.original_filename}
                </p>
                <p className="mt-1 text-xs text-fg-tertiary">
                    {formatBytes(file.size_bytes)} · {formatDate(file.created_at)} · {file.uploaded_by || 'System'}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {(file.mime_type === 'application/pdf' || file.mime_type?.startsWith('image/')) && (
                    <a
                        href={route('documents.preview', file.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-secondary hover:border-primary hover:text-primary"
                        title="Preview"
                    >
                        <IconEye size={17} />
                    </a>
                )}
                <a
                    href={route('documents.download', file.id)}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border text-fg-secondary hover:border-primary hover:text-primary"
                    title="Download"
                >
                    <IconDownload size={17} />
                </a>
            </div>
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div className="col-span-full rounded-xl border border-dashed border-border-medium bg-surface-primary p-12 text-center">
            <IconFolders size={36} className="mx-auto text-border-medium" />
            <p className="mt-3 text-sm font-medium text-fg-secondary">{label}</p>
        </div>
    );
}

export default function Index({ path, search: initialSearch, breadcrumbs, folders, files, level }) {
    const [search, setSearch] = useState(initialSearch ?? '');
    const isFirstRender = useRef(true);

    // Debounced search — clears the path so results come from the whole repository, not the
    // folder you happened to be standing in.
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const timeout = setTimeout(() => {
            router.get(route('files.index'), { search: search || undefined }, {
                preserveState: true, preserveScroll: true, replace: true,
            });
        }, 350);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const hasContent = folders.length > 0 || files.length > 0;
    const isSearching = (initialSearch ?? '') !== '';

    return (
        <AuthenticatedLayout>
            <Head title="File Manager" />

            <div className="mx-auto max-w-6xl px-5 py-6 sm:px-7 lg:px-10">
                {/* Header — typographic, no icon */}
                <div className="mb-8 border-b border-border pb-6">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-primary-700">Repository</p>
                    <h1 className="mt-2 text-balance font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-fg-primary lg:text-4xl">File Manager</h1>
                    <p className="mt-3 max-w-2xl text-sm text-fg-tertiary">Browse system-generated documents and applicant-submitted files across every module.</p>
                </div>
                {/* Toolbar: breadcrumb + search */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Breadcrumbs crumbs={breadcrumbs} />
                    <div className="flex w-full items-center gap-3 sm:w-auto">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface-primary px-4 py-2 focus-within:border-primary sm:w-72">
                            <IconSearch size={17} className="shrink-0 text-fg-tertiary" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search all files..."
                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0 placeholder:text-fg-tertiary"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch('')} className="text-fg-tertiary hover:text-primary" aria-label="Clear search">
                                    <IconX size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isSearching && (
                    <p className="mb-4 text-sm text-fg-tertiary">
                        Showing files matching <span className="font-semibold text-fg-primary">“{initialSearch}”</span> across all folders.
                    </p>
                )}

                {/* Folders */}
                {folders.length > 0 && (
                    <div className="mb-8">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary">Folders</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {folders.map((folder) => <FolderCard key={folder.path} folder={folder} />)}
                        </div>
                    </div>
                )}

                {/* Files */}
                {files.length > 0 && (
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary">
                            {files.length === 1 ? '1 file' : `${files.length} files`}
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            {files.map((file) => <FileCard key={file.id} file={file} />)}
                        </div>
                    </div>
                )}

                {!hasContent && (
                    <div className="grid grid-cols-1">
                        <EmptyState label={isSearching ? 'No files match your search.' : 'This folder is empty.'} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
