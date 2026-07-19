import { Link } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

function pageLabel(label) {
    return String(label).replace('&laquo;', '').replace('&raquo;', '').trim();
}

function PagerLink({ href, active = false, disabled = false, variant = 'page', children, ariaLabel }) {
    const base =
        'group inline-flex min-h-10 items-center justify-center rounded-lg font-subtitle text-xs font-bold tabular-nums ' +
        'transition-[color,background-color,border-color,box-shadow,transform] duration-150 ' +
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700/15';

    const variants = {
        page: active
            ? 'min-w-10 bg-primary-800 px-3 text-white shadow-md shadow-primary-900/15'
            : 'min-w-10 px-3 text-paper-500 hover:bg-white hover:text-primary-800 hover:shadow-sm',
        nav: 'gap-1.5 border border-paper-200 bg-white px-3 text-paper-600 shadow-sm hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800',
    };

    return (
        <Link
            href={href || '#'}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            className={`${base} ${variants[variant]} ${disabled ? 'pointer-events-none opacity-35 shadow-none' : ''}`}
        >
            {children}
        </Link>
    );
}

// Expects Laravel paginator shape: { data, links, from, to, total }
export default function Pagination({ paginator, className = '' }) {
    if (!paginator?.links || paginator.links.length <= 3) return null;

    const { links, from, to, total } = paginator;
    const prev = links[0];
    const next = links.at(-1);
    const pages = links.slice(1, -1);
    const currentLabel = pageLabel(pages.find((link) => link.active)?.label || 1);

    return (
        <div className={`mt-5 flex flex-col gap-4 border-t border-paper-200 pt-4 font-subtitle sm:flex-row sm:items-center sm:justify-between ${className}`}>
            {typeof total === 'number' && (
                <p className="text-xs text-paper-500">
                    Showing <strong className="font-bold tabular-nums text-paper-900">{from || 0}</strong>
                    <span className="mx-1.5 text-paper-300">to</span>
                    <strong className="font-bold tabular-nums text-paper-900">{to || 0}</strong>
                    <span className="mx-1.5">of</span>
                    <strong className="font-bold tabular-nums text-paper-700">{total.toLocaleString()}</strong>
                    <span className="ml-1">records</span>
                </p>
            )}

            <nav className="flex items-center justify-between gap-2 sm:justify-end" aria-label="Pagination">
                <PagerLink href={prev.url} disabled={!prev.url} variant="nav" ariaLabel="Previous page">
                    <IconChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
                    <span className="sm:sr-only">Previous</span>
                </PagerLink>

                <div className="hidden items-center gap-1 rounded-xl bg-paper-100 p-1 sm:flex">
                    {pages.map((link, index) =>
                        link.url === null ? (
                            <span key={`${link.label}-${index}`} className="inline-flex min-h-10 min-w-8 items-center justify-center text-xs font-bold text-paper-300" aria-hidden="true">
                                â€¦
                            </span>
                        ) : (
                            <PagerLink key={`${link.label}-${index}`} href={link.url} active={link.active} ariaLabel={`Page ${pageLabel(link.label)}`}>
                                {pageLabel(link.label)}
                            </PagerLink>
                        ),
                    )}
                </div>

                <div className="font-subtitle text-xs font-semibold tabular-nums text-paper-500 sm:hidden">
                    Page <strong className="text-paper-900">{currentLabel}</strong>
                </div>

                <PagerLink href={next.url} disabled={!next.url} variant="nav" ariaLabel="Next page">
                    <span className="sm:sr-only">Next</span>
                    <IconChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </PagerLink>
            </nav>
        </div>
    );
}