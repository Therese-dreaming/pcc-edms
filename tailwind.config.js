import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Wraps the HSL channel-triplet custom properties from resources/css/app.css
// (the single source of truth — see docs/DESIGN.md) so Tailwind's opacity
// modifiers (`bg-primary-700/10`) keep working under v3.
const token = (name) => `hsl(var(--color-${name}) / <alpha-value>)`;

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
                primary: scale('primary'),
                paper: scale('paper'),
                accent: scale('accent'),
                success: {
                    DEFAULT: token('success'),
                    bg: token('success-bg'),
                    text: token('success-text'),
                },
                warning: {
                    DEFAULT: token('warning'),
                    bg: token('warning-bg'),
                    text: token('warning-text'),
                },
                danger: {
                    DEFAULT: token('danger'),
                    bg: token('danger-bg'),
                    text: token('danger-text'),
                },
            },
            // font-sans (Outfit) for chrome/labels, font-display (Figtree) for
            // titles, font-subtitle (Lexend) for sub-titles/descriptions under
            // a title, font-content (Inter) for dense record data — Show page
            // field values and Table cell contents, font-grotesk (Space
            // Grotesk) reserved for the DPREQ Index page and Pagination.
            fontFamily: {
                sans: ['"Outfit"', ...defaultTheme.fontFamily.sans],
                display: ['"Figtree"', ...defaultTheme.fontFamily.sans],
                subtitle: ['"Lexend"', ...defaultTheme.fontFamily.sans],
                content: ['"Inter"', ...defaultTheme.fontFamily.sans],
                grotesk: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
