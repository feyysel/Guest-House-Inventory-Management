
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BedDouble,
  Bell,
  CalendarDays,
  CalendarCheck,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
  ArrowUpRight,
  Plus,
  MoreHorizontal,
  Building2,
  CheckCircle2,
} from "lucide-react";

type RoomStats = {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  inactive?: number;
};

type DashboardData = {
  date: string;
  settings: {
    guesthouseName: string;
    currency: string;
  };
  roomStats: RoomStats;
  activity: {
    arrivals: number;
    departures: number;
    pendingReservations: number;
  };
  todayRevenue: number;
  rooms: {
    id: string;
    roomNumber: string;
    name: string | null;
    type: string;
    status: string;
    pricePerNight: number;
  }[];
  recentReservations: {
    id: string;
    bookingCode: string;
    guest: string;
    room: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
};

type Props = {
  roomStats: RoomStats;
};

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Rooms", icon: BedDouble, href: "/rooms" },
  { label: "Reservations", icon: CalendarCheck, href: "/reservations" },
  { label: "Guests", icon: Users, href: "/guests" },
  { label: "Payments", icon: CircleDollarSign, href: "/payments" },
  { label: "Reports", icon: ClipboardList, href: "/reports" },
];

function getStatusLabel(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string) {
  return status.toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date(date));
}

function formatStay(checkIn: string, checkOut: string) {
  return `${formatDate(checkIn)} – ${formatDate(checkOut)}`;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Africa/Addis_Ababa",
    }).format(new Date()),
  );

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date());
}

