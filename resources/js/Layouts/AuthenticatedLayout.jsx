import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import NotificationBell from '@/Components/NotificationBell';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import {
    IconActivity,
    IconBell,
    IconChevronDown,
    IconCommand,
    IconFileDescription,
    IconFiles,
    IconLayoutDashboard,
    IconMenu2,
    IconReportAnalytics,
    IconSearch,
    IconShieldCheck,
    IconUsers,
    IconX,
} from '@tabler/icons-react';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const REPORT_CAPABLE_ROLES = [
    'dpo_staff',
    'ethics_secretariat',
    'ethics_committee_chair',
    'system_administrator',
];

const WORKSPACE_NAVIGATION = [
    { label: 'Dashboard', route: 'dashboard', match: 'dashboard', icon: IconLayoutDashboard, hint: 'Overview' },
    { label: 'DPREQ', route: 'dpreq.index', match: 'dpreq.*', icon: IconFileDescription, hint: 'Data requests' },
    { label: 'DPNDA', route: 'dpnda.index', match: 'dpnda.*', icon: IconFiles, hint: 'Data agreements' },
    { label: 'REMIS', route: 'remis.index', match: 'remis.*', icon: IconActivity, hint: 'Records and monitoring' },
    { label: 'Incidents', route: 'incidents.index', match: 'incidents.*', icon: IconShieldCheck, hint: 'Incident response' },
];

const CONTROL_NAVIGATION = [
    { label: 'Reports', route: 'reports.index', match: 'reports.*', icon: IconReportAnalytics, hint: 'Insights' },
    { label: 'Admin', route: 'admin.users.index', match: 'admin.*', icon: IconUsers, hint: 'People and access' },
];

const navBase = 'group flex min-h-12 w-full items-center gap-3 border-b border-white/10 px-4 text-left text-[13px] font-semibold tracking-[-0.01em] transition-[background-color,color,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f5e9e4]';
const navIdle = 'text-white/65 hover:bg-white/[0.08] hover:text-white active:scale-[0.99]';
const navActive = 'bg-[#fffaf7] text-[#4a1720] shadow-[0_8px_24px_rgba(15,3,6,0.18)]';

