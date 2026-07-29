import { Link } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

// Pagination — redesign system (.claude/skills/redesign): pill controls, neutral surfaces,
// dark-red accent reserved for the active page and hover. The active page is the one place the
// primary red fill is used here (it reads as a selected control, matching the count-badge rule).

function pageLabel(label) {
    return String(label).replace('&laquo;', '').replace('&raquo;', '').trim();
}

function PagerLink({ href, active = false, disabled = false, variant = 'page', children, ariaLabel }) {
    const base =
        'group inline-flex min-h-9 items-center justify-center rounded-full text-xs font-semibold tabular-nums ' +
        'transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-primary-soft';

    const variants = {
        page: active
            ? 'min-w-9 bg-primary px-3 text-white'
            : 'min-w-9 px-3 text-fg-secondary hover:bg-surface-tertiary hover:text-primary',
        nav: 'gap-1.5 border border-border bg-surface-primary px-3.5 text-fg-secondary hover:border-primary hover:bg-surface-tertiary hover:text-primary',
    };

    return (
        <Link
            href={href || '#'}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            className={`${base} ${variants[variant]} ${disabled ? 'pointer-events-none opacity-40' : ''}`}
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
        <div className={`mt-5 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
            {typeof total === 'number' && (
                <p className="text-xs text-fg-tertiary">
                    Showing <strong className="font-semibold tabular-nums text-fg-primary">{from || 0}</strong>
                    <span className="mx-1.5 text-border-medium">–</span>
                    <strong className="font-semibold tabular-nums text-fg-primary">{to || 0}</strong>
                    <span className="mx-1.5">of</span>
                    <strong className="font-semibold tabular-nums text-fg-secondary">{total.toLocaleString()}</strong>
                    <span className="ml-1">records</span>
                </p>
            )}

            <nav className="flex items-center justify-between gap-2 sm:justify-end" aria-label="Pagination">
                <PagerLink href={prev.url} disabled={!prev.url} variant="nav" ariaLabel="Previous page">
                    <IconChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span className="sm:sr-only">Previous</span>
                </PagerLink>

                <div className="hidden items-center gap-1 rounded-full border border-border bg-surface-tertiary p-1 sm:flex">
                    {pages.map((link, index) =>
                        link.url === null ? (
                            <span key={`${link.label}-${index}`} className="inline-flex min-h-9 min-w-8 items-center justify-center text-xs font-semibold text-fg-tertiary" aria-hidden="true">
                                …
                            </span>
                        ) : (
                            <PagerLink key={`${link.label}-${index}`} href={link.url} active={link.active} ariaLabel={`Page ${pageLabel(link.label)}`}>
                                {pageLabel(link.label)}
                            </PagerLink>
                        ),
                    )}
                </div>

                <div className="text-xs font-medium tabular-nums text-fg-tertiary sm:hidden">
                    Page <strong className="text-fg-primary">{currentLabel}</strong>
                </div>

                <PagerLink href={next.url} disabled={!next.url} variant="nav" ariaLabel="Next page">
                    <span className="sm:sr-only">Next</span>
                    <IconChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
                </PagerLink>
            </nav>
        </div>
    );
}
