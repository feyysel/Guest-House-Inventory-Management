
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import MetricValue from "@/components/metric-value";
import { useAppSelector } from "@/store";

const ReportBarChart = dynamic(
  () => import("@/components/reports/report-bar-chart"),
  {
    ssr: false,
    loading: () => (
      <div
        className="skeleton-block"
        style={{ height: 288, width: "100%" }}
        aria-hidden="true"
      />
    ),
  }
);

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
  const [reservationAnalytics, setReservationAnalytics] =
    useState<ReservationAnalytics | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [period, setPeriod] = useState<Period>("thismonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const guesthouseName = useAppSelector((state) => state.ui.guesthouseName);

  const rangeError = useMemo(() => {
    if (period !== "custom") return "";
    if (!customStart || !customEnd) {
      return "Select both dates to generate the report.";
    }
    if (customStart > customEnd) {
      return "Start date must be before or equal to end date.";
    }
    return "";
  }, [period, customStart, customEnd]);

  const selectedRange = useMemo<DateRange | null>(() => {
    if (rangeError) return null;
    if (period === "custom") {
      return { startDate: customStart, endDate: customEnd };
    }
    return getDateRange(period, new Date());
  }, [period, customStart, customEnd, rangeError]);

  const hasValidRange = Boolean(selectedRange);
  const valuesLoading = loading || !hasValidRange;
  const error = rangeError || fetchError;

  function handleExportReport() {
    if (!summary || !reservationAnalytics || !occupancy) {
      setFetchError("Wait for all report data to load before exporting.");
      return;
    }

    const rows = [
      [guesthouseName],
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
    const nameSlug =
      guesthouseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "guesthouse";
    link.download = `${nameSlug}-report-${occupancy.date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }


  useEffect(() => {
    if (!selectedRange) return;

    const dateRange = selectedRange;
    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      setFetchError("");

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

        setFetchError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReports();

    return () => controller.abort();
  }, [selectedRange]);

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

        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
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
                <MetricValue loading={valuesLoading} size="lg">
                  {item.value}
                </MetricValue>
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

          {valuesLoading ? (
            <div
              className="skeleton-block h-72 w-full"
              aria-hidden="true"
            />
          ) : dailyRevenue.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              No completed payment revenue for this period.
            </div>
          ) : (
            <ReportBarChart
              data={dailyRevenue as Array<Record<string, string | number>>}
              xDataKey="date"
              barDataKey="revenue"
              barName="Revenue"
              color="#2563eb"
              height={288}
              tickFormatter={(value) => value.slice(5)}
              tooltipFormatter={(value) =>
                `${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} ETB`
              }
              labelPrefix="Date: "
            />
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

          {valuesLoading ? (
            <div
              className="skeleton-block h-80 w-full"
              aria-hidden="true"
            />
          ) : reservationAnalytics === null ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              Reservation analytics are not available.
            </div>
          ) : reservationAnalytics.totalReservations === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              No reservations found for this period.
            </div>
          ) : (
            <ReportBarChart
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
              xDataKey="status"
              barDataKey="count"
              barName="Reservations"
              color="#0d9488"
              height={320}
              allowDecimals={false}
            />
          )}

          {reservationAnalytics !== null && (
            <p className="mt-4 text-sm text-gray-600">
              Total reservations:{" "}
              <span className="font-semibold text-gray-900">
                <MetricValue loading={valuesLoading} size="sm">
                  {reservationAnalytics.totalReservations}
                </MetricValue>
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

  {!valuesLoading && occupancy === null ? (
    <p className="py-8 text-center text-sm text-gray-500">
      Occupancy data is not available.
    </p>
  ) : (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Total Rooms</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            <MetricValue loading={valuesLoading} size="md">
              {occupancy?.totalRooms ?? 0}
            </MetricValue>
          </p>
        </div>

        <div className="rounded-lg bg-teal-50 p-4">
          <p className="text-sm font-medium text-teal-700">Occupied Rooms</p>
          <p className="mt-2 text-2xl font-bold text-teal-900">
            <MetricValue loading={valuesLoading} size="md">
              {occupancy?.occupiedRooms ?? 0}
            </MetricValue>
          </p>
        </div>

        <div className="rounded-lg bg-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700">Available Rooms</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            <MetricValue loading={valuesLoading} size="md">
              {occupancy?.availableRooms ?? 0}
            </MetricValue>
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-4">
          <p className="text-sm font-medium text-indigo-700">Usable Rooms</p>
          <p className="mt-2 text-2xl font-bold text-indigo-900">
            <MetricValue loading={valuesLoading} size="md">
              {occupancy?.usableRooms ?? 0}
            </MetricValue>
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">
            Maintenance Rooms
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            <MetricValue loading={valuesLoading} size="md">
              {occupancy?.maintenanceRooms ?? 0}
            </MetricValue>
          </p>
        </div>

        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Inactive Rooms</p>
          <p className="mt-2 text-2xl font-bold text-red-900">
            <MetricValue loading={valuesLoading} size="md">
              {occupancy?.inactiveRooms ?? 0}
            </MetricValue>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">
            Occupancy Rate
          </span>
          <span className="text-sm font-bold text-gray-900">
            <MetricValue loading={valuesLoading} size="sm">
              {(occupancy?.occupancyRate ?? 0).toFixed(2)}%
            </MetricValue>
          </span>
        </div>

        <div
          className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Room occupancy rate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={occupancy?.occupancyRate ?? 0}
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{
              width: `${occupancy?.occupancyRate ?? 0}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Occupancy date:{" "}
          <MetricValue loading={valuesLoading} size="sm">
            {occupancy?.date ?? "—"}
          </MetricValue>
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
