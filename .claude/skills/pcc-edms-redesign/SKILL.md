---
name: pcc-edms-redesign
description: Redesign a PCC-EDMS page (React/Inertia, resources/js/Pages/**) to the current visual language. Use whenever asked to "redesign", "restyle", or "polish the design of" a page or component in this app.
---

# PCC-EDMS page redesign

**The canonical references are hand-edited by the user, not this document.**
Before redesigning anything, re-read the actual current contents of:

- `resources/js/Pages/Auth/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`,
  `ResetPassword.jsx`, `ConfirmPassword.jsx`, `VerifyEmail.jsx` — the Auth look.
- `resources/js/Pages/Dpreq/Index.jsx` and `Dpreq/Show.jsx` — the interior
  list/detail look.

The user has hand-revised both of these more than once, each time overriding
an "adapt it onto tokens" pass this skill previously tried to make. Don't
re-attempt that normalization — match what's actually in those files, even
where it diverges from `resources/css/app.css`'s documented token system.
If you're unsure whether a file still reflects current taste, ask rather than
assuming the version described below is still accurate.

## The type system — three self-hosted fonts, no more, no less

`tailwind.config.js` + `resources/css/app.css` define exactly three families,
all self-hosted (`public/fonts/`), no Google Fonts CDN `<link>`/`<style>`
import anywhere:

- `font-sans` → **Outfit** — content/body text. This is the default (set on
  `<body>` in `resources/views/app.blade.php`), so most text needs no class.
  (Outfit stands in for Circular, which isn't freely licensable/self-hostable
  — don't try to source actual Circular font files.)
- `font-display` → **Figtree** — titles (page headers, card headings, Auth
  `h1`/`h2`).
- `font-subtitle` → **Lexend** — the sub-title/description line directly
  under a title (`PageHeader`'s `description`, Auth hero taglines, `About`/
  `Verify`'s intro line). Don't use it for long body paragraphs — only the
  short line paired with a title.

There is no mono font. Don't add `font-mono` or a fourth self-hosted face —
if a past version of a page used `@phosphor-icons`-era CDN fonts
(`Space Grotesk`/`Inter`) or an earlier font pass (`Fraunces`/`IBM Plex`,
`Manrope`), that's stale; replace it with the three above instead of
reintroducing it.

## Auth pages — bespoke, self-contained look

Auth pages are intentionally their own design system, separate from the rest
of the app:

- Colors: raw Tailwind `stone-*` for neutrals, `red-900`/`red-800`/`red-950`
  for brand/maroon — not the `paper-*`/`primary-*` tokens used elsewhere.
- Fonts: the same three self-hosted families as everywhere else (see above) —
  Auth no longer has its own separate font stack.
- Icons: `@phosphor-icons/react`, `weight="regular"`/`"duotone"`/`"fill"` —
  not Tabler.
- Gradients, blurred decorative background orbs, `backdrop-blur`,
  `shadow-2xl`, and the animated button "shine sweep" are all fine here —
  this is the one place they're wanted.
- `AuthButton`/`AuthCard` (`resources/js/Components/Auth/`) were an earlier
  attempt to extract shared pieces on the tokenized version; check whether
  the current Auth files still use them before assuming they do — the user's
  rewrites may have replaced them with inline markup again.

## Interior pages (Dashboard, DPREQ/DPNDA/REMIS/Incidents, Admin, Profile,
## Notifications, Reports)

Follow the pattern in `Dpreq/Index.jsx` and `Dpreq/Show.jsx`:

- Colors: `stone-*` for neutrals (not `paper-*`), `primary-*` tokens for
  brand accents (tracking-number chips, active states, icon tiles). Status/
  alert backgrounds use **raw** Tailwind semantic colors matched to context —
  `red-50`/`red-200`/`red-700` for reject/danger actions, `emerald-50`/
  `emerald-200`/`emerald-700` for approve/success, `amber-50`/`amber-200`/
  `amber-700` for warnings, `blue-50`/`blue-200`/`blue-700` for informational
  forward-motion actions (e.g. endorse) — not the `danger`/`success`/
  `warning` semantic tokens from `app.css`.
- No gradients. Flat `shadow-sm` + `border border-stone-200` + `rounded-lg`
  cards are as far as elevation goes.
- Icons: Tabler (`@tabler/icons-react`), `strokeWidth={2}` (2.5 for
  emphasis/buttons).
- Reuse `PageHeader`, `StatusBadge`, and the `Table`/`THead`/`TBody`/`Tr`/
  `Th`/`Td`/`EmptyRow` family (`resources/js/Components/`) — those survived
  the user's rewrite and are still the right building blocks for headers and
  tabular data.
- Card pattern: the user's version hand-rolls
  `bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden`
  rather than using the `Card` component, specifically so it can add a
  tinted header bar: `border-b border-stone-200 bg-stone-50/50 px-6 py-4`
  containing an icon + title (+ optional secondary line/badge on the right).
  Match this hand-rolled structure for new detail-page cards instead of
  forcing it through `Card`'s `title` prop, which can't express the tinted
  bar or right-aligned badge.
- Metadata fields (e.g. "Applicant", "Adviser") render as an icon-tile +
  label/value pair: a `w-10 h-10 rounded-lg bg-stone-100` tile with a Tabler
  icon, next to an uppercase `text-xs tracking-wider text-stone-500` label
  and a `text-base font-medium text-stone-900` value.
- Tracking numbers render as a small pill:
  `inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-50
  border border-primary-200`, with a small brand icon. No monospace font —
  the app has exactly three type families (see below) and none of them is a
  mono; don't reach for `font-mono` (it now just falls back to the browser
  default) or add a fourth self-hosted face.
- Action forms on detail pages get their own tinted panel matching their
  semantic intent (`bg-red-50 border border-red-200 rounded-lg p-5` for a
  reject/return action, `bg-emerald-50 ...` for an approve/pass action,
  `bg-blue-50 ...` for a forward/endorse action, `bg-primary-50 ...` for a
  neutral/resubmit-type action), each with an icon + `h4` heading, the
  relevant fields, and a solid pill button in the matching hue
  (`bg-red-700 hover:bg-red-800`, `bg-emerald-700 hover:bg-emerald-800`, etc).
- History/audit trails render as a timeline: a sticky right-hand column
  (`lg:col-span-1` inside a `lg:grid-cols-3` page grid, `sticky top-6`) with
  connected dots (`w-8 h-8 rounded-full bg-primary-100 border-2
  border-primary-200` containing a smaller solid dot) and a connecting
  vertical line between entries, each entry showing a from→to status chip
  pair, actor, timestamp, and optional quoted comment.
- Index/list pages get a live client-side search input (icon-prefixed,
  filters in-memory — no server round trip) and a status `<select>` filter
  showing per-status counts, both `border-stone-300` styled consistently
  with the rest of the interior palette. Table rows show the tracking number
  as the same pill/chip used on the detail page, and a "Created" column
  formatted via `toLocaleDateString`.

## Workflow for redesigning one page

1. Re-read the current Auth and Dpreq reference files (see top of this
   skill) — don't rely on a cached mental model, the user edits these by
   hand and this doc lags behind.
2. Read the target page; note its layout (`AuthenticatedLayout` vs a bespoke
   Auth shell), existing shared-component usage, and anything that
   contradicts the current reference (leftover `paper-*`, semantic
   `danger`/`success`/`warning` tokens instead of raw colors, a flat `Card`
   where the reference wants a tinted-header hand-rolled card, etc).
3. Apply the matching pattern above. Keep all business logic (form state,
   validation, conditional workflow branches) untouched — only the
   presentation layer changes.
4. Verify in the browser preview (`preview_start` if not already running):
   check layout, that data renders, and that no console errors appeared.
   Log in with a seeded test account if the page requires auth — see
   `database/seeders/UserSeeder.php` (`admin@pcc.test` / `password`, plus
   role-specific accounts). React-controlled inputs may not respond to
   `preview_fill`; if a value doesn't stick, set it via the native input
   setter and dispatch an `input` event in `preview_eval`, or use
   `form.requestSubmit()` directly.

## Known open item

`resources/css/app.css` and some components (`Card`, `Table`, `Alert`,
`StatusBadge`, `IconButton`) still comment-reference `docs/DESIGN.md` as "the
authoritative reference" — that file doesn't exist in `docs/`, and the actual
authoritative reference is now the hand-edited files listed above, not that
missing doc. Don't invent `docs/DESIGN.md` content; if a design decision
needs write-up, put it in the PR description or ask the user.
