import React, { useEffect, useLayoutEffect, useRef, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  HiOutlineUserGroup, HiAnnotation, HiChartPie, HiBadgeCheck,
  HiPencilAlt, HiStatusOnline,
  HiCurrencyDollar, HiAcademicCap, HiOutlineBookOpen, HiMenu, HiCheckCircle,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { setSidebarOpen, toggleSidebarCollapsed } from '../../redux/theme/themeSlice';
import { DASHBOARD_BY_ROLE } from '../../components/roles';

/* ─────────────────────────────────────────────────────────────────────────────
   Nav config
   `tab` must match the value your dashboard switches on (?tab=...).
   Each tier builds on the one below it. Rename / add tabs to suit your app.
   Set `badge: 'chat'` on any item that should show the unread chat count.
   ───────────────────────────────────────────────────────────────────────────── */
const FREE_ITEMS = [
  { tab: 'papers',     label: 'Papers',     icon: HiOutlineBookOpen },
  { tab: 'favourites', label: 'Favourites', icon: HiCheckCircle },
  { tab: 'diamonds',   label: 'Diamonds',   icon: HiCurrencyDollar },
  // { tab: 'requests', label: 'Requests', icon: HiStatusOnline },
  // { tab: 'chats',    label: 'Chats',    icon: HiAnnotation, badge: 'chat' },
];

const MEMBER_ITEMS = [
  ...FREE_ITEMS,
  { tab: 'marking', label: 'Transactions', icon: HiBadgeCheck },
];

const PREMIUM_ITEMS = [
  ...MEMBER_ITEMS,
  { tab: 'revision',  label: 'Revision Tools', icon: HiAcademicCap },
  { tab: 'analytics', label: 'My Progress',    icon: HiChartPie },
];

const SYSADMIN_ITEMS = [
  { tab: 'overview',      label: 'Overview',   icon: HiChartPie },
  { tab: 'users',         label: 'Users',      icon: HiOutlineUserGroup },
  { tab: 'papers',        label: 'Papers',     icon: HiPencilAlt },
  { tab: 'favourites',    label: 'Favourites', icon: HiCheckCircle },
  { tab: 'payments',      label: 'Payments',   icon: HiCurrencyDollar },
  { tab: 'chats',         label: 'Chats',      icon: HiAnnotation, badge: 'chat' },
  { tab: 'documentsrepo', label: 'Documents',  icon: HiOutlineShieldCheck },
  { tab: 'requests',      label: 'Requests',   icon: HiStatusOnline },
];

const NAV_BY_ROLE = {
  free:     FREE_ITEMS,
  member:   MEMBER_ITEMS,
  premium:  PREMIUM_ITEMS,
  sysadmin: SYSADMIN_ITEMS,
};

const DESKTOP_BREAKPOINT = 768; // Tailwind `md`
const DEFAULT_NAVBAR_HEIGHT = 76;

/* Small helper to join class names */
const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ── NavLink ──
   Defined at module level (not inside Sidebar) so React doesn't remount every
   link on each render, which would restart the burst / blink animations.
   `badge` is an optional count. 0/undefined renders nothing. */
function NavLink({ to, icon: Icon, children, badge = 0, isDefault = false, collapsed, location, onNavigate }) {
  const [toPath, toQuery] = to.split('?');
  const currentQuery = location.search.replace('?', '');

  // The first item also counts as active when no ?tab= is present
  const isActive =
    location.pathname === toPath &&
    (currentQuery === toQuery || (isDefault && !currentQuery));

  const hasBadge = badge > 0;
  const badgeLabel = badge > 9 ? '9+' : String(badge);

  return (
    <Link
      to={to}
      data-active={isActive}
      onClick={onNavigate}
      title={collapsed ? String(children) : undefined}
      className={cx(
        // base
        'group relative flex items-center gap-3 overflow-visible rounded-xl text-sm font-medium',
        'transition-all duration-200',
        // press ripple
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-white",
        "after:opacity-0 after:transition-opacity after:duration-100 after:content-[''] active:after:opacity-[0.07]",
        // spacing
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        // state
        isActive
          ? [
              'bg-gradient-to-br from-green-600 to-green-700 text-white',
              'shadow-[0_4px_14px_rgba(22,163,74,0.35)] ring-1 ring-inset ring-green-600/40',
              'dark:from-green-600/40 dark:to-green-700/30 dark:ring-green-400/40',
              'dark:shadow-[0_4px_16px_rgba(22,163,74,0.25)]',
            ].join(' ')
          : [
              'text-gray-700 hover:bg-green-100 hover:text-green-700',
              'dark:text-white/55 dark:hover:bg-green-600/10 dark:hover:text-green-300',
            ].join(' ')
      )}
    >
      {isActive && (
        <>
          <span className="pointer-events-none absolute inset-0 z-0 rounded-xl border-[1.5px] border-green-600/60 motion-reduce:animate-none animate-nav-burst dark:border-green-400/50" />
          <span className="pointer-events-none absolute inset-0 z-0 rounded-xl border-[1.5px] border-green-600/60 motion-reduce:animate-none animate-nav-burst [animation-delay:1s] dark:border-green-400/50" />
        </>
      )}

      <span
        className={cx(
          'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
          isActive
            ? [
                'border-white/30 bg-white/25 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]',
                'dark:border-green-400/40 dark:bg-gradient-to-br dark:from-green-600/60 dark:to-green-700/50',
                'dark:shadow-[0_0_10px_rgba(74,222,128,0.3)]',
              ].join(' ')
            : [
                'border-emerald-100 bg-green-50 text-gray-500 group-hover:scale-105',
                'group-hover:border-green-300 group-hover:bg-green-200 group-hover:text-green-700',
                'dark:border-white/10 dark:bg-white/5 dark:text-white/35',
                'dark:group-hover:border-green-600/40 dark:group-hover:bg-green-600/20 dark:group-hover:text-green-400',
              ].join(' ')
        )}
      >
        <Icon className="relative z-10 h-4 w-4" />

        {collapsed && hasBadge && (
          <span className="absolute -right-1 -top-1 z-[2] flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-green-950">
            {badgeLabel}
          </span>
        )}
      </span>

      {!collapsed && (
        <span className="relative z-10 truncate">{children}</span>
      )}

      {!collapsed && hasBadge && (
        <span
          className={cx(
            'relative z-10 ml-auto flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
            isActive
              ? 'bg-white text-red-700 ring-2 ring-white/60'
              : 'bg-red-500 text-white ring-2 ring-white/40'
          )}
        >
          {badgeLabel}
        </span>
      )}

      {!collapsed && !hasBadge && isActive && (
        <span className="relative z-10 ml-auto flex-shrink-0">
          <span className="block h-[7px] w-[7px] animate-pulse rounded-full bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.6)] motion-reduce:animate-none dark:bg-green-400 dark:shadow-[0_0_6px_2px_rgba(74,222,128,0.6)]" />
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ chatUnreadCount = 0 }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.theme);

  const [navbarHeight, setNavbarHeight] = useState(DEFAULT_NAVBAR_HEIGHT);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true
  );
  const scrollRef = useRef(null);

  /* ── Track desktop/mobile reactively ── */
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  /* ── Keep navbar height in sync ──
     Uses the navbar's real bottom edge, watches it with ResizeObserver, and
     re-measures when the drawer opens. */
  useLayoutEffect(() => {
    const navbar = document.querySelector('.navbar-container');
    if (!navbar) return undefined;

    const update = () => {
      const bottom = Math.ceil(navbar.getBoundingClientRect().bottom);
      const next = bottom > 0 ? bottom : navbar.offsetHeight;
      if (next > 0) setNavbarHeight((prev) => (prev === next ? prev : next));
    };

    update();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(navbar);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [sidebarOpen]);

  /* ── Scroll active link into view ──
     scrollIntoView() scrolls every ancestor, including the overflow-hidden
     <aside>, which hides the first item on mobile. Scroll only the nav. */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (!isDesktop && !sidebarOpen) return;

    const active = container.querySelector('[data-active="true"]');
    if (!active) {
      container.scrollTop = 0;
      return;
    }

    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    if (cRect.height === 0) return;

    const pad = 8;
    if (aRect.top < cRect.top + pad) {
      container.scrollTo({
        top: Math.max(0, container.scrollTop - (cRect.top + pad - aRect.top)),
        behavior: 'smooth',
      });
    } else if (aRect.bottom > cRect.bottom - pad) {
      container.scrollTo({
        top: container.scrollTop + (aRect.bottom - (cRect.bottom - pad)),
        behavior: 'smooth',
      });
    }
  }, [location.pathname, location.search, sidebarOpen, isDesktop]);

  /* ── Always start the list at the top when the drawer opens ── */
  useEffect(() => {
    if (sidebarOpen && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [sidebarOpen]);

  const role     = currentUser?.role;
  const basePath = DASHBOARD_BY_ROLE[role];
  const items    = useMemo(() => NAV_BY_ROLE[role] ?? [], [role]);

  const closeSidebar    = () => dispatch(setSidebarOpen(false));
  const toggleCollapsed = () => dispatch(toggleSidebarCollapsed());

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ── Always fixed; never relative ──
          top/height depend on the measured navbar, so they stay inline. */}
      <aside
        style={{
          top: `${navbarHeight}px`,
          height: `calc(100dvh - ${navbarHeight}px)`,
        }}
        className={cx(
          'fixed left-0 z-[45] flex-col overflow-hidden transition-[width] duration-300 ease-in-out',
          // hidden on mobile until opened; always visible from md up
          sidebarOpen ? 'flex' : 'hidden md:flex',
          sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* Background layer */}
        <div className="absolute inset-0 border-r border-green-200 bg-gradient-to-b from-white to-green-50 dark:border-green-600/25 dark:from-neutral-950 dark:to-green-950" />

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cx(
            'relative z-20 mx-auto mb-1 mt-3 hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition-all duration-200 md:flex',
            'border-green-300 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700',
            'dark:border-green-600/30 dark:bg-green-600/10 dark:text-green-400',
            'dark:hover:bg-green-600/20 dark:hover:text-green-300'
          )}
        >
          <HiMenu className="h-4 w-4" />
        </button>

        {/* Scrollable nav — only this element scrolls.
            min-h-0 lets a flex child shrink below its content height;
            without it the nav overflows the aside and the top gets clipped. */}
        <nav
          ref={scrollRef}
          className={cx(
            'relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-8 pt-4',
            '[-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            sidebarCollapsed ? 'px-2' : 'px-3'
          )}
        >
          <div className="space-y-0.5">
            {basePath && items.map((item, i) => (
              <NavLink
                key={item.tab}
                to={`${basePath}?tab=${item.tab}`}
                icon={item.icon}
                badge={item.badge === 'chat' ? chatUnreadCount : 0}
                isDefault={i === 0}
                collapsed={sidebarCollapsed}
                location={location}
                onNavigate={closeSidebar}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom fade */}
        <div className="pointer-events-none relative z-10 -mt-8 h-8 flex-shrink-0 bg-gradient-to-t from-green-50 to-transparent dark:from-green-950" />
      </aside>
    </>
  );
}