# DESIGN.md — PCC-EDMS Front-End Design System

_Written 2026-08-31 (roadmap Phase E). The redesign was paused mid-flight on 2026-07-25 leaving
two aesthetics in the tree; the requester reopened Phase E on 2026-08-31 with instructions to
proceed without further permission. This file is the reconciliation: what the system is, which
pages are sanctioned exceptions, and the rules for any future UI work._

## 1. The canonical system: maroon/paper tokens

Defined in `tailwind.config.js` and `resources/css/app.css`. Every shared component and most
pages already use it.

**Color** — three families, deliberately few:

| Family | Tokens | Use |
|---|---|---|
| `primary-*` | Maroon/crimson ramp (DEFAULT = `primary-700`, `strong` = 800, `soft` = 50) | Actions, accents, the one brand color. PDF badge uses `#891a1a` = `primary-700` so paper matches screen |
| `surface-*` | `surface-primary/secondary/tertiary(+medium)` | Page, card, and inset backgrounds — paper tones |
| `fg-*` / `border-*` | `fg-primary/secondary/tertiary`, `border-default/medium` | Text hierarchy and hairlines |

**Type** — Inter everywhere (`font-sans/display/content/grotesk` all resolve to Inter); PDFs use
a deliberate 3-font hierarchy (Aptos structure / Times prose / Courier data — see
`PdfAssets` + the PDF templates).

**Constraints (anti-slop rules from the approved plan):**
- No gradients, no glassmorphism (`backdrop-blur` as decoration), no oversized shadows.
- Max ~3 color families and ~2 typefaces per surface.
- Icons: `@tabler/icons-react` is the established library.

**Shared components** (already migrated): `Card`, `Table`, `StatusBadge`, `Alert`, `IconButton`,
`StatusTimeline`, `CertificateHistory`, `RevisionPanel`, `SignaturePad`, `DocumentDropzone`,
`SelectWithOther`, both layouts, dashboards.

## 2. Sanctioned exceptions (hand-edited pages — DO NOT restyle unilaterally)

During the pause, the requester hand-edited these pages with a *different* aesthetic
(stone/zinc neutrals, `@phosphor-icons/react`, gradients/glass in places):

- `resources/js/Pages/Auth/*.jsx` (all six auth pages)
- `resources/js/Pages/Dpreq/Show.jsx`
- `resources/js/Pages/Dpnda/Create.jsx`

A previous pass restyled the auth pages back toward the token system without asking and had to
revert without a clean original to restore to (HANDOFF §0). **Rule:** these pages stay as they
are until the requester explicitly approves changing them; additive work on them must match
*their* local aesthetic (e.g. the Certificate History panel on `Dpreq/Show.jsx` uses the page's
own `PANEL` constants). New `@phosphor-icons/react` usage is acceptable on these pages; the rest
of the app stays on Tabler.

## 3. Rules for new UI work

1. New pages/components use the token system (§1) — never raw Tailwind palette colors.
2. Buttons: `PrimaryButton`/`DangerButton` (submit) — never `SecondaryButton` as a submit
   control (it defaults to `type="button"`; see HANDOFF bugs list).
3. Confirmations go through `@/lib/confirm` (SweetAlert2 global feedback layer).
4. Status labels come from the module's `STATUS_LABELS` map; new statuses must be added there
   *and* in the PDF/verification surfaces if visible.
5. Errors must be visible: every `router.post` surface renders `errors.*` (Inertia does not show
   them by default).

## 4. Remaining reconciliation work (if a full visual pass is ever ordered)

- Inventory: token-system pages vs. exception pages is otherwise clean; verify with
  `grep -rl "backdrop-blur\|from-.*via-.*to-" resources/js/Pages` before claiming parity.
- A future consolidation would re-skin the three exception page groups onto tokens *with the
  requester reviewing each page diff* — or formally bless the phosphor/stone style as a second
  theme. Either way: page-by-page sign-off, never a sweep.
- `docs/DESIGN.md` (this file) is the source of truth for whichever direction wins.
