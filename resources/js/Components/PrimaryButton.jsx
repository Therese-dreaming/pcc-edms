export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-primary-strong active:bg-primary-strong disabled:pointer-events-none disabled:opacity-50 ${
                    disabled ? 'cursor-not-allowed' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
