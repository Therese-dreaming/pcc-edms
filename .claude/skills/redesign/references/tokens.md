# Full Token Scale

Use this file when scaffolding a project's `:root` CSS variables or Tailwind theme from scratch, or when you need a spacing/radius/shadow/type value that isn't repeated in the main SKILL.md.

## Spacing (4px base unit)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

Usage guide:
- Card padding: `--space-5` to `--space-6` (20–24px).
- Gap between cards in a grid: `--space-4` to `--space-5` (16–20px).
- Page/content padding (desktop): `--space-8` (32px).
- Nav item padding: `--space-3` vertical, `--space-4` horizontal (12px / 16px) — kept tight deliberately, since generous nav padding is the fastest way to blow the sidebar's no-scroll budget.
- Table cell vertical padding: `--space-4` (16px), giving each row roughly 56–64px of height once an avatar is present.

## Radius scale

```css
--radius-sm: 8px;    /* small chips, status dots' bounding box, tiny icon tiles */
--radius-md: 10px;   /* nav items, table-row hover fill */
--radius-lg: 16px;   /* standard cards, smaller panels */
--radius-xl: 20px;   /* feature/hero cards — the large stat and chart cards */
--radius-full: 9999px; /* every pill: buttons, search/input, badges, toggles, avatars */
```

Rule of thumb: if it's a container someone reads content inside of, it's `lg`/`xl`. If it's a single-line control someone clicks/types into, it's `full`.

## Shadow scale

Only two elevation levels exist on purpose — introducing a third makes it too easy to reach for something heavier than the system intends.

```css
--shadow-resting: 0 1px 2px rgba(20, 20, 20, 0.04), 0 6px 16px rgba(20, 20, 20, 0.04);
--shadow-hover:   0 2px 4px rgba(20, 20, 20, 0.05), 0 12px 28px rgba(20, 20, 20, 0.07);
```

Every card pairs `--shadow-resting` with a 1px `--border-default` outline — the shadow alone reads as too faint on a white-on-white-canvas layout, and the border alone reads flat. Use `--shadow-hover` only on genuinely interactive/clickable cards, and only on `:hover`/`:focus-visible`, not as a static state.

## Typography

Font stack (put this on `body`, not scattered per-component):

```css
--font-sans: 'Inter', 'Inter Fallback', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

If the project uses `next/font/google`, generate the fallback automatically:

```ts
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
// next/font names the generated metrics-matched fallback "Inter Fallback" automatically
```

Otherwise, self-host Inter and declare `'Inter Fallback'` as a manually adjusted local fallback (`local('Arial')` with `size-adjust`/`ascent-override` tuned to Inter's metrics) so text doesn't jump when the webfont loads.

Type scale:

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--text-eyebrow` | 11px / 16px, +0.06em tracking, uppercase | 600 | Section labels like a card's category label, breadcrumb-style overline above a page title |
| `--text-stat` | 30px / 36px | 700 | Big numbers in stat cards, headline metric in a chart card |
| `--text-h1` | 26–28px / 34px | 700 | Page title |
| `--text-h2` | 16px / 22px | 600 | Card title, section heading |
| `--text-body` | 14px / 20px | 400–500 | Table cells, nav labels, form inputs, general body copy |
| `--text-small` | 13px / 18px | 400 | Helper/muted text under a stat, table sub-line (e.g. email under a name) |

All colors for these come from the `fg-*` tokens in the main SKILL.md — headings and numbers use `fg-primary`, body text `fg-secondary`, eyebrow/helper text `fg-tertiary`.

## Tailwind config

This project styles with Tailwind, so every token above should be reachable as a utility class rather than reached for as a raw CSS variable in `style={{}}` props. Put the CSS variables in the project's global stylesheet (`resources/css/app.css` in a standard Laravel + Vite setup) under `:root`, then extend Tailwind's theme to point at them:

```js
// tailwind.config.js (v3-style; adapt to v4's CSS-based @theme syntax if this project is on v4)
module.exports = {
  content: [
    './resources/**/*.blade.php',
    './resources/js/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: 'var(--neutral-primary-soft)',
          secondary: 'var(--neutral-secondary-soft)',
          tertiary: 'var(--neutral-tertiary-soft)',
          'tertiary-medium': 'var(--neutral-tertiary-medium)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          medium: 'var(--border-default-medium)',
        },
        fg: {
          primary: 'var(--fg-primary)',
          secondary: 'var(--fg-secondary)',
          tertiary: 'var(--fg-tertiary)',
          'primary-strong': 'var(--fg-primary-strong)',
          'success-strong': 'var(--fg-success-strong)',
          'danger-strong': 'var(--fg-danger-strong)',
          'warning-strong': 'var(--fg-warning-strong)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          strong: 'var(--primary-strong)',
          soft: 'var(--primary-soft)',
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
      },
      borderRadius: {
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        resting: 'var(--shadow-resting)',
        hover: 'var(--shadow-hover)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
    },
  },
};
```

This gives components classes like `bg-surface-secondary`, `text-fg-primary`, `border-border`, `bg-primary`, `rounded-xl`, `shadow-resting` — see `references/components.md` for these in context. Keep the `content` globs pointing at wherever this project's Blade views and React source actually live; adjust the paths above if the structure differs (e.g. a `resources/js/Pages` + `resources/js/Components` split, common with Inertia).

Critically: override Tailwind's default `ring`/`focus` blue (`ring-blue-500`, `focus:ring-blue-*`, `focus:border-blue-*`) wherever it appears — this is the single most common way a leftover blue accent survives a "we changed the primary color" pass, because it's a framework default rather than something explicitly typed as `blue-600` in the codebase. Search for it explicitly rather than assuming a find-and-replace of `--primary` catches it.