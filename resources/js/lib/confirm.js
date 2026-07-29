import Swal from 'sweetalert2';

// PCC-EDMS's one shared SweetAlert2 theme — every page imports from here
// instead of building its own Swal.mixin. Colors/fonts live in
// resources/css/app.css's `.swal2-*` rules; this file only sets structure
// (buttons, timers) and which semantic variant to apply.
const swal = Swal.mixin({
    reverseButtons: true,
    focusCancel: true,
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
