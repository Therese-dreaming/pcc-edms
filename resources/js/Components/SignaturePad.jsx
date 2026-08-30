import { useEffect, useRef, useState } from 'react';
import { IconEraser, IconSignature, IconX, IconCheck } from '@tabler/icons-react';
import SignaturePadLib from 'signature_pad';
import Modal from '@/Components/Modal';

// Draws the signature in a large modal canvas instead of a small inline box.
// Inline area shows either a "tap to sign" trigger or a preview of the captured
// signature. The API is unchanged (onChange/className/disabled) so every page
// using <SignaturePad /> gets the bigger pad with no changes.
export default function SignaturePad({ onChange, className = '', disabled = false }) {
    const canvasRef = useRef(null);
    const padRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // The canvas only exists in the DOM while the modal is open, so initialize
    // the pad here. requestAnimationFrame waits one frame for Headless UI to
    // finish mounting the panel so the canvas has real dimensions.
    useEffect(() => {
        if (!isModalOpen) return;

        const raf = requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const pad = new SignaturePadLib(canvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(74, 19, 33)',
                minWidth: 1,
                maxWidth: 2.6,
                throttle: 12,
            });
            padRef.current = pad;

            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
        });

        return () => {
            cancelAnimationFrame(raf);
            padRef.current?.off();
            padRef.current = null;
        };
    }, [isModalOpen]);

    const openModal = () => {
        if (!disabled) setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const confirm = () => {
        const pad = padRef.current;
        if (!pad || pad.isEmpty()) return;
        const dataUrl = pad.toDataURL('image/png');
        setPreviewUrl(dataUrl);
        onChangeRef.current?.(dataUrl);
        closeModal();
    };

    const clearPad = () => padRef.current?.clear();

    const removeSignature = () => {
        setPreviewUrl(null);
        onChangeRef.current?.(null);
    };

    return (
        <div className={className}>
            <div className="mb-2 flex items-end justify-between gap-4">
                <label className="flex items-center gap-2 font-subtitle text-sm font-bold text-paper-800">
                    <IconSignature size={17} className="text-primary-700" aria-hidden="true" />
                    Drawn signature
                </label>
                <span className="font-subtitle text-[0.6875rem] font-medium text-paper-400">Visual representation only</span>
            </div>

            {previewUrl ? (
                <div className={`relative overflow-hidden rounded-xl border border-primary-300 bg-white ${disabled ? 'opacity-60' : ''}`}>
                    <img src={previewUrl} alt="Your drawn signature" className="block h-28 w-full object-contain p-2" />
                    {!disabled && (
                        <div className="flex items-center justify-end gap-1 border-t border-paper-200 bg-paper-50 px-2 py-1.5">
                            <button
                                type="button"
                                onClick={openModal}
                                className="rounded-lg px-2.5 py-1.5 font-subtitle text-xs font-bold text-primary-700 hover:bg-primary-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/15"
                            >
                                Re-sign
                            </button>
                            <button
                                type="button"
                                onClick={removeSignature}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-subtitle text-xs font-bold text-paper-500 hover:bg-paper-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-paper-500/15"
                            >
                                <IconEraser size={13} aria-hidden="true" />
                                Remove
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={openModal}
                    disabled={disabled}
                    className={`flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/15 ${
                        disabled
                            ? 'cursor-not-allowed border-paper-200 opacity-60'
                            : 'border-paper-300 hover:border-primary-300 hover:bg-primary-50/40'
                    }`}
                >
                    <IconSignature size={26} className="text-paper-400" aria-hidden="true" />
                    <span className="font-subtitle text-sm font-semibold text-paper-600">Tap to sign</span>
                    <span className="font-subtitle text-xs text-paper-400">Opens a larger drawing pad</span>
                </button>
            )}

            <p className="mt-2 font-subtitle text-xs leading-relaxed text-paper-500">
                Your typed full name and timestamp remain the operative record.
            </p>

            <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl" closeable={false}>
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-subtitle text-lg font-bold text-paper-800">Draw your signature</h3>
                        <button
                            type="button"
                            onClick={closeModal}
                            aria-label="Close signature pad"
                            className="rounded-lg p-1.5 text-paper-400 hover:bg-paper-100 hover:text-paper-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/15"
                        >
                            <IconX size={20} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-paper-200 bg-white">
                        <canvas
                            ref={canvasRef}
                            className="block h-72 w-full touch-none bg-white"
                            aria-label="Draw your signature"
                        />
                        <div className="pointer-events-none absolute inset-x-6 bottom-9 border-t border-paper-200 pt-2 font-subtitle text-xs text-paper-400">
                            Sign above the line
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={clearPad}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-subtitle text-xs font-bold text-paper-500 hover:bg-paper-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-paper-500/15"
                        >
                            <IconEraser size={15} aria-hidden="true" />
                            Clear
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg px-4 py-2 font-subtitle text-sm font-semibold text-paper-600 hover:bg-paper-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-paper-500/15"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirm}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 font-subtitle text-sm font-bold text-white shadow-sm hover:bg-primary-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/25"
                            >
                                <IconCheck size={16} aria-hidden="true" />
                                Use this signature
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
