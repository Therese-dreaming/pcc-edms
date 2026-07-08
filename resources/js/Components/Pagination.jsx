import { Link } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

function pageLabel(label) {
    return String(label).replace('&laquo;', '').replace('&raquo;', '').trim();
}

function PagerLink({
    href,
    active = false,
    disabled = false,
    variant = 'page',
    children,
    ariaLabel,
}) {
    const base =
        'group inline-flex min-h-9 items-center justify-center rounded-lg text-[0.8125rem] font-medium tabular-nums tracking-tight transition-colors duration-150 ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

    const variants = {
        page: active
            ? 'min-w-9 px-2.5 bg-primary-700 text-white shadow-sm'
            : 'min-w-9 px-2.5 text-stone-500 hover:bg-white hover:text-primary-700 hover:shadow-sm',
        nav: 'gap-1 border border-stone-200 px-2.5 text-stone-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700',
    };

    const classes = [
        base,
        variants[variant],
        disabled ? 'pointer-events-none opacity-30' : '',
    ].join(' ');

    return (
        <Link
            href={href || '#'}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            className={classes}
        >
            {children}
        </Link>
    );
}

// Expects Laravel paginator shape: { data, links, from, to, total }
export default function Pagination({ paginator }) {
    if (!paginator?.links || paginator.links.length <= 3) return null;

    const { links, from, to, total } = paginator;
    const prev = links[0];
    const next = links[links.length - 1];
    const pages = links.slice(1, -1);
    const currentLabel = pageLabel(pages.find((link) => link.active)?.label || 1);

    return (
        <div className="mt-6 flex flex-col gap-4 border-t border-stone-200/80 pt-4 font-grotesk sm:flex-row sm:items-center sm:justify-between">
            {typeof total === 'number' && (
                <p className="text-[0.8125rem] leading-none text-stone-400">
                    Showing{' '}
                    <span className="font-semibold tabular-nums text-stone-900">
                        {from || 0}
                    </span>
                    <span className="mx-1 text-stone-300">&ndash;</span>
                    <span className="font-semibold tabular-nums text-stone-900">
                        {to || 0}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold tabular-nums text-stone-700">
                        {total.toLocaleString()}
                    </span>
                </p>
            )}

            <nav
                className="flex items-center justify-between gap-2 sm:justify-end"
                aria-label="Pagination"
            >
                <PagerLink
                    href={prev.url}
                    disabled={!prev.url}
                    variant="nav"
                    ariaLabel="Previous page"
                >
                    <IconChevronLeft size={16} strokeWidth={2.5} />
                    <span className="sr-only">Previous</span>
                </PagerLink>

                <div className="hidden items-center gap-0.5 rounded-xl bg-stone-100/70 p-1 sm:flex">
                    {pages.map((link, index) =>
                        link.url === null ? (
                            <span
                                key={`${link.label}-${index}`}
                                className="inline-flex min-h-9 min-w-7 items-center justify-center text-[0.8125rem] font-medium text-stone-300"
                                aria-hidden="true"
                            >
                                &hellip;
                            </span>
                        ) : (
                            <PagerLink
                                key={`${link.label}-${index}`}
                                href={link.url}
                                active={link.active}
                                ariaLabel={`Page ${pageLabel(link.label)}`}
                            >
                                {pageLabel(link.label)}
                            </PagerLink>
                        ),
                    )}
                </div>

                <div className="text-[0.8125rem] font-medium tabular-nums text-stone-400 sm:hidden">
                    Page{' '}
                    <span className="font-semibold text-stone-900">
                        {currentLabel}
                    </span>
                </div>

                <PagerLink
                    href={next.url}
                    disabled={!next.url}
                    variant="nav"
                    ariaLabel="Next page"
                >
                    <span className="sr-only">Next</span>
                    <IconChevronRight size={16} strokeWidth={2.5} />
                </PagerLink>
            </nav>
        </div>
    );
}