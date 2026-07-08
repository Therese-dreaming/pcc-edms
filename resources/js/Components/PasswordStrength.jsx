const LEVELS = [
    null,
    { label: 'Weak', bar: 'bg-danger', text: 'text-danger-text' },
    { label: 'Fair', bar: 'bg-warning', text: 'text-warning-text' },
    { label: 'Strong', bar: 'bg-success', text: 'text-success-text' },
];

function score(password) {
    if (!password) {
        return 0;
    }

    let met = 0;
    if (password.length >= 8) met++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) met++;
    if (/\d/.test(password)) met++;
    if (/[^a-zA-Z\d]/.test(password)) met++;

    if (met <= 1) return 1;
    if (met === 2) return 2;
    return 3;
}

// Feedback-only meter for the register/reset password forms — never blocks
// submission, so it stays purely informative and can't disagree with the
// server's own validation rules.
export default function PasswordStrength({ password }) {
    const level = score(password);

    if (!level) {
        return null;
    }

    const { label, bar, text } = LEVELS[level];

    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((segment) => (
                    <div
                        key={segment}
                        className={`h-1 flex-1 rounded-full ${segment <= level ? bar : 'bg-zinc-200'}`}
                    />
                ))}
            </div>
            <span className={`text-xs font-medium ${text}`}>{label}</span>
        </div>
    );
}
