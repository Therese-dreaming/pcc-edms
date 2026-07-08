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
                `inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-150 ease-in-out hover:bg-primary-700 active:bg-primary-800 disabled:pointer-events-none disabled:opacity-50 ${
                    disabled ? 'cursor-not-allowed' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
