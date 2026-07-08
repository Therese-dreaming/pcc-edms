// Official PCC seal (public/images/logo-small.png) + wordmark. Sized in `em`
// off the wrapper's font-size, so callers control scale with a `text-*`
// utility (e.g. `text-2xl`) rather than a fixed height.
export default function ApplicationLogo({ className = '' }) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <img
                src="/images/logo-small.png"
                alt="Pasig Catholic College seal"
                className="h-[1.8em] w-[1.8em] shrink-0 object-contain"
            />
            <span className="font-sans text-[0.85em] font-semibold tracking-wide text-zinc-800">
                EDMS
            </span>
        </span>
    );
}
