"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Wrench,
  X,
  ArrowUpRight,
  Plus,
  MoreHorizontal,
  Building2,
  CheckCircle2,
  Icon,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Rooms", icon: BedDouble },
  { label: "Reservations", icon: CalendarCheck },
  { label: "Guests", icon: Users },
  { label: "Payments", icon: CircleDollarSign },
  { label: "Reports", icon: ClipboardList },
];

const reservations = [
  {
    guest: "Abebe Bekele",
    initials: "AB",
    room: "101",
    dates: "Oct 23 – Oct 25",
    amount: "ETB 3,000",
    status: "Checked in",
  },
  {
    guest: "Hana Mohammed",
    initials: "HM",
    room: "204",
    dates: "Oct 23 – Oct 24",
    amount: "ETB 1,500",
    status: "Confirmed",
  },
  {
    guest: "Dawit Tesfaye",
    initials: "DT",
    room: "105",
    dates: "Oct 24 – Oct 27",
    amount: "ETB 4,500",
    status: "Pending",
  },
  {
    guest: "Mekdes Alemu",
    initials: "MA",
    room: "302",
    dates: "Oct 24 – Oct 26",
    amount: "ETB 3,200",
    status: "Confirmed",
  },
];

const roomData = [
  { number: "101", type: "Standard", status: "Occupied" },
  { number: "102", type: "Standard", status: "Available" },
  { number: "103", type: "Deluxe", status: "Available" },
  { number: "104", type: "Standard", status: "Cleaning" },
  { number: "201", type: "Deluxe", status: "Occupied" },
  { number: "202", type: "Suite", status: "Available" },
];

type DashboardClientProps = {
  roomStats: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
};

