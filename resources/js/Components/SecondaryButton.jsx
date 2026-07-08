export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-700 transition-colors duration-150 ease-in-out hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 ${
                    disabled ? 'cursor-not-allowed' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
