---
name: dashboard-dark-red-design
description: Design system and component rules for restyling this Laravel + React (Tailwind CSS) dashboard/admin project into a light-mode, dark-red-accented interface — pill buttons and inputs, 20px rounded cards with soft layered shadows, a fixed no-scroll sidebar, and Inter typography. Use this any time you're building, styling, or reviewing ANY UI here — React components/pages, dashboards, stat/metric cards, sidebars and nav, tables and item lists, badges, toggles, buttons, search bars, charts/legends, avatars, empty/loading states — even if the request doesn't mention design (e.g. "add a stat card component", "build the items table", "make the sidebar nav"). Also trigger whenever choosing accent colors, writing Tailwind config or CSS variables for this project, or reviewing existing code for a leftover blue accent, a scrollable sidebar, gradients, or heavy shadows — the brand accent here is dark red/crimson, never blue.
---

# Dashboard Dark-Red Design System

## Stack

Laravel backend, React frontend, Tailwind CSS for styling. All component examples in this skill are React (JSX) using Tailwind utility classes that map onto the CSS variables below via a `tailwind.config.js` theme extension — see `references/tokens.md` for the exact config. Define the CSS variables once, globally (typically `resources/css/app.css` in a standard Laravel + Vite setup — adjust if this project's entry CSS file lives elsewhere).

## Why this skill exists

The reference layout for this project is a bright, tactile "essential" style dashboard: neutral light-gray surfaces, dark readable text, pill-shaped controls, generously rounded cards, and soft layered shadows — but built around **one vivid blue accent**. This project keeps that whole structure (it's a good, calm, well-organized layout) and swaps the single accent hue: **dark red / crimson replaces blue everywhere** — CTAs, active states, the brand mark, chart lines, focus rings, toggle-on states. Nothing else about the visual language changes.

Two structural rules layered on top of the reference:
1. **Light mode only.** No dark theme, no theme toggle in the UI, no `prefers-color-scheme` branching.
2. **The sidebar never scrolls.** Its height is fixed to the viewport; content is budgeted to fit rather than overflowing into a scrollbar.

Treat the tokens and patterns below as load-bearing. If a new component doesn't map cleanly onto something described here, extend the existing scale (reuse the same red ramp, the same border/shadow pair, the same radius steps) rather than inventing a new one-off value — visual consistency across screens matters more than any single component looking "nicer" in isolation.

## The 8 hard rules

1. **Dark red is the only accent**, full stop — not one option among several. Every place blue would show up in a default template (primary buttons, active nav badges, links, focus rings, chart lines, toggle-on state, the logo mark, selected states) uses the primary red token instead.
2. **No dark mode.** Don't add a theme toggle, don't write dark-variant classes/media queries, don't ship a `dark:` palette.
3. **The sidebar has no scrollbar, ever.** Its container is viewport-height with `overflow: hidden` (or equivalent) by design — see `references/layout.md` for how to budget its contents so this holds even as nav sections or contact lists grow.
4. **Controls are pills, cards are rounded rectangles.** Buttons, inputs, search bars, date pickers, badges, and toggles are fully rounded (`radius-full`). Cards use the large radius step (`radius-lg`/`radius-xl`), never full-pill.
5. **Elevation is a 1px border plus a soft, low-opacity shadow** — never a heavy `shadow-xl`-style glow, never a colored glow ring, never `backdrop-filter` glass effects.
6. **No gradients on fills.** Buttons, badges, and backgrounds are flat solid colors. The one exception is the soft area-fill under a line chart, which fades from a light tint of the line's color to transparent — that's a chart convention, not a UI-chrome gradient.
7. **Status color and brand color are different jobs.** Success/warning/danger pills communicate state; the red primary communicates brand/action. Don't recolor a status pill red just because red is the brand color, and don't let a status hue leak into buttons/nav.
8. **Inter, always.** `font-family: 'Inter', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif;` on every text element — no serif, no secondary display font.

Walk any finished screen against these 8 before calling it done — see the checklist at the end of this file.

## Color tokens

Below is the full set — the surface, border, and status tokens are exactly what was specified for this project; the `fg-*` neutral text tokens and the entire `primary-*` red ramp are proposed additions to fill gaps the spec didn't cover (there's no primary hex or body-text-color spec to work from). Adjust the red ramp freely — the only hard requirement is that it reads as **dark red/crimson**, not the bright rose the danger token already uses (they need to stay visually distinct from each other).

```css
:root {
  /* Surfaces & lines — given */
  --neutral-primary-soft: #ffffff;      /* page canvas */
  --neutral-secondary-soft: #ffffff;    /* card / panel surface */
  --neutral-tertiary-soft: #f7f7f7;     /* subtle fill: hovers, table stripe, app bg behind cards */
  --neutral-tertiary-medium: #e0e0e0;   /* stronger neutral fill: disabled bg, toggle-off track */
  --border-default: #e0e0e0;            /* card borders, dividers */
  --border-default-medium: #d0d0d0;     /* input outlines, table header rule, stronger dividers */

  /* Text neutrals — proposed, not given; tune contrast to taste */
  --fg-primary: #171717;                /* headings, big stat numbers, primary body text */
  --fg-secondary: #52525b;              /* default body/label text */
  --fg-tertiary: #8a8a8e;               /* muted/help text, eyebrow labels, placeholders */

  /* Brand — dark red, proposed ramp (replaces blue) */
  --primary: #7a1f2b;                   /* solid buttons, active toggle, logo mark, chart line */
  --primary-strong: #5c1620;            /* hover/pressed state of --primary */
  --primary-soft: #fbebec;              /* tint bg: soft badges, row hover, chart gradient base */
  --fg-primary-strong: #5c1620;         /* text-safe red for links, active-icon color */

  /* Status hues — given */
  --success: #15a34a;
  --success-soft: #ecfdf3;
  --fg-success-strong: #14532d;

  --danger: #be123c;
  --danger-soft: #fff1f2;
  --fg-danger-strong: #771d1d;

  --warning: #f97316;
  --warning-soft: #fffaeb;
  --fg-warning-strong: #7c2d12;         /* proposed — not given, follows the success/danger pattern */
}
```

Full spacing, radius, shadow, and type scale (with rationale for each step) live in `references/tokens.md` — open it before setting up a project's CSS variables or Tailwind config from scratch, or any time you need a value not listed above.

## Layout

Topbar + fixed sidebar + scrollable main content is the shell for every screen. The sidebar's no-scroll constraint is the one genuinely tricky part of this system — read `references/layout.md` before building or editing the sidebar, since "just add `overflow-y: auto`" is exactly the default this project is rejecting.

## Component patterns

Full markup/CSS for each of these — and the exact states (default/hover/active/disabled) — are in `references/components.md`. Read it before building any of the following rather than improvising from generic dashboard-template knowledge:

- **Stat card** — eyebrow label + info icon, trend pill (success/danger soft-bg badge with an up/down arrow), large bold number, muted helper line, small trend-colored sparkline.
- **Buttons** — primary (solid `--primary`), secondary/outline (white + `--border-default-medium`), both full-pill.
- **Pill input / search bar** — full-pill, `--border-default` outline, leading icon, `--fg-tertiary` placeholder.
- **Nav item** — note that the *active* state in the reference is a neutral gray fill with bold dark text, **not** a colored fill — the red accent is deliberately reserved for buttons/links/toggles/badges, not for marking the active nav row.
- **Count badge** (e.g. a sidebar nav badge) — solid `--primary` pill, white text, for numeric counts only.
- **Role/status pill & dot** — outline pill for roles, a small colored dot + label for status (color = the matching status token, never `--primary`).
- **Toggle switch** — on = `--primary` track, off = `--neutral-tertiary-medium` track.
- **Table row** — avatar/name/email stack, `--border-default` row divider only (no vertical rules), icon-based secondary info.
- **Chart** — solid `--primary` line, soft `--primary-soft`-to-transparent area fill, dashed `--fg-tertiary` line for a secondary/forecast series, `--fg-primary-strong` text link below.
- **Avatar** — solid `--primary` circle with white initials (matches the reference's single-accent-color avatar convention).

## Typography

`Inter` with the `Inter Fallback` metric-compatible fallback (from `next/font` or an equivalent local-fallback setup) — see `references/tokens.md` for the full type scale (eyebrow labels through the large stat-card numerals) and font-loading notes.

## Icons

The reference uses a single consistent thin-line icon set (~1.5–1.75px stroke, rounded caps, no fills except for the active/selected variant of an icon). If the project doesn't already have an icon library committed, `lucide-react` is a close match to this style and drops straight into React components (`npm install lucide-react`) — don't mix in a second icon set or use emoji anywhere in the UI.

## Pre-ship checklist

- [ ] Any blue left anywhere — buttons, links, focus rings, chart lines, toggle-on, badges, the logo mark? → swap to the `primary` Tailwind classes. Grep for stray `blue-*`/`indigo-*`/`sky-*` Tailwind utilities (`bg-blue-600`, `focus:ring-blue-500`, `text-indigo-600`, etc.) — these are the most common way blue survives a "we changed the accent" pass, since Tailwind's own defaults (like the focus ring) are blue unless overridden.
- [ ] Any `dark:` classes, theme toggle, or `prefers-color-scheme` handling present? → remove; this project is light-mode only.
- [ ] Does the sidebar have a scrollbar, or `overflow-y: auto/scroll` anywhere in its ancestry? → fix per `references/layout.md`; trim content instead.
- [ ] Any card, button, or badge using a small/medium radius when it should be full-pill (controls) or the large radius (cards)?
- [ ] Any heavy shadow (`shadow-xl`/`shadow-2xl`, colored glow, blurred halo) or `backdrop-filter` glass panel? → flatten to the 1px-border + soft-shadow pair.
- [ ] Any `linear-gradient` on a button, badge, or background fill (chart area fills are the one allowed exception)?
- [ ] Is a status color (success/warning/danger) being used where the brand red belongs, or vice versa?
- [ ] Any font other than Inter/Inter Fallback?
- [ ] Any literal sample content from the reference screenshots (brand name, exact figures, contact names) copied in verbatim rather than treated as placeholder structure?