function initialsFor(name = '') {
    return name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function SidebarLink({ item, compact = false, onNavigate }) {
    const Icon = item.icon;
    const active = route().current(item.match);

    return (
        <NavLink
            href={route(item.route)}
            active={active}
            onClick={onNavigate}
            className={`${navBase} ${active ? navActive : navIdle} ${compact ? 'justify-center px-0' : ''}`}
            aria-label={compact ? `${item.label}: ${item.hint}` : undefined}
            aria-current={active ? 'page' : undefined}
        >
            <Icon size={18} stroke={active ? 2.1 : 1.7} className="shrink-0" aria-hidden="true" />
            {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {!compact && <span className={`hidden text-[10px] font-medium xl:block ${active ? 'text-[#4a1720]/60' : 'text-white/35'}`}>{item.hint}</span>}
        </NavLink>
    );
}

function NavigationGroup({ label, items, compact, onNavigate }) {
    return (
        <section className="border-t border-white/10 pt-5" aria-label={label}>
            {!compact && <h2 className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{label}</h2>}
            <div>{items.map((item) => <SidebarLink key={item.label} item={item} compact={compact} onNavigate={onNavigate} />)}</div>
        </section>
    );
}

function HeaderUserMenu({ user, initials }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button type="button" className="inline-flex min-h-10 items-center gap-2 px-2.5 text-sm font-bold text-[#4a1720] transition-colors hover:bg-[#f8e9e4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#842d3d]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6e2331] text-[10px] font-extrabold text-[#f8e9e4]">{initials}</span>
                    <span className="max-w-28 truncate">{user.name}</span>
                    <IconChevronDown size={15} aria-hidden="true" />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content>
                <Dropdown.Link href={route('profile.edit')}>Profile settings</Dropdown.Link>
                <Dropdown.Link href={route('logout')} method="post" as="button">Log out</Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const { user, roleName } = usePage().props.auth;
    const canViewReports = REPORT_CAPABLE_ROLES.includes(roleName);
    const isAdmin = roleName === 'system_administrator';
    const [mobileOpen, setMobileOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [compact, setCompact] = useState(() => {
        if (typeof window === 'undefined') return false;
        try { return JSON.parse(window.localStorage.getItem('sidebarCompact') || 'false'); } catch { return false; }
    });

    const links = useMemo(() => [
        ...WORKSPACE_NAVIGATION,
        ...(canViewReports ? [CONTROL_NAVIGATION[0]] : []),
        ...(isAdmin ? [CONTROL_NAVIGATION[1]] : []),
    ], [canViewReports, isAdmin]);

    const filteredLinks = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return links;
        return links.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(value));
    }, [links, query]);

    const initials = initialsFor(user.name);
    const currentSection = links.find((item) => route().current(item.match));

    useEffect(() => {
        const onKeyDown = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setCommandOpen(true);
            }
            if (event.key === 'Escape') {
                setCommandOpen(false);
                setMobileOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        document.body.style.overflow = commandOpen || mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [commandOpen, mobileOpen]);

    const closeMenus = () => {
        setMobileOpen(false);
        setCommandOpen(false);
    };

    const toggleCompact = () => {
        setCompact((value) => {
            const nextValue = !value;
            try { window.localStorage.setItem('sidebarCompact', JSON.stringify(nextValue)); } catch { /* optional preference */ }
            return nextValue;
        });
    };

    const navigation = (
        <>
            <NavigationGroup label="Workspace" items={WORKSPACE_NAVIGATION} compact={compact} onNavigate={closeMenus} />
            {(canViewReports || isAdmin) && <NavigationGroup label="Control room" items={links.filter((item) => !WORKSPACE_NAVIGATION.includes(item))} compact={compact} onNavigate={closeMenus} />}
        </>
    );

    return (
        <div className="min-h-screen bg-[#f7f2f0] font-sans text-[#321b20] antialiased">
            <aside className={`fixed inset-y-0 left-0 z-40 hidden h-screen flex-col overflow-hidden border-r border-[#b76a76]/35 bg-[radial-gradient(circle_at_20%_0%,rgba(255,219,209,0.15),transparent_28%),linear-gradient(155deg,#5b1d29_0%,#3a111c_48%,#240b12_100%)] shadow-[0_22px_60px_rgba(43,8,16,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition-[width] duration-300 lg:flex ${compact ? 'w-[76px]' : 'w-[288px]'}`} aria-label="Primary navigation">
                <div className={`flex h-[84px] shrink-0 items-center border-b border-white/10 ${compact ? 'justify-center px-3' : 'px-5'}`}>
                    <Link href={route('dashboard')} className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5e9e4]">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/20 bg-[#fffaf7] text-[#4a1720] shadow-[0_8px_20px_rgba(20,3,7,0.22)]"><ApplicationLogo className="h-6 w-6" /></span>
                        {!compact && <span className="leading-none"><strong className="block text-[15px] font-extrabold tracking-[-0.03em] text-[#fff1ed]">PCC</strong><span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e8b6ad]/65">EDMS</span></span>}
                    </Link>
                </div>

                {!compact && <div className="border-b border-white/10 p-4"><button type="button" onClick={() => setCommandOpen(true)} className="flex h-10 w-full items-center gap-2.5 border border-white/15 bg-black/15 px-3 text-left text-xs text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-colors hover:border-[#d18a8a]/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5e9e4]"><IconSearch size={16} stroke={1.8} aria-hidden="true" /><span className="flex-1">Search workspace</span><kbd className="border border-white/15 px-1.5 py-0.5 text-[10px] text-white/35">âŒ˜K</kbd></button></div>}

                <nav className="flex-1 overflow-y-auto" aria-label="Workspace sections">{navigation}</nav>
                <div className={`shrink-0 border-t border-white/10 px-4 py-4 ${compact ? 'text-center' : ''}`}><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e8b6ad]/45">{compact ? 'PCC' : 'PCC secure workspace'}</span></div>
            </aside>

            <div className={`min-h-screen transition-[padding] duration-300 ${compact ? 'lg:pl-[76px]' : 'lg:pl-[288px]'}`}>
                <nav className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#eadbd7] bg-[#fffaf8]/90 px-4 shadow-[0_8px_24px_rgba(73,27,31,0.04)] backdrop-blur sm:px-7 lg:px-9" aria-label="Utility navigation">
                    <div className="flex min-w-0 items-center gap-3">
                        <button type="button" onClick={toggleCompact} className="hidden h-10 w-10 items-center justify-center text-[#75404b] transition-colors hover:bg-[#f8e9e4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#842d3d] lg:flex" aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}><IconMenu2 size={20} aria-hidden="true" /></button>
                        <Link href={route('dashboard')} className="flex items-center gap-2 lg:hidden"><ApplicationLogo className="h-7 w-7" /><span className="text-sm font-extrabold tracking-[-0.03em]">PCC EDMS</span></Link>
                        <div className="hidden items-center gap-2 text-[13px] sm:flex"><span className="text-[#98777d]">Workspace</span><span className="text-[#d7c2bf]">/</span><strong className="truncate text-[#321b20]">{currentSection?.label || 'Dashboard'}</strong></div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button type="button" onClick={() => setCommandOpen(true)} className="hidden h-10 items-center gap-2 px-2 text-xs font-semibold text-[#75404b] transition-colors hover:bg-[#f8e9e4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#842d3d] sm:flex"><IconCommand size={16} aria-hidden="true" /><span>Quick find</span></button>
                        <NotificationBell />
                        <div className="hidden h-7 w-px bg-[#eadbd7] sm:block" />
                        <div className="relative hidden sm:block"><HeaderUserMenu user={user} initials={initials} /></div>
                        <button type="button" onClick={() => setMobileOpen((value) => !value)} className="inline-flex h-11 w-11 items-center justify-center text-[#75404b] transition-colors hover:bg-[#f8e9e4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#842d3d] lg:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>{mobileOpen ? <IconX size={21} aria-hidden="true" /> : <IconMenu2 size={21} aria-hidden="true" />}</button>
                    </div>
                </nav>

                {mobileOpen && <div className="fixed inset-0 top-[68px] z-20 bg-[#fffaf8] lg:hidden"><nav className="overflow-y-auto pb-5" aria-label="Mobile navigation"><div className="border-b border-[#eadbd7] py-2">{links.map((item) => <ResponsiveNavLink key={item.label} href={route(item.route)} active={route().current(item.match)} onClick={closeMenus}>{item.label}</ResponsiveNavLink>)}</div><div className="border-b border-[#eadbd7] py-2"><ResponsiveNavLink href={route('notifications.index')} onClick={closeMenus}><span className="flex items-center gap-2"><IconBell size={17} aria-hidden="true" />Notifications</span></ResponsiveNavLink><ResponsiveNavLink href={route('profile.edit')} onClick={closeMenus}>Profile settings</ResponsiveNavLink><ResponsiveNavLink method="post" href={route('logout')} as="button" onClick={closeMenus}>Log out</ResponsiveNavLink></div></nav></div>}
                {header && <header className="border-b border-[#eadbd7] bg-[#fffaf8] px-5 py-8 sm:px-8 lg:px-9">{header}</header>}
                <main className="min-h-[calc(100vh-68px)]">{children}</main>
            </div>

            {commandOpen && <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[#240b12]/55 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search workspace" onClick={() => setCommandOpen(false)}><div className="w-full max-w-[620px] overflow-hidden border border-[#d9b2aa] bg-[#fffaf8] shadow-[0_28px_80px_rgba(54,12,20,0.3)]" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-[#eadbd7] px-5"><IconSearch size={20} className="text-[#842d3d]" aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search pages, requests, people..." className="h-16 flex-1 border-0 bg-transparent text-base text-[#321b20] outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-[#98777d]" aria-label="Search workspace" /><kbd className="border border-[#d9c2bd] px-2 py-1 text-[10px] font-bold text-[#75404b]">ESC</kbd></div><div className="max-h-[52vh] overflow-y-auto p-3"><p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a06b72]">Jump to</p>{filteredLinks.length ? filteredLinks.map((item) => { const Icon = item.icon; return <Link key={item.label} href={route(item.route)} onClick={closeMenus} className="flex items-center gap-3 border-b border-[#f1e5e1] px-3 py-3 text-sm font-semibold text-[#4a1720] transition-colors hover:bg-[#f8e9e4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#842d3d]"><Icon size={18} className="text-[#842d3d]" aria-hidden="true" /><span>{item.label}</span><span className="ml-auto text-xs font-normal text-[#98777d]">{item.hint}</span></Link>; }) : <p className="px-3 py-8 text-center text-sm text-[#75404b]">No matching workspace pages.</p>}</div></div></div>}
        </div>
    );
}