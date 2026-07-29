# Component Patterns

React components using Tailwind utility classes (mapped to the CSS variables via the `tailwind.config.js` extension in `references/tokens.md`). Treat any text inside (`"Metric label"`, `"Contact Name"`, numbers) as placeholder structure, not content to copy verbatim from anywhere. These are plain functional components with no assumptions about state management — wire props/data however this project already does it.

## Stat card

```jsx
function StatCard({ label, value, helper, trend, trendDirection = 'up', Sparkline }) {
  const trendStyles = trendDirection === 'up'
    ? 'bg-success-soft text-fg-success-strong'
    : 'bg-danger-soft text-fg-danger-strong';

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-6 shadow-resting">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[13px] text-fg-tertiary">
          {label}
          <InfoIcon className="h-3.5 w-3.5" />
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${trendStyles}`}>
          {trendDirection === 'up' ? '↑' : '↓'} {trend}
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold text-fg-primary">{value}</div>
      <div className="mt-1 text-[13px] text-fg-tertiary">{helper}</div>
      {Sparkline && <div className="mt-3">{Sparkline}</div>}
    </div>
  );
}
```

The sparkline stroke and its faint area-fill both use `danger`/`danger-soft` when `trendDirection="down"` and `success`/`success-soft` when `"up"` — never `primary`, since that would blur the "is this good or bad" signal the color is meant to carry.

## Buttons

```jsx
function Button({ variant = 'primary', icon: Icon, children, ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-semibold';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-strong',
    secondary: 'border border-border-medium bg-surface-secondary text-fg-secondary hover:bg-surface-tertiary',
  };
  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
```

Use `variant="primary"` for exactly one action per view-region (e.g. one "New report" or "Add item" per page header) — everything else (Export, Actions, Filters, Table settings) is `secondary`. If a screen has more than one primary button fighting for attention, that's a sign one should be downgraded.

## Pill input / search bar

```jsx
function SearchInput({ placeholder = 'Search…', ...props }) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-tertiary" />
      <input
        className="w-full rounded-full border border-border bg-surface-secondary py-2.5 pl-10 pr-4 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary-soft"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
```

## Nav item

```jsx
function NavItem({ icon: Icon, label, active, count, href = '#' }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 rounded-md px-4 py-2.5 text-sm ${
        active
          ? 'bg-surface-tertiary font-semibold text-fg-primary'   // neutral fill, NOT primary
          : 'font-medium text-fg-secondary hover:bg-surface-tertiary'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
      {count != null && (
        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </a>
  );
}
```

Worth restating from the main file: the active nav row is a **neutral** fill with bold dark text, not a red fill. Red is reserved for the count badge, buttons, links, and toggles — keeping the active-nav indicator neutral is what makes the red accent still feel special/intentional everywhere else it does appear.

## Role pill & status dot

```jsx
function RolePill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-medium px-2.5 py-1 text-xs text-fg-secondary">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

const statusDotColor = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  neutral: 'bg-border-medium',
};

function StatusDot({ tone = 'neutral', children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-secondary">
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor[tone]}`} />
      {children}
    </span>
  );
}
```

## Toggle switch

```jsx
function Toggle({ on, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-surface-tertiary-medium'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-4.5' : 'left-0.5'}`}
      />
    </button>
  );
}
```

## Table row

```jsx
function PersonCell({ avatarInitials, name, email }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar initials={avatarInitials} />
      <div>
        <div className="text-sm font-medium text-fg-primary">{name}</div>
        <div className="text-[13px] text-fg-tertiary">{email}</div>
      </div>
    </div>
  );
}
```

```jsx
<tr className="border-b border-border">
  <td className="p-4"><PersonCell avatarInitials="JT" name="Contact Name" email="name@example.com" /></td>
  <td className="p-4"><RolePill>Editor</RolePill></td>
  <td className="p-4"><StatusDot tone="warning">Away</StatusDot></td>
</tr>
```

Row dividers are horizontal only — no vertical column rules, and no alternating row-stripe background beyond the default white/`surface-secondary`.

## Avatar

```jsx
function Avatar({ initials }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
      {initials}
    </span>
  );
}
```

Every avatar across the app — sidebar contacts, the topbar user avatar, table row avatars — uses this same solid `primary` fill with white initials. The reference layout uses one consistent accent color per avatar rather than a rotating palette per person; keep that restraint rather than introducing a multi-color avatar system.

## Chart / trend line

- Line stroke: `var(--primary)`, 2px — if using Recharts/Chart.js/similar, pull the color from the CSS variable at render time (e.g. `getComputedStyle(document.documentElement).getPropertyValue('--primary')`) rather than hardcoding a hex in the chart config, so it stays in sync with the token if it's ever adjusted.
- Area fill under the line: gradient from `var(--primary-soft)` (top, ~100% opacity) to transparent (bottom) — the one gradient this system allows.
- A secondary/forecast series (if present): dashed line, `var(--fg-tertiary)`, no area fill.
- Axis labels: `fg-tertiary`, 12px.
- A "View full report →" style link below the chart:

```jsx
function TextLink({ href, children }) {
  return (
    <a href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-fg-primary-strong hover:underline">
      {children}
      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
```