export default function DashboardClient({ roomStats }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load dashboard.");
        }

        if (!cancelled) {
          setData(result as DashboardData);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.roomStats ?? roomStats;
  const currency = data?.settings.currency ?? "ETB";
  const guesthouseName =
    data?.settings.guesthouseName ?? "HavenStay Guest House";

  const occupancyPercent =
    stats.total > 0
      ? Math.round((stats.occupied / stats.total) * 1000) / 10
      : 0;

  const activePage =
    navigation.find((item) => item.href === pathname)?.label ??
    (pathname === "/settings" ? "Settings" : "Dashboard");

  const filteredReservations = useMemo(() => {
    const reservations = data?.recentReservations ?? [];
    const term = searchTerm.trim().toLowerCase();

    if (!term) return reservations;

    return reservations.filter((reservation) =>
      [
        reservation.guest,
        reservation.room,
        reservation.status,
        reservation.bookingCode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data, searchTerm]);

  const cards = [
    {
      label: "Total rooms",
      value: stats.total,
      detail: "Registered rooms",
      icon: BedDouble,
      color: "blue",
    },
    {
      label: "Available rooms",
      value: stats.available,
      detail: "Marked available",
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Occupied rooms",
      value: stats.occupied,
      detail: "Currently occupied",
      icon: Users,
      color: "purple",
    },
    {
      label: "Today's revenue",
      value: formatMoney(data?.todayRevenue ?? 0, currency),
      detail: "Completed payments today",
      icon: CircleDollarSign,
      color: "orange",
    },
  ];

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
          {navigation.map(({ label, icon: Icon, href }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => navigate(href)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Reservations" &&
                (data?.activity.pendingReservations ?? 0) > 0 && (
                  <span className="nav-count">
                    {data?.activity.pendingReservations}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="nav-caption management-caption">PREFERENCES</div>

        <button
          className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Building2 size={19} />
            </div>
            <strong>{guesthouseName}</strong>
            <p>Manage your rooms, guests, bookings, and payments.</p>
          </div>

          <div className="user-profile">
            <div className="avatar admin-avatar">AD</div>
            <div className="user-details">
              <strong>Administrator</strong>
              <span>Property manager</span>
            </div>
            <MoreHorizontal size={20} className="muted-icon" />
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
            <button
              className="property-selector"
              onClick={() => navigate("/settings")}
              title="Manage guesthouse settings"
            >
              <Building2 size={17} />
              <span>{guesthouseName}</span>
              <ChevronDown size={15} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="View pending reservations"
              onClick={() => navigate("/reservations")}
              title="Pending reservations"
            >
              <Bell size={19} />
              {(data?.activity.pendingReservations ?? 0) > 0 && (
                <span className="notification-dot" />
              )}
            </button>
            <div className="avatar top-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error} Dashboard values may be incomplete until data loads.
              <button
                className="ml-2 font-semibold underline"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                GUESTHOUSE OVERVIEW
              </div>
              <h1>{getGreeting()}, Administrator</h1>
              <p>Here&apos;s what&apos;s happening at {guesthouseName} today.</p>
            </div>

            <div className="welcome-actions">
              <button className="button button-secondary">
                <CalendarDays size={17} />
                {getTodayLabel()}
              </button>
              <button
                className="button button-primary"
                onClick={() => navigate("/reservations")}
              >
                <Plus size={18} />
                New reservation
              </button>
            </div>
          </section>

          {loading && !data && (
            <div className="mb-4 text-sm text-gray-500">
              Loading live dashboard data...
            </div>
          )}

          <section className="stats-grid">
            {cards.map(({ label, value, detail, icon: Icon, color }) => (
              <article className="stat-card" key={label}>
                <div className="stat-top">
                  <span className={`stat-icon ${color}`}>
                    <Icon size={20} />
                  </span>
                  <button
                    className="icon-button small-more"
                    aria-label={`${label} options`}
                    onClick={() =>
                      navigate(
                        label.includes("revenue") ? "/payments" : "/rooms",
                      )
                    }
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <p className="stat-label">{label}</p>
                <div className="stat-value">{value}</div>
                <div className="stat-detail">
                  <span className="detail-dot" />
                  {detail}
                </div>
              </article>
            ))}
          </section>

          <section className="activity-grid">
            <article className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <h2>Today&apos;s activity</h2>
                  <p>Arrival and departure overview</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("/reservations")}
                >
                  View bookings <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="activity-list">
                <div className="activity-row">
                  <div className="activity-icon arrival">
                    <LogIn size={19} />
                  </div>
                  <div className="activity-copy">
                    <strong>Expected check-ins</strong>
                    <span>Reservations arriving today</span>
                  </div>
                  <div className="activity-number">
                    {data?.activity.arrivals ?? 0}
                  </div>
                </div>

                <div className="activity-row">
                  <div className="activity-icon departure">
                    <LogOut size={19} />
                  </div>
                  <div className="activity-copy">
                    <strong>Expected check-outs</strong>
                    <span>Reservations departing today</span>
                  </div>
                  <div className="activity-number">
                    {data?.activity.departures ?? 0}
                  </div>
                </div>

                <div className="activity-row">
                  <div className="activity-icon pending">
                    <Clock3 size={19} />
                  </div>
                  <div className="activity-copy">
                    <strong>Pending reservations</strong>
                    <span>Awaiting confirmation</span>
                  </div>
                  <div className="activity-number">
                    {data?.activity.pendingReservations ?? 0}
                  </div>
                </div>
              </div>
            </article>

            <article className="panel room-summary">
              <div className="panel-header">
                <div>
                  <h2>Room availability</h2>
                  <p>Current room status</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="View rooms"
                  onClick={() => navigate("/rooms")}
                >
                  <ArrowUpRight size={19} />
                </button>
              </div>

              <div className="occupancy-summary">
                <div>
                  <div className="occupancy-number">{occupancyPercent}%</div>
                  <span>
                    {stats.occupied} of {stats.total} rooms occupied
                  </span>
                </div>
                <div className="occupancy-ring">
                  <span>{occupancyPercent}%</span>
                </div>
              </div>

              <div className="occupancy-bar">
                <span style={{ width: `${occupancyPercent}%` }} />
              </div>

              <div className="legend">
                <span>
                  <i className="legend-green" /> Available <b>{stats.available}</b>
                </span>
                <span>
                  <i className="legend-blue" /> Occupied <b>{stats.occupied}</b>
                </span>
                <span>
                  <i className="legend-orange" /> Maintenance{" "}
                  <b>{stats.maintenance}</b>
                </span>
              </div>
            </article>
          </section>

          <section className="panel reservations-panel">
            <div className="panel-header reservation-heading">
              <div>
                <h2>Recent reservations</h2>
                <p>Latest guest bookings from your database</p>
              </div>
              <div className="reservation-tools">
                <label className="search-box">
                  <Search size={17} />
                  <input
                    aria-label="Search reservations"
                    placeholder="Search guests..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>
                <button
                  className="button button-secondary view-all"
                  onClick={() => navigate("/reservations")}
                >
                  View all
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th>GUEST</th>
                    <th>ROOM</th>
                    <th>STAY DATES</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>
                        <div className="guest-cell">
                          <div className="avatar guest-avatar">
                            {getInitials(reservation.guest)}
                          </div>
                          <strong>{reservation.guest}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="room-number">{reservation.room}</span>
                      </td>
                      <td className="date-cell">
                        {formatStay(reservation.checkIn, reservation.checkOut)}
                      </td>
                      <td className="amount-cell">
                        {formatMoney(reservation.amount, currency)}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(reservation.status)}`}
                        >
                          <i />
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-button row-action"
                          aria-label={`View reservation ${reservation.bookingCode}`}
                          onClick={() => navigate("/reservations")}
                        >
                          <MoreHorizontal size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        {searchTerm
                          ? "No reservations match your search."
                          : "No reservations have been recorded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="panel-footer">
              Showing {filteredReservations.length} of{" "}
              {data?.recentReservations.length ?? 0} recent reservations
              <button
                className="text-button"
                onClick={() => navigate("/reservations")}
              >
                Manage reservations <ArrowUpRight size={15} />
              </button>
            </div>
          </section>

          <section className="panel room-list-panel">
            <div className="panel-header">
              <div>
                <h2>Room overview</h2>
                <p>Room records from your database</p>
              </div>
              <button
                className="text-button"
                onClick={() => navigate("/rooms")}
              >
                All rooms <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="room-grid">
              {(data?.rooms ?? []).slice(0, 8).map((room) => (
                <div className="room-tile" key={room.id}>
                  <div className="room-tile-top">
                    <BedDouble size={19} />
                    <span>Room {room.roomNumber}</span>
                  </div>
                  <strong>
                    {room.name || getStatusLabel(room.type)}
                  </strong>
                  <span
                    className={`room-status ${getStatusClass(room.status)}`}
                  >
                    <i />
                    {getStatusLabel(room.status)}
                  </span>
                </div>
              ))}

              {!loading && (data?.rooms.length ?? 0) === 0 && (
                <p className="empty-state">No rooms have been added yet.</p>
              )}
            </div>
          </section>

          <footer className="page-footer">
            <span>{guesthouseName}</span>
            <span>Guesthouse operations, made simpler.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
