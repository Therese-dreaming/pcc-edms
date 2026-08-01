import Swal from 'sweetalert2';

// PCC-EDMS's one shared SweetAlert2 theme — every page imports from here
// instead of building its own Swal.mixin. Colors/fonts live in
// resources/css/app.css's `.swal2-*` rules; this file only sets structure
// (buttons, timers) and which semantic variant to apply.
// NOTE: focusCancel is deliberately NOT set here. SweetAlert2 warns about it on toasts
// (notifySuccess) — and that warning fires on the key's mere presence, not its value — so each
// dialog below that actually has a cancel button opts into focusCancel: true on its own.
const swal = Swal.mixin({
    reverseButtons: true,
    customClass: {
        confirmButton: 'swal2-styled',
        cancelButton: 'swal2-styled swal2-cancel',
    },
});

const variantClass = (variant) => (variant ? `swal2-styled swal-variant-${variant}` : 'swal2-styled');

/**
 * A destructive/irreversible action — "Submit Completion Report", "Delete
 * account," etc. Confirm button reads danger-red; resolves true/false.
 */
export function confirmDanger({ title, text, confirmText = 'Confirm' }) {
    return swal
        .fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            focusCancel: true,
            customClass: {
                confirmButton: variantClass('danger'),
                cancelButton: 'swal2-styled swal2-cancel',
            },
        })
        .then((result) => result.isConfirmed);
}

/**
 * A routine confirmation — not destructive, just an "are you sure" gate
 * (e.g. sending a record out for signing). Confirm button reads primary.
 */
export function confirmAction({ title, text, confirmText = 'Confirm' }) {
    return swal
        .fire({
            title,
            text,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            focusCancel: true,
        })
        .then((result) => result.isConfirmed);
}

/**
 * A consequential action that must be confirmed with the acting user's OWN password — DPREQ
 * rejection, REMIS disapproval / endorsement rejection (concern 10). Requires a typed reason and
 * the password; both are posted and the password is re-verified server-side (ConfirmsPassword
 * trait). Resolves to { reason, password } when confirmed, or null when cancelled/left blank.
 */
export function confirmWithPassword({ title, text, confirmText = 'Confirm', reasonLabel = 'Reason' }) {
    return swal
        .fire({
            title,
            html: `
                <p class="swal2-lead">${text ?? ''}</p>
                <label class="swal2-field-label">${reasonLabel}</label>
                <textarea id="swal-reason" class="swal2-textarea" placeholder="State the reason…"></textarea>
                <label class="swal2-field-label">Your account password</label>
                <input id="swal-password" type="password" class="swal2-input" placeholder="Password" autocomplete="current-password" />
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            focusConfirm: false,
            focusCancel: true,
            customClass: {
                confirmButton: variantClass('danger'),
                cancelButton: 'swal2-styled swal2-cancel',
            },
            preConfirm: () => {
                const reason = document.getElementById('swal-reason')?.value?.trim();
                const password = document.getElementById('swal-password')?.value ?? '';
                if (!reason) {
                    Swal.showValidationMessage('Please state a reason.');
                    return false;
                }
                if (!password) {
                    Swal.showValidationMessage('Please enter your password to confirm.');
                    return false;
                }
                return { reason, password };
            },
        })
        .then((result) => (result.isConfirmed ? result.value : null));
}

/**
 * Ask only for the acting user's own password to confirm a consequential action whose reason is
 * already captured inline (e.g. a REMIS endorsement rejection / disapproval, where remarks are on
 * the form). Resolves to the password string, or null if cancelled/blank.
 */
export function promptPassword({ title, text, confirmText = 'Confirm' }) {
    return swal
        .fire({
            title,
            text,
            icon: 'warning',
            input: 'password',
            inputPlaceholder: 'Your account password',
            inputAttributes: { autocomplete: 'current-password' },
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            focusCancel: true,
            customClass: {
                confirmButton: variantClass('danger'),
                cancelButton: 'swal2-styled swal2-cancel',
            },
            preConfirm: (value) => {
                if (!value) {
                    Swal.showValidationMessage('Please enter your password to confirm.');
                    return false;
                }
                return value;
            },
        })
        .then((result) => (result.isConfirmed ? result.value : null));
}

/** A brief, non-blocking success acknowledgement — auto-dismissing toast. */
export function notifySuccess(title) {
    return swal.fire({
        title,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
    });
}

/**
 * A result notification with a body worth reading — e.g. a public lookup
 * that came back valid/expired/not-found. Unlike notifySuccess this stays
 * open until dismissed, since a toast isn't enough time to read a few lines
 * of detail.
 */
export function notifyResultSuccess(title, html) {
    return swal.fire({ title, html, icon: 'success', confirmButtonText: 'OK', customClass: { confirmButton: variantClass('success') } });
}

export function notifyResultWarning(title, html) {
    return swal.fire({ title, html, icon: 'warning', confirmButtonText: 'OK', customClass: { confirmButton: variantClass('warning') } });
}

export function notifyResultError(title, html) {
    return swal.fire({ title, html, icon: 'error', confirmButtonText: 'OK', customClass: { confirmButton: variantClass('danger') } });
}

/**
 * A blocking, non-dismissible "working…" modal shown while a form submission (any non-GET
 * Inertia visit) is in flight, so every action has a visible loading state. Driven globally by
 * resources/js/lib/feedback.js — pair showLoading() with hideLoading(). Uses Swal directly (no
 * buttons, so none of the mixin's button styling applies); the shared .swal2-* theme CSS still
 * styles the popup/title/text.
 */
let loadingOpen = false;

export function showLoading(title = 'Working…', text = 'Hang tight — saving your changes.') {
    if (loadingOpen) return;
    loadingOpen = true;
    Swal.fire({
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
    });
}

export function hideLoading() {
    if (!loadingOpen) return;
    loadingOpen = false;
    Swal.close();
}

/**
 * Render a server flash payload ({ success, error, warning } — see HandleInertiaRequests) with
 * the appropriate alert. Success is a brief auto-dismissing toast; error/warning stay open until
 * acknowledged since they carry detail worth reading. Only the first populated key is shown.
 */
export function showFlash(flash) {
    if (!flash) return;
    if (flash.success) notifySuccess(flash.success);
    else if (flash.error) notifyResultError('Something went wrong', flash.error);
    else if (flash.warning) notifyResultWarning('Heads up', flash.warning);
}
