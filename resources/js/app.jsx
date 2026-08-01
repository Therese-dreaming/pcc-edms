import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initGlobalFeedback } from '@/lib/feedback';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Global SweetAlert feedback for every request: a "Working…" loading modal on form submissions
// and flash-message toasts/modals after the page renders (see resources/js/lib/feedback.js).
initGlobalFeedback();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
