import { useEffect, useRef } from 'react';
import SignaturePadLib from 'signature_pad';

// docs/architecture.md ADR-005 — the drawn-signature half of the hybrid e-signature approach.
// The typed full name + timestamp remains the legally-operative record (ADR-005's own reasoning:
// RA 8792 doesn't require a biometric/drawn signature); this canvas capture is the "visual/UX
// familiarity" layer on top of that, rendered onto the PDF alongside the typed name.
//
// `onChange` fires with a base64 PNG data URL once the pad has at least one stroke, and with
// `null` again if the user clears it — the parent form submits whatever value it last received.
export default function SignaturePad({ onChange, className = '' }) {
    const canvasRef = useRef(null);
    const padRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        // Canvas backing size must match its displayed size for crisp strokes — CSS alone
        // stretches the bitmap.
        const resize = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
            padRef.current?.clear();
        };

        padRef.current = new SignaturePadLib(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
        padRef.current.addEventListener('endStroke', () => {
            onChange(padRef.current.isEmpty() ? null : padRef.current.toDataURL('image/png'));
        });

        resize();
        window.addEventListener('resize', resize);

        return () => window.removeEventListener('resize', resize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clear = () => {
        padRef.current?.clear();
        onChange(null);
    };

    return (
        <div className={className}>
            <canvas
                ref={canvasRef}
                className="h-32 w-full rounded-md border border-gray-300 bg-white"
            />
            <button
                type="button"
                onClick={clear}
                className="mt-1 text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
                Clear signature
            </button>
        </div>
    );
}
