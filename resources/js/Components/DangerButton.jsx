export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-danger-text active:bg-danger-text disabled:pointer-events-none disabled:opacity-50 ${
                    disabled ? 'cursor-not-allowed' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
