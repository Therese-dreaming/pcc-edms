// Interior-page counterpart to the Auth icon-badge header — flat (no
// gradient, no shine), meant to sit inside AuthenticatedLayout's `header`
// slot. See .claude/skills/pcc-edms-redesign.
export default function PageHeader({ icon: Icon, title, description, actions }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={18} className="text-primary" strokeWidth={2} aria-hidden="true" />}
                    <h2 className="text-2xl font-bold leading-tight tracking-tight text-fg-primary">
                        {title}
                    </h2>
                </div>
                {description && (
                    <p className="mt-1 text-sm text-fg-tertiary">{description}</p>
                )}
            </div>

            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
