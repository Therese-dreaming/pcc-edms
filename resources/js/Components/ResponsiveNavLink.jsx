import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800'
            } text-base font-medium transition-colors duration-150 ease-in-out ${className}`}
        >
            {children}
        </Link>
    );
}
