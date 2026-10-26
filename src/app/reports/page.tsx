
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type ReportSummary = {
  totalRevenue: number;
  pendingPayments: number;
  reservationCount: number;
  totalRooms: number;
};
type DailyRevenue = {
  date: string;
  revenue: number;
};
type ReservationAnalytics = {
  reservationCounts: {
    PENDING: number;
    CONFIRMED: number;
    CHECKED_IN: number;
    CHECKED_OUT: number;
    CANCELLED: number;
    NO_SHOW: number;
  };
  totalReservations: number;
  startDate: string;
  endDate: string;
};


type OccupancyAnalytics = {
  date: string;
  totalRooms: number;
  usableRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  inactiveRooms: number;
  occupancyRate: number;
};



type Period = "today" | "last7days" | "thismonth" | "thisyear" | "custom";

type DateRange = {
  startDate: string;
  endDate: string;
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(period: Period, today: Date): DateRange | null {
  const start = new Date(today);
  const end = new Date(today);

  switch (period) {
    case "today":
      break;

    case "last7days":
      start.setDate(start.getDate() - 6);
      break;

    case "thismonth":
      start.setDate(1);
      break;

    case "thisyear":
      start.setMonth(0, 1);
      break;

    case "custom":
      return null;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [reservationAnalytics, setReservationAnalytics] =useState<ReservationAnalytics | null>(null);
  const [occupancy, setOccupancy] =useState<OccupancyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<Period>("thismonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  
  function handleExportReport() {
    if (!summary || !reservationAnalytics || !occupancy) {
      setError("Wait for all report data to load before exporting.");
      return;
    }

    const rows = [
      ["HavenStay Guest House Management System"],
      ["Report Period", period],
      ["Occupancy Date", occupancy.date],
      [],
      ["Summary"],
      ["Metric", "Value"],
      ["Total Revenue (ETB)", summary.totalRevenue.toFixed(2)],
      ["Pending Payments (ETB)", summary.pendingPayments.toFixed(2)],
      ["Reservations", summary.reservationCount],
      ["Registered Rooms", summary.totalRooms],
      [],
      ["Daily Revenue"],
      ["Date", "Revenue (ETB)"],
      ...dailyRevenue.map((item) => [
        item.date,
        item.revenue.toFixed(2),
      ]),
      [],
      ["Reservations by Status"],
      ["Status", "Count"],
      ...Object.entries(reservationAnalytics.reservationCounts),
      ["Total Reservations", reservationAnalytics.totalReservations],
      [],
      ["Room Occupancy"],
      ["Occupancy Date", occupancy.date],
      ["Total Rooms", occupancy.totalRooms],
      ["Occupied Rooms", occupancy.occupiedRooms],
      ["Available Rooms", occupancy.availableRooms],
      ["Occupancy Rate (%)", occupancy.occupancyRate.toFixed(2)],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `havenstay-report-${occupancy.date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }


  useEffect(() => {
    if (period === "custom" && (!customStart || !customEnd)) {
      setLoading(false);
      setError("");
      return;
    }

    const selectedRange: DateRange | null =
      period === "custom"
        ? { startDate: customStart, endDate: customEnd }
        : getDateRange(period, new Date());

    if (selectedRange === null) {
      setLoading(false);
      return;
    }

    // Copy the validated range into a non-null typed constant.
    const dateRange: DateRange = selectedRange;

    if (dateRange.startDate > dateRange.endDate) {
      setLoading(false);
      setError("Start date must be before or equal to end date.");
      return;
    }

    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        const response = await fetch(
          `/api/reports/summary?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load report data.");
        }

        const data: ReportSummary = await response.json();
setSummary(data);

const revenueResponse = await fetch(
  `/api/reports/revenue?${params.toString()}`,
  { signal: controller.signal }
);

if (!revenueResponse.ok) {
  throw new Error("Unable to load daily revenue data.");
}

const revenueData: { dailyRevenue: DailyRevenue[] } =
  await revenueResponse.json();

setDailyRevenue(revenueData.dailyRevenue);

const reservationResponse = await fetch(
  `/api/reports/reservations?${params.toString()}`,
  { signal: controller.signal }
);

if (!reservationResponse.ok) {
  throw new Error("Unable to load reservation analytics.");
}

const reservationData: ReservationAnalytics =
  await reservationResponse.json();

setReservationAnalytics(reservationData);

const occupancyResponse = await fetch(
  `/api/reports/occupancy?date=${dateRange.endDate}`,
  { signal: controller.signal }
);

if (!occupancyResponse.ok) {
  throw new Error("Unable to load room occupancy data.");
}

const occupancyData: OccupancyAnalytics =
  await occupancyResponse.json();

setOccupancy(occupancyData);


      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => controller.abort();
  }, [period, customStart, customEnd]);

  const cards = [
    {
      title: "Total Revenue",
      value:
        summary === null
          ? "—"
          : summary.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
      description: "Completed payments in period",
      icon: "ETB",
    },
    {
      title: "Reservations",
      value: summary?.reservationCount.toLocaleString() ?? "—",
      description: "Reservations by check-in date",
      icon: "RES",
    },
    {
      title: "Registered Rooms",
      value: summary?.totalRooms.toLocaleString() ?? "—",
      description: "All registered rooms",
      icon: "ROOM",
    },
    {
      title: "Pending Payments",
      value:
        summary === null
          ? "—"
          : summary.pendingPayments.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
      description: "Pending payments in period",
      icon: "PAY",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Track your guest house performance and financial activity.
            </p>
          </div>

          <Link
            href="/payments"
            className="inline-flex w-fit items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            View Payments
          </Link>
          
<button
  type="button"
  onClick={handleExportReport}
  disabled={loading || !summary || !reservationAnalytics || !occupancy}
  className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  Export Report (CSV)
</button>

        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Reporting Period
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { value: "today", label: "Today" },
              { value: "last7days", label: "Last 7 Days" },
              { value: "thismonth", label: "This Month" },
              { value: "thisyear", label: "This Year" },
              { value: "custom", label: "Custom Range" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value as Period)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  period === option.value
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                End Date
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2.5"
                />
              </label>
            </div>
          )}

          {period === "custom" && (!customStart || !customEnd) && (
            <p className="mt-3 text-sm text-gray-500">
              Select both dates to generate the report.
            </p>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-gray-500">Loading report data...</p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-500">
                  {item.title}
                </p>
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {item.icon}
                </span>
              </div>

              <p className="mt-4 break-words text-2xl font-bold text-gray-900">
                {item.value}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Revenue
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Completed payments by date, in Ethiopian Birr (ETB).
            </p>
          </div>

          {dailyRevenue.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              No completed payment revenue for this period.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyRevenue}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <YAxis
                    tickFormatter={(value: number) =>
                      value.toLocaleString()
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} ETB`,
                      "Revenue",
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Reservations by Status
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Reservation counts by status for the selected reporting period.
            </p>
          </div>

          {reservationAnalytics === null ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              Reservation analytics are not available.
            </div>
          ) : reservationAnalytics.totalReservations === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              No reservations found for this period.
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      status: "Pending",
                      count: reservationAnalytics.reservationCounts.PENDING,
                    },
                    {
                      status: "Confirmed",
                      count: reservationAnalytics.reservationCounts.CONFIRMED,
                    },
                    {
                      status: "Checked In",
                      count: reservationAnalytics.reservationCounts.CHECKED_IN,
                    },
                    {
                      status: "Checked Out",
                      count: reservationAnalytics.reservationCounts.CHECKED_OUT,
                    },
                    {
                      status: "Cancelled",
                      count: reservationAnalytics.reservationCounts.CANCELLED,
                    },
                    {
                      status: "No Show",
                      count: reservationAnalytics.reservationCounts.NO_SHOW,
                    },
                  ]}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Reservations"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {reservationAnalytics !== null && (
            <p className="mt-4 text-sm text-gray-600">
              Total reservations:{" "}
              <span className="font-semibold text-gray-900">
                {reservationAnalytics.totalReservations}
              </span>
            </p>
          )}
        </section>

        
        
<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-900">
      Room Occupancy Overview
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Occupancy on the final day of the selected reporting period.
    </p>
  </div>

  {occupancy === null ? (
    <p className="py-8 text-center text-sm text-gray-500">
      Occupancy data is not available.
    </p>
  ) : (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">
            Total Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {occupancy.totalRooms}
          </p>
        </div>

        <div className="rounded-lg bg-teal-50 p-4">
          <p className="text-sm font-medium text-teal-700">
            Occupied Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-teal-900">
            {occupancy.occupiedRooms}
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700">
            Available Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {occupancy.availableRooms}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-4">
          <p className="text-sm font-medium text-indigo-700">
            Usable Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-indigo-900">
            {occupancy.usableRooms}
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">
            Maintenance Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            {occupancy.maintenanceRooms}
          </p>
        </div>

        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Inactive Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-red-900">
            {occupancy.inactiveRooms}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">
            Occupancy Rate
          </span>
          <span className="text-sm font-bold text-gray-900">
            {occupancy.occupancyRate.toFixed(2)}%
          </span>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Room occupancy rate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={occupancy.occupancyRate}
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{
              width: `${occupancy.occupancyRate}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Occupancy date: {occupancy.date}
        </p>
      </div>
    </>
  )}
</section>





        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Reports
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Review completed revenue and payments awaiting completion.
          </p>
          <Link
            href="/payments"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View Payment History
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Reservation Reports
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Review bookings and guest stays to understand reservation activity.
          </p>
          <Link
            href="/reservations"
            className="mt-5 inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Reservations
          </Link>
        </div>
      </div>
    </div>
  );
}
