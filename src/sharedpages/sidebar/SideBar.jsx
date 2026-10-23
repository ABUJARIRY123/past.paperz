import React, { useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  HiOutlineUserGroup, HiAnnotation, HiChartPie, HiBadgeCheck,
  HiArchive, HiPencilAlt, HiStatusOnline,HiCog ,
  HiCurrencyDollar , HiAcademicCap, HiOutlineBookOpen, HiMenu,HiCheckCircle ,
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
  { tab: 'papers', label: 'Papers', icon: HiOutlineBookOpen },
  { tab: 'favourites',  label: 'Favourites',       icon: HiCheckCircle  },
    { tab: 'diamonds',  label: 'Diamonds',       icon: HiCurrencyDollar  },
      { tab: 'requests',  label: 'Requests',     icon: HiStatusOnline },


  // { tab: 'chats',  label: 'Chats',       icon: HiAnnotation, badge: 'chat' },
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
  { tab: 'overview',  label: 'Overview',     icon: HiChartPie },
  { tab: 'users',     label: 'Users',        icon: HiOutlineUserGroup },
  { tab: 'papers',    label: 'Manage Papers', icon: HiPencilAlt },
    { tab: 'favourites',  label: 'Favourites',       icon: HiCheckCircle  },
  { tab: 'payments',  label: 'Payments',     icon: HiCurrencyDollar  },
  { tab: 'chats',     label: 'Chats',        icon: HiAnnotation, badge: 'chat' },
  { tab: 'documentsrepo', label: 'Documents',    icon: HiOutlineShieldCheck },
  { tab: 'requests',  label: 'Requests',     icon: HiStatusOnline },
];

