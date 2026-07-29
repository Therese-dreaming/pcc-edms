# Layout

Every screen shares one shell: a topbar, a fixed-width sidebar, and a scrollable main content area. As React components, these are plain layout pieces — wire them into whatever renders this project's pages (Inertia page components, a client-side router, etc.); the shell itself doesn't care how routing works.

## Shell structure

```jsx
function AppShell({ children }) {
  return (
    <div className="grid h-screen grid-cols-[272px_1fr] grid-rows-[64px_1fr] overflow-hidden">
      <Topbar className="col-span-2" />
      <Sidebar />
      <main className="overflow-y-auto p-8">{children}</main>
    </div>
  );
}
```

Only `<main>` scrolls. The topbar and sidebar are pinned; `overflow-hidden` on the outer grid is what guarantees the sidebar can't sprout its own scrollbar even if something inside it briefly overflows.

## Topbar

- Height ~64px, `bg-surface-primary`, `border-b border-border`, horizontal padding `px-6`.
- Left cluster: menu/hamburger icon button, a small rounded-square logo mark (`rounded-lg bg-primary`, white monogram/icon), wordmark in `text-fg-primary font-bold`.
- Center: `<SearchInput />` (from `references/components.md`) — let it grow to fill available space (`flex-1`) rather than fixing a width.
- Right cluster: notification bell icon button, then `<Avatar initials="EV" />`, then a plain-text sign-out link in `text-fg-secondary`.
- **Do not include a theme/light-dark toggle icon** — the reference screenshots have one, but this project is light-mode only, so it's dead weight that also implies a dark theme exists.

```jsx
function Topbar({ className = '' }) {
  return (
    <header className={`flex items-center gap-4 border-b border-border bg-surface-primary px-6 ${className}`}>
      <button aria-label="Menu"><MenuIcon className="h-5 w-5 text-fg-secondary" /></button>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">E</span>
        <span className="font-bold text-fg-primary">Workspace</span>
      </div>
      <div className="flex-1 max-w-md"><SearchInput placeholder="Search…" /></div>
      <div className="ml-auto flex items-center gap-4">
        <button aria-label="Notifications"><BellIcon className="h-5 w-5 text-fg-secondary" /></button>
        <Avatar initials="EV" />
        <a href="/logout" className="text-sm text-fg-secondary">Sign out</a>
      </div>
    </header>
  );
}
```

## Sidebar — the no-scroll constraint

The sidebar is a fixed-height column (full viewport height minus the topbar) with `overflow-hidden`. That's a real constraint, not a suggestion to relax once content grows — treat it the way you'd treat a fixed print page: budget what goes in rather than letting it overflow and reaching for a scrollbar as the fix.

```jsx
function Sidebar() {
  return (
    <nav className="flex flex-col overflow-hidden border-r border-border bg-surface-primary p-4">
      <div className="flex flex-col gap-1">
        {/* NavItem list — 5–8 items is typical and rarely threatens the budget */}
      </div>
      <hr className="my-4 border-border" />
      <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-fg-tertiary">
        Active contacts
      </p>
      <div className="mt-2 flex flex-col gap-1 overflow-hidden">
        {/* capped contact list — see note below */}
      </div>
    </nav>
  );
}
```

Structure, top to bottom:

1. **Primary nav** — one row per top-level section (Overview, Analytics, Orders, Catalog, Customers, Reports, etc.). This list is usually short and is the section least likely to threaten the budget.
2. **A divider** (`border-border`, `my-4`).
3. **A secondary list** (e.g. "Active contacts") — this is the section that actually breaks the no-scroll rule if left unbounded, since it's naturally an unbounded list of records. Cap it explicitly in the data layer: pick a fixed max count (4–6 rows is typical at common viewport heights) — `contacts.slice(0, 5)` — and, if the underlying data can exceed that, render a "See all" link as the final row instead of letting the list keep growing.

Practical ways to stay inside the budget as content changes:
- Prefer tighter spacing inside the sidebar specifically (`px-4 py-2.5` on nav rows, not the roomier padding a card gets) — sidebar density can reasonably differ from the main content area's.
- `truncate` long nav labels rather than letting them wrap to a second line, which silently eats vertical budget row by row.
- If the sidebar must support small laptop viewports (e.g. ~700px tall), test the budget at that height specifically, not just at a large monitor's height — this is where a "fine on my screen" layout quietly grows a scrollbar for the user.
- Never add `overflow-y-auto` to the sidebar or any of its inner sections as a quick fix for overflow — that's the exact default this project has opted out of. If content genuinely doesn't fit, cut content (shorter list, collapsed sections, a "see all" link out to a full page) rather than adding a scrollbar.

## Main content

- Padding `p-8` (32px) on desktop.
- Page header row: small eyebrow label above a bold `text-h1`-style title, with action controls (date-range pill, secondary button, primary button) right-aligned on the same row.
- Stat cards sit in a responsive grid (`grid grid-cols-2 xl:grid-cols-4 gap-5`, collapsing to `grid-cols-1` on narrow widths).
- Wider content blocks (a chart card, a data table) are full-width cards below the stat grid.