"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import type { SessionUser } from "@/lib/session";

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

type ShellData = {
  settings?: {
    guesthouseName?: string;
  };
  activity?: {
    pendingReservations?: number;
  };
};

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guesthouseName, setGuesthouseName] = useState(
    "HavenStay Guest House",
  );
  const [pendingReservations, setPendingReservations] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadShellData() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = (await response.json()) as ShellData;

        if (cancelled) return;

        if (result.settings?.guesthouseName) {
          setGuesthouseName(result.settings.guesthouseName);
        }

        setPendingReservations(result.activity?.pendingReservations ?? 0);
      } catch {
        // Keep the default shell values when live data is unavailable.
      }
    }

    if (user) {
      loadShellData();
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return <>{children}</>;
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

  function navigate(href: string) {
    setSidebarOpen(false);
    router.push(href);
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={23} />
          </div>
          <div className="brand-copy">
            <strong>HavenStay</strong>
            <span>GUESTHOUSE MANAGER</span>
          </div>
          <button
            className="icon-button sidebar-close"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-caption">WORKSPACE</div>

        <nav className="main-nav">
          {visibleNavigation.map(({ label, href }) => {
            const Icon = iconByHref[href];

            return (
              <button
                key={label}
                className={`nav-item ${activePage === label ? "active" : ""}`}
                onClick={() => navigate(href)}
              >
                <Icon size={19} />
                <span>{label}</span>
                {label === "Reservations" && pendingReservations > 0 && (
                  <span className="nav-count">{pendingReservations}</span>
                )}
              </button>
            );
          })}
        </nav>

        {canViewSettings && (
          <>
            <div className="nav-caption management-caption">PREFERENCES</div>

            <button
              className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
              onClick={() => navigate(settingsNavItem.href)}
            >
              <Settings size={19} />
              <span>Settings</span>
            </button>
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
            onClick={() => setSidebarOpen(true)}
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
              <button
                className="property-selector"
                onClick={() => navigate(settingsNavItem.href)}
                title="Manage guesthouse settings"
              >
                <Building2 size={17} />
                <span>{guesthouseName}</span>
                <ChevronDown size={15} />
              </button>
            ) : (
              <div className="property-selector">
                <Building2 size={17} />
                <span>{guesthouseName}</span>
              </div>
            )}
            <button
              className="icon-button notification-button"
              aria-label="View pending reservations"
              onClick={() => navigate("/reservations")}
              title="Pending reservations"
            >
              <Bell size={19} />
              {pendingReservations > 0 && (
                <span className="notification-dot" />
              )}
            </button>
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