export default function DashboardClient({ roomStats }: DashboardClientProps) {
    const router = useRouter();
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const occupancyPercent =
    roomStats.total > 0
      ? Math.round((roomStats.occupied / roomStats.total) * 1000) / 10
      : 0;

  const filteredReservations = reservations.filter((reservation) =>
    `${reservation.guest} ${reservation.room} ${reservation.status}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      label: "Total rooms",
      value: roomStats.total,
      detail: "Across all room types",
      icon: BedDouble,
      color: "blue",
    },
    {
      label: "Available rooms",
      value: roomStats.available,
      detail: "Ready for new guests",
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Occupied rooms",
      value: roomStats.occupied,
      detail: "Currently hosting guests",
      icon: Users,
      color: "purple",
    },
    {
      label: "Today's revenue",
      value: "ETB 12,450",
      detail: "Illustrative sample amount",
      icon: CircleDollarSign,
      color: "orange",
    },
  ];

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
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              

onClick={() => {
  setSidebarOpen(false);

  switch (label) {
    case "Rooms":
      router.push("/rooms");
      break;

    case "Reservations":
      router.push("/reservations");
      break;

    case "Guests":
      router.push("/guests");
      break;

    case "Dashboard":
      router.push("/");
      break;

    default:
      setActivePage(label);
      break;
  }
}}


            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Reservations" && (
                <span className="nav-count">4</span>
              )}
            </button>
          ))}
        </nav>

        <div className="nav-caption management-caption">PREFERENCES</div>

        <button
          className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => {
            setActivePage("Settings");
            setSidebarOpen(false);
          }}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Building2 size={19} />
            </div>
            <strong>Your guesthouse</strong>
            <p>Everything you need to manage your daily operations.</p>
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
            <div className="property-selector">
              <Building2 size={17} />
              <span>My Guesthouse</span>
              <ChevronDown size={15} />
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <div className="avatar top-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Dashboard" ? (
            <>
              <section className="welcome-section">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-dot" />
                    GUESTHOUSE OVERVIEW
                  </div>
                  <h1>Good morning, Administrator</h1>
                  <p>
                    Here&apos;s what&apos;s happening at your guesthouse today.
                  </p>
                </div>

                <div className="welcome-actions">
                  <button className="button button-secondary">
                    <CalendarDays size={17} />
                    October 23, 2026
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => router.push("/reservations")}
                  >
                    <Plus size={18} />
                    New reservation
                  </button>
                </div>
              </section>

              <section className="stats-grid">
                {stats.map(({ label, value, detail, icon: Icon, color }) => (
                  <article className="stat-card" key={label}>
                    <div className="stat-top">
                      <span className={`stat-icon ${color}`}>
                        <Icon size={20} />
                      </span>
                      <button
                        className="icon-button small-more"
                        aria-label={`${label} options`}
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
                      onClick={() => setActivePage("Reservations")}
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
                        <span>Guests arriving today</span>
                      </div>
                      <div className="activity-number">3</div>
                    </div>
                    <div className="activity-row">
                      <div className="activity-icon departure">
                        <LogOut size={19} />
                      </div>
                      <div className="activity-copy">
                        <strong>Expected check-outs</strong>
                        <span>Guests departing today</span>
                      </div>
                      <div className="activity-number">2</div>
                    </div>
                    <div className="activity-row">
                      <div className="activity-icon pending">
                        <Clock3 size={19} />
                      </div>
                      <div className="activity-copy">
                        <strong>Pending reservations</strong>
                        <span>Awaiting confirmation</span>
                      </div>
                      <div className="activity-number">1</div>
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
                      onClick={() => setActivePage("Rooms")}
                    >
                      <ArrowUpRight size={19} />
                    </button>
                  </div>

                  <div className="occupancy-summary">
                    <div>
                      <div className="occupancy-number">{occupancyPercent}%</div>
                      <span>{roomStats.occupied} of {roomStats.total} rooms occupied</span>
                    </div>
                    <div className="occupancy-ring">
                      <span>29%</span>
                    </div>
                  </div>

                  <div className="occupancy-bar">
                    <span style={{ width: `${occupancyPercent}%` }} />
                  </div>

                  <div className="legend">
                    <span><i className="legend-green" /> Available <b>{roomStats.available}</b></span>
                    <span><i className="legend-blue" /> Occupied <b>{roomStats.occupied}</b></span>
                    <span><i className="legend-orange" /> Maintenance <b>{roomStats.maintenance}</b></span>
                  </div>
                </article>
              </section>

              <section className="panel reservations-panel">
                <div className="panel-header reservation-heading">
                  <div>
                    <h2>Recent reservations</h2>
                    <p>Keep track of your latest guest bookings</p>
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
                      onClick={() => setActivePage("Reservations")}
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
                        <tr key={`${reservation.guest}-${reservation.room}`}>
                          <td>
                            <div className="guest-cell">
                              <div className="avatar guest-avatar">
                                {reservation.initials}
                              </div>
                              <strong>{reservation.guest}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="room-number">
                              {reservation.room}
                            </span>
                          </td>
                          <td className="date-cell">{reservation.dates}</td>
                          <td className="amount-cell">{reservation.amount}</td>
                          <td>
                            <span
                              className={`status-badge ${reservation.status
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              <i />
                              {reservation.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="icon-button row-action"
                              aria-label={`More actions for ${reservation.guest}`}
                            >
                              <MoreHorizontal size={19} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredReservations.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            No reservations match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="panel-footer">
                  Showing {filteredReservations.length} of {reservations.length} sample reservations
                  <button
                    className="text-button"
                    onClick={() => setActivePage("Reservations")}
                  >
                    Manage reservations <ArrowUpRight size={15} />
                  </button>
                </div>
              </section>

              <section className="panel room-list-panel">
                <div className="panel-header">
                  <div>
                    <h2>Room overview</h2>
                    <p>A quick look at selected rooms</p>
                  </div>
                  <button
                    className="text-button"
                   onClick={() => router.push("/rooms")}
                  >
                    All rooms <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="room-grid">
                  {roomData.map((room) => (
                    <div className="room-tile" key={room.number}>
                      <div className="room-tile-top">
                        <BedDouble size={19} />
                        <span>Room {room.number}</span>
                      </div>
                      <strong>{room.type}</strong>
                      <span
                        className={`room-status ${room.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        <i />
                        {room.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="page-footer">
                <span>HavenStay Management</span>
                <span>Guesthouse operations, made simpler.</span>
              </footer>
            </>
          ) : (
            <section className="placeholder-page panel">
              <div className="placeholder-icon">
                {activePage === "Rooms" ? <BedDouble size={28} /> :
                 activePage === "Reservations" ? <CalendarCheck size={28} /> :
                 activePage === "Guests" ? <Users size={28} /> :
                 activePage === "Payments" ? <CircleDollarSign size={28} /> :
                 activePage === "Reports" ? <ClipboardList size={28} /> :
                 activePage === "Settings" ? <Settings size={28} /> :
                 <Wrench size={28} />}
              </div>
              <h1>{activePage}</h1>
              <p>
                This section is ready for development. We&apos;ll implement
                its features in the upcoming milestones.
              </p>
              <button
                className="button button-primary"
                onClick={() => setActivePage("Dashboard")}
              >
                <LayoutDashboard size={17} />
                Back to dashboard
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
