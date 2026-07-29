import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Wraps the HSL channel-triplet custom properties from resources/css/app.css
// (the single source of truth — see docs/DESIGN.md) so Tailwind's opacity
// modifiers (`bg-primary-700/10`) keep working under v3.
const token = (name) => `hsl(var(--color-${name}) / <alpha-value>)`;
// Redesign-system tokens live under bare `--name` (not `--color-name`).
const raw = (name) => `hsl(var(--${name}) / <alpha-value>)`;

const scale = (name) =>
    Object.fromEntries(
        [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [
            step,
            token(`${name}-${step}`),
        ]),
    );

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                // Existing crimson ramp doubles as the redesign accent: `primary`
                // (bare) → the 700 step, plus strong/soft for hover + tint.
                primary: {
                    ...scale('primary'),
                    DEFAULT: token('primary-700'),
                    strong: token('primary-800'),
                    soft: token('primary-50'),
                },
                paper: scale('paper'),
                accent: scale('accent'),
                // Redesign neutral surface/text/border layer.
                surface: {
                    primary: raw('surface-primary'),
                    secondary: raw('surface-secondary'),
                    tertiary: raw('surface-tertiary'),
                    'tertiary-medium': raw('surface-tertiary-medium'),
                },
                border: {
                    DEFAULT: raw('border-default'),
                    medium: raw('border-medium'),
                },
                fg: {
                    primary: raw('fg-primary'),
                    secondary: raw('fg-secondary'),
                    tertiary: raw('fg-tertiary'),
                    'primary-strong': token('primary-800'),
                    'success-strong': token('success-text'),
                    'danger-strong': token('danger-text'),
                    'warning-strong': token('warning-text'),
                },
                success: {
                    DEFAULT: token('success'),
                    bg: token('success-bg'),
                    text: token('success-text'),
                    soft: token('success-bg'),
                },
                warning: {
                    DEFAULT: token('warning'),
                    bg: token('warning-bg'),
                    text: token('warning-text'),
                    soft: token('warning-bg'),
                },
                danger: {
                    DEFAULT: token('danger'),
                    bg: token('danger-bg'),
                    text: token('danger-text'),
                    soft: token('danger-bg'),
                },
            },
            borderRadius: {
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
            },
            boxShadow: {
                resting: 'var(--shadow-resting)',
                hover: 'var(--shadow-hover)',
            },
            // Redesign spec: Inter everywhere — one typeface, no serif/display
            // secondary face. All former role utilities (font-display, -subtitle,
            // -content, -grotesk) now resolve to Inter so existing markup keeps
            // working while the type system collapses to a single family.
            fontFamily: {
                sans: ['"Inter"', ...defaultTheme.fontFamily.sans],
                display: ['"Inter"', ...defaultTheme.fontFamily.sans],
                subtitle: ['"Inter"', ...defaultTheme.fontFamily.sans],
                content: ['"Inter"', ...defaultTheme.fontFamily.sans],
                grotesk: ['"Inter"', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
