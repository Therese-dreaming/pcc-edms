import { useEffect, useRef, useState } from 'react';
import { IconEraser, IconSignature } from '@tabler/icons-react';
import SignaturePadLib from 'signature_pad';

export default function SignaturePad({ onChange, className = '', disabled = false }) {
    const canvasRef = useRef(null);
    const padRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const pad = new SignaturePadLib(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(74, 19, 33)',
            minWidth: 0.8,
            maxWidth: 2.2,
            throttle: 12,
        });
        padRef.current = pad;

        const resize = () => {
            const saved = pad.isEmpty() ? null : pad.toData();
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
            pad.clear();
            if (saved) pad.fromData(saved);
        };

        const commit = () => {
            const empty = pad.isEmpty();
            setHasSignature(!empty);
            onChangeRef.current?.(empty ? null : pad.toDataURL('image/png'));
        };

        pad.addEventListener('endStroke', commit);
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();

        return () => {
            observer.disconnect();
            pad.removeEventListener('endStroke', commit);
            pad.off();
        };
    }, []);

    useEffect(() => {
        if (padRef.current) padRef.current.off();
        if (!disabled && padRef.current) padRef.current.on();
    }, [disabled]);

    const clear = () => {
        padRef.current?.clear();
        setHasSignature(false);
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

            <div className={`relative overflow-hidden rounded-xl border bg-white ${disabled ? 'border-paper-200 opacity-60' : hasSignature ? 'border-primary-300' : 'border-paper-200 hover:border-paper-300'}`}>
                <canvas
                    ref={canvasRef}
                    className="block h-40 w-full touch-none bg-white"
                    aria-label="Draw your signature"
                />
                <div className="pointer-events-none absolute inset-x-5 bottom-5 border-t border-paper-200 pt-2 font-subtitle text-[0.6875rem] text-paper-400">
                    Sign above the line
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4">
                <p className="font-subtitle text-xs leading-relaxed text-paper-500">
                    Your typed full name and timestamp remain the operative record.
                </p>
                <button
                    type="button"
                    onClick={clear}
                    disabled={!hasSignature || disabled}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 font-subtitle text-xs font-bold text-primary-700 hover:bg-primary-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/15 disabled:cursor-not-allowed disabled:opacity-35"
                >
                    <IconEraser size={15} aria-hidden="true" />
                    Clear
                </button>
            </div>
        </div>
    );
}