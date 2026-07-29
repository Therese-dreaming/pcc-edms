import Avatar, { initialsFor } from '@/Components/Avatar';
import Dropdown from '@/Components/Dropdown';
import NotificationBell from '@/Components/NotificationBell';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    IconActivity, IconChartBar, IconChevronDown, IconFileDescription, IconFiles,
    IconFolder, IconLayoutDashboard, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
    IconLogout, IconMenu2, IconSearch, IconSettings, IconShieldCheck, IconUsers,
    IconUsersGroup, IconX,
} from '@tabler/icons-react';

const REPORT_CAPABLE_ROLES = ['dpo_staff', 'ethics_secretariat', 'ethics_committee_chair', 'system_administrator'];
// `can` is the key into the server-computed module-access map (HandleInertiaRequests); Dashboard is
// always visible. A module the user has no business in is hidden — the module still enforces its own
// authorization, so this is purely UX.
const WORKSPACE_NAVIGATION = [
    { label: 'Dashboard', route: 'dashboard', match: 'dashboard', icon: IconLayoutDashboard },
    { label: 'DPREQ', route: 'dpreq.index', match: 'dpreq.*', icon: IconFileDescription, can: 'dpreq' },
    { label: 'DPNDA', route: 'dpnda.index', match: 'dpnda.*', icon: IconFiles, can: 'dpnda' },
    { label: 'REMIS', route: 'remis.index', match: 'remis.*', icon: IconActivity, can: 'remis' },
    { label: 'Incidents', route: 'incidents.index', match: 'incidents.*', icon: IconShieldCheck, can: 'incidents' },
];
// Keyed rather than positional: these were previously referenced as CONTROL_NAVIGATION[0..3], so
// inserting an entry silently re-pointed a role's link at the wrong item.
const CONTROL_NAVIGATION = {
    reports: { label: 'Reports', route: 'reports.index', match: 'reports.*', icon: IconChartBar },
    files: { label: 'File manager', route: 'files.index', match: 'files.*', icon: IconFolder },
    admin: { label: 'Admin', route: 'admin.users.index', match: 'admin.users.*', icon: IconUsers },
    adviserRequests: { label: 'Adviser requests', route: 'admin.adviser-requests.index', match: 'admin.adviser-requests.*', icon: IconUsersGroup },
    auditTrail: { label: 'Audit trail', route: 'admin.audit-trail.index', match: 'admin.audit-trail.*', icon: IconSearch },
    classes: { label: 'Classes', route: 'adviser.cohorts.index', match: 'adviser.cohorts.*', icon: IconUsersGroup },
};

function roleLabel(roleName = '') { return roleName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

// Redesign system (.claude/skills/redesign): light sidebar, NO scrollbar. The active row is a
// NEUTRAL gray fill with bold dark text — the dark-red accent is reserved for buttons/links/badges,
// never for marking the active nav row.
function SidebarItem({ item, collapsed, onNavigate }) {
    const Icon = item.icon;
    const active = route().current(item.match);
    return <li className="group relative min-w-0">
        <Link href={route(item.route)} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`relative flex min-h-10 min-w-0 items-center gap-3 overflow-hidden rounded-lg px-4 text-sm transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'bg-surface-tertiary font-semibold text-fg-primary' : 'font-medium text-fg-secondary hover:bg-surface-tertiary hover:text-fg-primary'}`}>
            <Icon size={19} strokeWidth={1.9} className="shrink-0" /><span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
        </Link>
        {collapsed && <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-fg-primary px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-hover transition-opacity group-hover:opacity-100 lg:block">{item.label}</span>}
    </li>;
}

function SectionLabel({ children, collapsed }) { return collapsed ? <div className="mx-3 my-4 hidden h-px bg-border lg:block" aria-hidden="true" /> : <p className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary">{children}</p>; }

function QuickFindModal({ items, open, onClose }) {
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) { dialog.showModal(); requestAnimationFrame(() => inputRef.current?.focus()); }
        if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const handleClose = () => { setQuery(''); onClose(); };
        dialog.addEventListener('close', handleClose);
        return () => dialog.removeEventListener('close', handleClose);
    }, [onClose]);

    const results = useMemo(() => {
        const value = query.trim().toLowerCase();
        return value ? items.filter((item) => item.label.toLowerCase().includes(value)) : items;
    }, [items, query]);

    return <dialog ref={dialogRef} aria-labelledby="quick-find-title" className="w-[min(560px,calc(100vw-32px))] rounded-xl border border-border bg-surface-secondary p-0 text-fg-primary shadow-hover backdrop:bg-fg-primary/40">
        <div className="px-5 pb-3 pt-5">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Search filter</p><h2 id="quick-find-title" className="mt-1 text-xl font-bold tracking-tight">Quick find</h2></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-fg-tertiary hover:bg-surface-tertiary hover:text-fg-primary" aria-label="Close quick find"><IconX size={18} /></button></div>
            <div className="mt-5 flex items-center gap-3 rounded-full border border-border bg-surface-tertiary px-4 py-2.5 focus-within:border-primary"><IconSearch size={18} className="shrink-0 text-fg-tertiary" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter modules..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-tertiary" /><kbd className="hidden text-[10px] font-semibold text-fg-tertiary sm:block">ESC</kbd></div>
        </div>
        <div className="max-h-[360px] overflow-y-auto border-t border-border p-2.5"><p className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary">{query ? 'Matching modules' : 'Available modules'}</p>{results.length ? results.map((item) => { const Icon = item.icon; return <Link key={item.route} href={route(item.route)} onClick={onClose} className="flex items-center gap-3 rounded-lg px-2.5 py-3 text-fg-secondary hover:bg-surface-tertiary hover:text-fg-primary"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary"><Icon size={17} strokeWidth={1.8} /></span><span className="text-sm font-semibold">{item.label}</span></Link>; }) : <div className="px-3 py-8 text-center text-sm text-fg-tertiary">No matching modules.</div>}</div>
    </dialog>;
}