const NAV_BY_ROLE = {
  free:     FREE_ITEMS,
  member:   MEMBER_ITEMS,
  premium:  PREMIUM_ITEMS,
  sysadmin: SYSADMIN_ITEMS,
};

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
      className={`
        nav-link group flex items-center gap-3 rounded-xl text-sm font-medium
        transition-all duration-200 relative overflow-visible
        ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
        ${isActive ? 'nav-link-active' : 'nav-link-idle'}
      `}
    >
      {isActive && (
        <>
          <span className="nav-burst-ring" />
          <span className="nav-burst-ring nav-burst-ring--delay" />
        </>
      )}

      <span className={`
        relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
        ${isActive ? 'nav-icon-active' : 'nav-icon-idle group-hover:scale-105'}
      `}>
        <Icon className="w-4 h-4 relative z-10" />

        {collapsed && hasBadge && (
          <span className="nav-badge-dot">{badgeLabel}</span>
        )}
      </span>

      {!collapsed && (
        <span className="truncate relative z-10">{children}</span>
      )}

      {!collapsed && hasBadge && (
        <span className="ml-auto flex-shrink-0 relative z-10 nav-badge-pill">
          {badgeLabel}
        </span>
      )}

      {!collapsed && !hasBadge && isActive && (
        <span className="ml-auto flex-shrink-0 relative z-10">
          <span className="nav-blink-dot" />
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ chatUnreadCount = 0 }) {
  const dispatch   = useDispatch();
  const location   = useLocation();
  const { currentUser } = useSelector((state) => state.user);
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.theme);

  const [navbarHeight, setNavbarHeight] = React.useState(76);
  const scrollRef = useRef(null);

  /* ── Keep navbar height in sync ── */
  useEffect(() => {
    const update = () => {
      const navbar = document.querySelector('.navbar-container');
      if (navbar) setNavbarHeight(navbar.offsetHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── Scroll active link into view ── */
  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname, location.search]);

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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ── Always fixed; never relative ── */}
      <aside
        style={{
          position: 'fixed',
          top: `${navbarHeight}px`,
          left: 0,
          height: `calc(100dvh - ${navbarHeight}px)`,
          width: sidebarCollapsed ? '68px' : '240px',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          transform: sidebarOpen || window.innerWidth >= 768 ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'width 300ms ease-in-out, transform 300ms ease-in-out',
          overflow: 'hidden',
        }}
        className={`sidebar-root ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        {/* Background layer */}
        <div className="absolute inset-0 sidebar-bg border-r sidebar-border" />

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            relative z-20 hidden md:flex items-center justify-center
            mx-auto mt-3 mb-1 w-9 h-9 rounded-xl
            collapse-btn transition-all duration-200
          "
        >
          <HiMenu className="w-4 h-4" />
        </button>

        {/* Scrollable nav — only this element scrolls */}
        <nav
          ref={scrollRef}
          className="mt-4 relative z-10 flex-1 sidebar-scroll"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            padding: sidebarCollapsed ? '0 8px' : '0 12px',
            paddingBottom: '24px',
            overscrollBehavior: 'contain',
          }}
        >
          <div className="space-y-0.5 pt-2">
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
        <div className="relative z-10 h-8 sidebar-fade-bottom pointer-events-none -mt-8" />
      </aside>

      <style>{`
        /* ── Mobile: hide by default, show when open ── */
        .sidebar-closed { display: none; }
        .sidebar-open   { display: flex; }

        @media (min-width: 768px) {
          .sidebar-closed { display: flex; }
        }

        /* ── Sidebar background ── */
        .sidebar-bg {
          background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
        }
        .sidebar-border  { border-color: #bbf7d0; }
        .section-label   { color: #16a34a; }
        .collapse-btn {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #86efac;
        }
        .collapse-btn:hover {
          background: #dcfce7;
          color: #15803d;
        }
        .sidebar-fade-bottom {
          background: linear-gradient(to top, #f0fdf4, transparent);
        }

        /* ── Nav link idle ── */
        .nav-link-idle       { color: #374151; }
        .nav-link-idle:hover { background: #dcfce7; color: #15803d; }
        .nav-icon-idle {
          background: #f0fdf4;
          color: #6b7280;
          border: 1px solid #d1fae5;
        }
        .nav-link-idle:hover .nav-icon-idle {
          background: #bbf7d0;
          color: #15803d;
          border-color: #86efac;
        }

        /* ── Nav link active ── */
        .nav-link-active {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(22,163,74,0.35), 0 0 0 1px rgba(22,163,74,0.4) inset;
        }
        .nav-icon-active {
          background: rgba(255,255,255,0.25);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 10px rgba(255,255,255,0.2);
        }

        /* ── Unread badge — pill (expanded) ── */
        .nav-badge-pill {
          height: 20px;
          min-width: 20px;
          padding: 0 6px;
          border-radius: 9999px;
          background: #ef4444;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
        }
        .nav-link-active .nav-badge-pill {
          background: #ffffff;
          color: #b91c1c;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.6);
        }

        /* ── Unread badge — dot (collapsed, sits on the icon corner) ── */
        .nav-badge-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          height: 15px;
          min-width: 15px;
          padding: 0 3px;
          border-radius: 9999px;
          background: #ef4444;
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 2px #ffffff;
          z-index: 2;
        }
        .dark .nav-badge-dot { box-shadow: 0 0 0 2px #052e16; }

        /* ── Dark mode ── */
        .dark .sidebar-bg {
          background: linear-gradient(180deg, #0a0a0a 0%, #052e16 100%);
        }
        .dark .sidebar-border       { border-color: rgba(22,163,74,0.25); }
        .dark .section-label        { color: #4ade80; }
        .dark .collapse-btn {
          background: rgba(22,163,74,0.1);
          color: #4ade80;
          border-color: rgba(22,163,74,0.3);
        }
        .dark .collapse-btn:hover {
          background: rgba(22,163,74,0.2);
          color: #86efac;
        }
        .dark .sidebar-fade-bottom {
          background: linear-gradient(to top, #052e16, transparent);
        }
        .dark .nav-link-idle        { color: rgba(255,255,255,0.55); }
        .dark .nav-link-idle:hover  { background: rgba(22,163,74,0.12); color: #86efac; }
        .dark .nav-icon-idle {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.35);
          border-color: rgba(255,255,255,0.08);
        }
        .dark .nav-link-idle:hover .nav-icon-idle {
          background: rgba(22,163,74,0.2);
          color: #4ade80;
          border-color: rgba(22,163,74,0.4);
        }
        .dark .nav-link-active {
          background: linear-gradient(135deg, rgba(22,163,74,0.4) 0%, rgba(21,128,61,0.3) 100%);
          color: #ffffff;
          box-shadow: 0 0 0 1px rgba(74,222,128,0.4) inset, 0 4px 16px rgba(22,163,74,0.25);
        }
        .dark .nav-icon-active {
          background: linear-gradient(135deg, rgba(22,163,74,0.6), rgba(21,128,61,0.5));
          color: #ffffff;
          border-color: rgba(74,222,128,0.4);
          box-shadow: 0 0 10px rgba(74,222,128,0.3);
        }

        /* ── Scrollbar ── */
        .sidebar-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .sidebar-scroll::-webkit-scrollbar { display: none; }

        /* ── Burst rings ── */
        .nav-burst-ring {
          position: absolute;
          inset: 0;
          border-radius: 0.75rem;
          border: 1.5px solid rgba(22,163,74,0.6);
          animation: nav-burst 2s ease-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .dark .nav-burst-ring { border-color: rgba(74,222,128,0.5); }
        .nav-burst-ring--delay { animation-delay: 1s; }
        @keyframes nav-burst {
          0%   { transform: scale(1);    opacity: 0.7; }
          70%  { transform: scale(1.07); opacity: 0; }
          100% { transform: scale(1.07); opacity: 0; }
        }

        /* ── Blinking dot ── */
        .nav-blink-dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 6px 2px rgba(255,255,255,0.6);
          animation: nav-blink 1.4s ease-in-out infinite;
        }
        .dark .nav-blink-dot {
          background: #4ade80;
          box-shadow: 0 0 6px 2px rgba(74,222,128,0.6);
        }
        @keyframes nav-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }

        /* ── Press ripple ── */
        .nav-link::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: white;
          opacity: 0;
          transition: opacity 0.12s;
          pointer-events: none;
        }
        .nav-link:active::after { opacity: 0.07; }
      `}</style>
    </>
  );
}