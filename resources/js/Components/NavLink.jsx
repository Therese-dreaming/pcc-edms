import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition-colors duration-150 ease-in-out ' +
                (active
                    ? 'border-primary-600 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700') +
                className
            }
        >
            {children}
        </Link>
    );
}
