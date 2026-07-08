import { Link } from '@inertiajs/react';

// docs/4.3-esignature-notifications.md "Notification Dashboards" — one widget card. Backend
// widgets all share the same { count, items: [{label, detail, url, at}] } shape.
export default function WidgetCard({ title, widget }) {
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-primary-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-primary-800">{title}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-primary-700">
                    {widget.count}
                </span>
            </div>
            <ul className="max-h-72 divide-y divide-zinc-100 overflow-y-auto">
                {widget.items.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-zinc-400">Nothing here.</li>
                )}
                {widget.items.map((item, i) => (
                    <li key={i}>
                        <Link href={item.url} className="block px-4 py-2 hover:bg-zinc-50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-primary-700">{item.label}</span>
                                <span className="text-xs text-zinc-400">{item.at}</span>
                            </div>
                            <div className="truncate text-sm text-zinc-600">{item.detail}</div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
