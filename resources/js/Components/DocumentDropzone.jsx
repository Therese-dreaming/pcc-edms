import { useRef, useState } from 'react';
import InputError from '@/Components/InputError';
import {
    IconFile,
    IconFileText,
    IconFileTypePdf,
    IconPaperclip,
    IconPhoto,
    IconX,
} from '@tabler/icons-react';

// A single labelled document slot rendered as a compact row. Accepts multiple
// files — choosing or dropping files ADDS them to the list (never overwrites);
// each file has its own remove button. The whole row is a drag-and-drop target.
// Minimal footprint so Section D slots grid densely. API: files / onAdd /
// onRemove / error; `badge === 'Required'` renders a red asterisk.
const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileIcon = ({ name = '', size = 18, className = '' }) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return <IconFileTypePdf size={size} className={className} />;
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return <IconFileText size={size} className={className} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <IconPhoto size={size} className={className} />;
    return <IconFile size={size} className={className} />;
};

export default function DocumentDropzone({ title, badge, files = [], onAdd, onRemove, error }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const required = badge === 'Required';

    const openPicker = () => inputRef.current?.click();

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer?.files?.length) onAdd(e.dataTransfer.files);
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`self-start rounded-lg border transition-colors ${
                error
                    ? 'border-danger'
                    : dragging
                        ? 'border-primary-400 bg-primary-50/50'
                        : 'border-border bg-surface-secondary'
            }`}
        >
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <p className="min-w-0 truncate text-sm font-medium text-fg-primary" title={title}>
                    {title}
                    {required && (
                        <span className="ml-0.5 text-danger" aria-hidden="true">
                            *
                        </span>
                    )}
                </p>
                <button
                    type="button"
                    onClick={openPicker}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-medium px-2.5 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/20"
                >
                    <IconPaperclip size={14} strokeWidth={2} aria-hidden="true" />
                    {files.length > 0 ? 'Add' : 'Attach'}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        onAdd(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {files.length > 0 && (
                <ul className="space-y-1 border-t border-border px-3.5 py-2">
                    {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs">
                            <FileIcon name={f.name} size={15} className="shrink-0 text-fg-tertiary" />
                            <span className="min-w-0 flex-1 truncate text-fg-secondary">{f.name}</span>
                            <span className="shrink-0 tabular-nums text-fg-tertiary">{formatBytes(f.size)}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(i)}
                                aria-label={`Remove ${f.name}`}
                                className="shrink-0 rounded p-0.5 text-fg-tertiary transition-colors hover:text-danger-text focus:outline-none focus-visible:ring-1 focus-visible:ring-danger/40"
                            >
                                <IconX size={13} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <div className="px-3.5 pb-2">
                    <InputError message={error} />
                </div>
            )}
        </div>
    );
}
