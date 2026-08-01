import { hideLoading, showFlash, showLoading } from '@/lib/confirm';

/**
 * Global request feedback, initialized once from app.jsx. Two concerns:
 *
 *  1. Loading state — every non-GET Inertia visit (i.e. a form submission: endorse, approve,
 *     screen, sign, submit…) shows a blocking "Working…" SweetAlert so the user always has a
 *     visual reference that their action is being processed. It is dismissed the moment the
 *     resulting page renders, or when the visit ends without rendering (cancelled, network
 *     failure, server exception).
 *
 *  2. Flash messages — the server shares a one-shot `flash` payload on every response (see
 *     HandleInertiaRequests). After the page it belongs to renders, we surface it as a
 *     SweetAlert: success as a brief toast, error/warning as a read-and-acknowledge modal.
 *
 * Both ride Inertia's global document events, so they cover every page (authenticated and guest)
 * with a single integration point — no per-page/per-layout plumbing.
 */
export function initGlobalFeedback() {
    // A submission is starting — show the loading modal for anything that isn't a plain GET
    // navigation (GETs already have the top progress bar and shouldn't block the screen).
    document.addEventListener('inertia:start', (event) => {
        const method = (event.detail?.visit?.method ?? 'get').toLowerCase();
        if (method !== 'get') showLoading();
    });

    // The resulting page has rendered — dismiss the loader, then toast any flash message.
    // `navigate` fires on every successful visit, including the initial load and the GET that
    // follows a POST redirect, so this is the single reliable "done + has fresh props" hook.
    document.addEventListener('inertia:navigate', (event) => {
        hideLoading();
        showFlash(event.detail?.page?.props?.flash);
    });

    // Safety nets — a visit that ends without rendering must still release the loading modal.
    document.addEventListener('inertia:finish', () => hideLoading());
    document.addEventListener('inertia:exception', () => hideLoading());
}
