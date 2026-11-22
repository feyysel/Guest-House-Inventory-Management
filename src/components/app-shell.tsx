"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarCheck,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  BedDouble,
  Menu,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import {
  can,
  navigation,
  roleLabels,
  settingsNavItem,
} from "@/lib/permissions";
import ThemeToggle from "@/components/theme-toggle";
import { setSidebarOpen, useAppDispatch, useAppSelector } from "@/store";

const iconByHref: Record<string, typeof LayoutDashboard> = {
  "/": LayoutDashboard,
  "/rooms": BedDouble,
  "/reservations": CalendarCheck,
  "/guests": Users,
  "/payments": CircleDollarSign,
  "/reports": ClipboardList,
  "/users": ShieldCheck,
  "/settings": Settings,
};

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const guesthouseName = useAppSelector(
    (state) => state.ui.guesthouseName
  );
  const pendingReservations = useAppSelector(
    (state) => state.ui.pendingReservations
  );

  const isAuthPage = pathname === "/login" || pathname === "/unauthorized";

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {

    return (
      <div className="app-shell">
        {sidebarOpen && (
          <button
            className="mobile-overlay"
            aria-label="Close navigation"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="brand">
            <div className="brand-icon">
              <Building2 size={23} />
            </div>
            <div className="brand-copy">
              <strong>{guesthouseName}</strong>
              <span className="skeleton-block skeleton-brand-role" />
            </div>
            <button
              className="icon-button sidebar-close"
              aria-label="Close menu"
              onClick={() => dispatch(setSidebarOpen(false))}
            >
              <X size={20} />
            </button>
          </div>

          <div className="nav-caption">WORKSPACE</div>

          <div className="skeleton-nav">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`nav-skeleton-${index}`}
                className="skeleton-block skeleton-nav-item"
              />
            ))}
          </div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => dispatch(setSidebarOpen(true))}
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <span className="skeleton-block skeleton-crumb" />
            </div>

            <div className="topbar-actions">
              <span className="skeleton-block skeleton-action" />
              <ThemeToggle />
              <span className="skeleton-block skeleton-avatar" />
            </div>
          </header>

          {children}
        </main>
      </div>
    );
  }

  const visibleNavigation = navigation.filter((item) =>
    can(user.role, item.permission)
  );
  const canViewSettings = can(user.role, settingsNavItem.permission);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activePage =
    [...visibleNavigation, ...(canViewSettings ? [settingsNavItem] : [])].find(
      (item) =>
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? "Dashboard";

  function closeSidebar() {
    dispatch(setSidebarOpen(false));
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={23} />
          </div>
          <div className="brand-copy">
            <strong>{guesthouseName}</strong>
            <span>{roleLabels[user.role].toUpperCase()}</span>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close menu"
            onClick={() => dispatch(setSidebarOpen(false))}
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-caption">WORKSPACE</div>

        <nav className="main-nav">
          {visibleNavigation.map(({ label, href }) => {
            const Icon = iconByHref[href];

            return (
              <Link
                key={label}
                href={href}
                prefetch
                className={`nav-item ${activePage === label ? "active" : ""}`}
                onNavigate={closeSidebar}
              >
                <Icon size={19} />
                <span>{label}</span>
                {label === "Reservations" && pendingReservations > 0 && (
                  <span className="nav-count">{pendingReservations}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {canViewSettings && (
          <>
            <div className="nav-caption management-caption">PREFERENCES</div>

            <Link
              href={settingsNavItem.href}
              prefetch
              className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
              onNavigate={closeSidebar}
            >
              <Settings size={19} />
              <span>Settings</span>
            </Link>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Building2 size={19} />
            </div>
            <strong>{guesthouseName}</strong>
            <p>Manage your rooms, guests, bookings, and payments.</p>
          </div>

          <div className="user-profile">
            <div className="avatar admin-avatar">{initials}</div>
            <div className="user-details">
              <strong>{user.name}</strong>
              <span>{roleLabels[user.role]}</span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="icon-button"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => dispatch(setSidebarOpen(true))}
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            {canViewSettings ? (
              <Link
                href={settingsNavItem.href}
                prefetch
                className="property-selector"
                title="Manage guesthouse settings"
              >
                <Building2 size={17} />
                <span>{guesthouseName}</span>
                <ChevronDown size={15} />
              </Link>
            ) : (
              <div className="property-selector">
                <Building2 size={17} />
                <span>{guesthouseName}</span>
              </div>
            )}
            <ThemeToggle />
            <Link
              href="/reservations"
              prefetch
              className="icon-button notification-button"
              aria-label="View pending reservations"
              title="Pending reservations"
            >
              <Bell size={19} />
              {pendingReservations > 0 && (
                <span className="notification-dot" />
              )}
            </Link>
            <span className="topbar-role">
              {roleLabels[user.role].toUpperCase()}
            </span>
            <div className="avatar top-avatar" title={roleLabels[user.role]}>
              {initials}
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