function HeaderUserMenu({ user, initials, roleName }) {
    return <Dropdown>
        <Dropdown.Trigger><button type="button" className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 text-sm font-semibold text-fg-primary hover:bg-surface-tertiary"><Avatar initials={initials} size="sm" /><span className="hidden text-left leading-tight sm:block"><span className="block max-w-[10rem] truncate">{user.name}</span><span className="mt-0.5 block text-[11px] font-medium text-fg-tertiary">{roleLabel(roleName)}</span></span><IconChevronDown size={15} className="text-fg-tertiary" /></button></Dropdown.Trigger>
        <Dropdown.Content>
            <Dropdown.Link href={route('profile.edit')}><span className="flex items-center gap-2"><IconSettings size={15} />Profile settings</span></Dropdown.Link>
            <Dropdown.Link href={route('logout')} method="post" as="button"><span className="flex items-center gap-2"><IconLogout size={15} />Log out</span></Dropdown.Link>
        </Dropdown.Content>
    </Dropdown>;
}

export default function AuthenticatedLayout({ header, children }) {
    const { user, roleName } = usePage().props.auth;
    const can = usePage().props.can ?? {};
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('edms.sidebar.collapsed') === 'true';
    });
    const [quickFindOpen, setQuickFindOpen] = useState(false);

    const controlLinks = useMemo(() => [
        ...(REPORT_CAPABLE_ROLES.includes(roleName) ? [CONTROL_NAVIGATION.reports] : []),
        // File manager — DPO desk + admin only (see FileManagerController::ALLOWED_ROLES).
        ...(['dpo_staff', 'system_administrator'].includes(roleName) ? [CONTROL_NAVIGATION.files] : []),
        ...(roleName === 'system_administrator' ? [CONTROL_NAVIGATION.admin] : []),
        ...(['system_administrator', 'dpo_staff'].includes(roleName) ? [CONTROL_NAVIGATION.adviserRequests] : []),
        ...(['system_administrator', 'dpo_staff', 'ethics_committee_chair'].includes(roleName) ? [CONTROL_NAVIGATION.auditTrail] : []),
        ...(['adviser', 'department_coordinator', 'system_administrator'].includes(roleName) ? [CONTROL_NAVIGATION.classes] : []),
    ], [roleName]);
    // Hide workspace modules the user has no access to (server-computed `can` map). Items without a
    // `can` key (Dashboard) are always shown.
    const workspaceLinks = useMemo(
        () => WORKSPACE_NAVIGATION.filter((item) => !item.can || can[item.can]),
        [can],
    );
    const allLinks = useMemo(() => [...workspaceLinks, ...controlLinks], [workspaceLinks, controlLinks]);
    const initials = initialsFor(user.name);
    const activeItem = allLinks.find((item) => route().current(item.match));

    useEffect(() => {
        window.localStorage.setItem('edms.sidebar.collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    useEffect(() => {
        const onKeyDown = (event) => { if (event.key === 'Escape') { setMobileNavOpen(false); setQuickFindOpen(false); } };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileNavOpen || quickFindOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileNavOpen, quickFindOpen]);

    return <div className="flex h-screen w-full min-w-0 overflow-hidden bg-surface-tertiary font-sans text-fg-primary antialiased">
        {mobileNavOpen && <button type="button" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-fg-primary/40 lg:hidden" aria-label="Close navigation" />}
        {/* Sidebar — light, fixed height, NO scrollbar (overflow-hidden). Content is short enough
            (≤9 nav rows) to fit the budget; never add overflow-y-auto here. */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex min-w-0 flex-col overflow-hidden border-r border-border bg-surface-primary text-fg-secondary transition-[width,transform] duration-300 ease-out lg:relative lg:z-auto lg:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'lg:w-[76px]' : 'w-[288px] lg:w-[256px]'}`} aria-label="Primary navigation">
            <div className={`flex h-[68px] shrink-0 items-center overflow-hidden border-b border-border px-4 ${sidebarCollapsed ? 'lg:justify-center' : 'gap-3'}`}><Link href={route('dashboard')} onClick={() => setMobileNavOpen(false)} className="flex min-w-0 shrink-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-white">E</span><span className={sidebarCollapsed ? 'lg:hidden' : ''}><span className="block text-lg font-bold tracking-tight text-fg-primary">EDMS</span><span className="mt-0.5 block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary">PCC workspace</span></span></Link><button type="button" onClick={() => setMobileNavOpen(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-full text-fg-tertiary hover:bg-surface-tertiary hover:text-fg-primary lg:hidden" aria-label="Close navigation"><IconX size={19} /></button></div>
            <nav className="min-w-0 flex-1 overflow-hidden px-3 py-5" aria-label="Workspace navigation"><SectionLabel collapsed={sidebarCollapsed}>Workspace</SectionLabel><ul className="min-w-0 space-y-1">{workspaceLinks.map((item) => <SidebarItem key={item.route} item={item} collapsed={sidebarCollapsed} onNavigate={() => setMobileNavOpen(false)} />)}</ul>{controlLinks.length > 0 && <div className="mt-6"><SectionLabel collapsed={sidebarCollapsed}>Controls</SectionLabel><ul className="min-w-0 space-y-1">{controlLinks.map((item) => <SidebarItem key={item.route} item={item} collapsed={sidebarCollapsed} onNavigate={() => setMobileNavOpen(false)} />)}</ul></div>}</nav>
            <div className="shrink-0 border-t border-border p-3"><div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}><Avatar initials={initials} size="md" /><span className={sidebarCollapsed ? 'lg:hidden' : ''}><span className="block max-w-[170px] truncate text-xs font-bold text-fg-primary">{user.name}</span><span className="mt-0.5 block max-w-[170px] truncate text-[11px] text-fg-tertiary">{user.email}</span></span></div></div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="z-30 flex min-h-[68px] shrink-0 items-center gap-3 border-b border-border bg-surface-primary px-4 sm:px-6 lg:px-3">
                <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-fg-secondary hover:bg-surface-tertiary lg:grid" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarCollapsed ? <IconLayoutSidebarLeftExpand size={20} /> : <IconLayoutSidebarLeftCollapse size={20} />}</button>
                <button type="button" onClick={() => setMobileNavOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-fg-secondary hover:bg-surface-tertiary lg:hidden" aria-label="Open navigation"><IconMenu2 size={21} /></button>
                <nav aria-label="Breadcrumb" className="hidden min-w-0 shrink-0 items-center gap-2 text-sm md:flex"><span className="text-fg-tertiary">Workspace</span><span className="text-border-medium">/</span><span className="truncate text-lg font-bold tracking-tight text-fg-primary">{activeItem?.label ?? 'Dashboard'}</span></nav>
                <button type="button" onClick={() => setQuickFindOpen(true)} className="mx-auto flex h-10 min-w-0 w-full max-w-[680px] items-center gap-3 rounded-full border border-border bg-surface-tertiary px-4 text-left text-sm font-medium text-fg-tertiary hover:border-primary hover:text-primary" aria-label="Open quick find"><IconSearch size={18} className="shrink-0" /><span className="truncate">Quick find</span><kbd className="ml-auto hidden shrink-0 rounded-full border border-border bg-surface-secondary px-2 py-0.5 text-[10px] text-fg-tertiary sm:block">Search</kbd></button>
                <div className="flex shrink-0 items-center gap-1 sm:gap-3"><NotificationBell /><div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" /><HeaderUserMenu user={user} initials={initials} roleName={roleName} /></div>
            </header>
            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-surface-tertiary">{header && <div className="border-b border-border bg-surface-primary px-5 py-6 sm:px-7 lg:px-10">{header}</div>}{children}</main>
        </div>
        <QuickFindModal items={allLinks} open={quickFindOpen} onClose={() => setQuickFindOpen(false)} />
    </div>;
}
