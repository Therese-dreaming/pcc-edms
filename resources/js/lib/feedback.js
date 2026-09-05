import { hideLoading, notifyResultError, showFlash, showLoading } from '@/lib/confirm';

/**
 * Global request feedback, initialized once from app.jsx. Two concerns:
 *
 *  1. Loading state — every non-GET Inertia visit (i.e. a form submission: endorse, approve,
 *     screen, sign, submit…) shows a blocking "Working…" SweetAlert so the user always has a
 *     visual reference that their action is being processed. It is dismissed only when THAT
 *     submission ends — not when some unrelated GET (e.g. the 30s notification poll) finishes.
 *
 *  2. Flash messages — the server shares a one-shot `flash` payload on every response (see
 *     HandleInertiaRequests). Surfaced as a SweetAlert once the submission settles: success as a
 *     brief toast, error/warning as a read-and-acknowledge modal.
 *
 * Both ride Inertia's global document events, so they cover every page with a single integration
 * point — no per-page/per-layout plumbing.
 *
 * WHY the mutation counter (2026-09-05): the loader used to be dismissed on ANY `inertia:finish`
 * or `inertia:navigate`. The NotificationBell polls every 30s (`router.reload`), and that
 * background GET finishing mid-upload would close the loader while the form was still submitting —
 * so the submission looked done while the button stayed "Submitting…". Now the loader is tied to
 * the count of in-flight form submissions and only closes when the last one settles; a background
 * GET can't dismiss it. (The poll itself also skips while `isMutating()` — see NotificationBell.)
 */
let pendingMutations = 0;
let pendingFlash = null;

// True while at least one form submission is in flight. NotificationBell reads this to avoid
// firing a poll that would interrupt/cancel an in-flight submission.
export function isMutating() {
    return pendingMutations > 0;
}

// Dismiss the loader and surface any captured flash — but only once every in-flight submission has
// settled, so a background GET finishing mid-submission doesn't tear the loader down early.
function settle() {
    if (pendingMutations > 0) return;
    hideLoading();
    if (pendingFlash) {
        const flash = pendingFlash;
        pendingFlash = null;
        showFlash(flash);
    }
}

const isMutation = (event) => (event.detail?.visit?.method ?? 'get').toLowerCase() !== 'get';

export function initGlobalFeedback() {
    // A submission is starting — show the loading modal for anything that isn't a plain GET
    // navigation (GETs already have the top progress bar and shouldn't block the screen).
    document.addEventListener('inertia:start', (event) => {
        if (isMutation(event)) {
            pendingMutations += 1;
            showLoading();
        }
    });

    // Capture (don't yet show) a flash payload as pages render; it's surfaced in settle() after the
    // loader closes, so the toast never replaces the still-open loading modal (SweetAlert shows one
    // popup at a time).
    document.addEventListener('inertia:navigate', (event) => {
        const flash = event.detail?.page?.props?.flash;
        if (flash && (flash.success || flash.error || flash.warning)) pendingFlash = flash;
        settle();
    });

    // A visit finished. Decrement only for the submissions we counted; then settle if none remain.
    document.addEventListener('inertia:finish', (event) => {
        if (isMutation(event)) pendingMutations = Math.max(0, pendingMutations - 1);
        settle();
    });

    // Safety net — an abnormal end (network failure, JS exception) must still release everything.
    document.addEventListener('inertia:exception', () => {
        pendingMutations = 0;
        settle();
    });

    // A non-Inertia response came back (e.g. a 413 "POST too large" when uploads exceed the server
    // limit, a 419 expired session, or a 500). By default Inertia pops a raw error modal with the
    // server's HTML page, which is opaque. Intercept the ones we understand and show a plain-language
    // message instead. Clear the in-flight count so the loader/flash machinery settles cleanly.
    document.addEventListener('inertia:invalid', (event) => {
        const status = event.detail?.response?.status;
        const messages = {
            413: ['Attachments too large', 'Your uploaded files exceed the maximum this server accepts in one submission. Please compress or split the largest files, then try again.'],
            419: ['Session expired', 'Your session timed out before the form could be submitted. Reload the page, sign in again if prompted, and resubmit.'],
            500: ['Server error', 'Something went wrong on the server while processing your submission. Please try again in a moment.'],
            503: ['Service unavailable', 'The server is temporarily unavailable. Please try again in a moment.'],
        };
        const message = messages[status] ?? (status >= 500 ? messages[500] : null);
        if (message) {
            event.preventDefault(); // suppress Inertia's raw-HTML error modal
            pendingMutations = 0;
            pendingFlash = null;
            hideLoading();
            notifyResultError(message[0], message[1]);
        }
    });
}
