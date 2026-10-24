
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  transactionRef: string | null;
  bookingCode: string;
  guestName: string;
  roomName: string;
};

type Props = {
  payments: Payment[];
};

export default function PaymentHistoryFilters({ payments }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
    const [sortBy, setSortBy] = useState<"date" | "amount" | "guest">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setCurrentPage(1);
  }

  function handleMethodChange(value: string) {
    setMethod(value);
    setCurrentPage(1);
  }

  function handleFromDateChange(value: string) {
    setFromDate(value);
    setCurrentPage(1);
  }

  function handleToDateChange(value: string) {
    setToDate(value);
    setCurrentPage(1);
  }

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        [
          payment.guestName,
          payment.bookingCode,
          payment.roomName,
          payment.transactionRef ?? "",
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        status === "ALL" || payment.status === status;

      const matchesMethod =
        method === "ALL" || payment.method === method;

      const paymentDate = payment.paidAt.slice(0, 10);
      const matchesFromDate = !fromDate || paymentDate >= fromDate;
      const matchesToDate = !toDate || paymentDate <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [payments, search, status, method, fromDate, toDate]);

  
  const sortedPayments = useMemo(() => {
    const sorted = [...filteredPayments];

    sorted.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        comparison =
          new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "guest") {
        comparison = a.guestName.localeCompare(b.guestName);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredPayments, sortBy, sortOrder]);


      const totalPages = Math.max(
    1,
    Math.ceil(sortedPayments.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;

  const paginatedPayments = sortedPayments.slice(
    startIndex,
    startIndex + pageSize
  );

  
  function handleExportCSV() {
    const headers = [
      "Guest Name",
      "Booking Code",
      "Room",
      "Amount",
      "Payment Method",
      "Status",
      "Payment Date",
      "Transaction Reference",
    ];

    const escapeCSV = (value: string | number) => {
      const text = String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = sortedPayments.map((payment) => [
      payment.guestName,
      payment.bookingCode,
      payment.roomName,
      payment.amount.toFixed(2),
      payment.method.replaceAll("_", " "),
      payment.status,
      payment.paidAt,
      payment.transactionRef ?? "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `havenstay-payment-history-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const money = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="sort-by"
            className="text-sm font-medium text-gray-700"
          >
            Sort payments by
          </label>

          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as "date" | "amount" | "guest");
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="date">Payment date</option>
            <option value="amount">Payment amount</option>
            <option value="guest">Guest name</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          aria-label={`Change sort order. Current order: ${
            sortOrder === "asc" ? "ascending" : "descending"
          }`}
        >
          {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
        </button>
        
<button
  type="button"
  onClick={handleExportCSV}
  disabled={sortedPayments.length === 0}
  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  Export CSV
</button>

      </div>
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search guest, booking, room..."
          aria-label="Search payments"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm lg:col-span-2"
        />

        <select
          value={status}
          onChange={(event) => handleStatusChange(event.target.value)}
          aria-label="Filter by payment status"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <select
          value={method}
          onChange={(event) => handleMethodChange(event.target.value)}
          aria-label="Filter by payment method"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All methods</option>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="TELEBIRR">Telebirr</option>
          <option value="CARD">Card</option>
          <option value="OTHER">Other</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus("ALL");
            setMethod("ALL");
            setFromDate("");
            setToDate("");
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Clear filters
        </button>

        <label className="space-y-1 text-sm text-gray-600">
          From date
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => handleFromDateChange(event.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-600">
          To date
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => handleToDateChange(event.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filteredPayments.length} of {payments.length} payments
      </p>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Guest</th>
              <th className="px-5 py-4 font-semibold">Booking Code</th>
              <th className="px-5 py-4 font-semibold">Room</th>
              <th className="px-5 py-4 font-semibold">Amount</th>
              <th className="px-5 py-4 font-semibold">Method</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginatedPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-medium text-gray-900">
                  {payment.guestName}
                </td>
                <td className="px-5 py-4">{payment.bookingCode}</td>
                <td className="px-5 py-4">{payment.roomName}</td>
                <td className="px-5 py-4 font-medium">
                  {money(payment.amount)}
                </td>
                <td className="px-5 py-4">
                  {payment.method.replaceAll("_", " ")}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      payment.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : payment.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : payment.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {new Date(payment.paidAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/payments/${payment.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}

            {filteredPayments.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-gray-500"
                >
                  No payments match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="page-size">Rows per page</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-600">
            {filteredPayments.length === 0
              ? "Showing 0 payments"
              : `Showing ${startIndex + 1}–${Math.min(
                  startIndex + pageSize,
                  filteredPayments.length
                )} of ${filteredPayments.length}`}
          </p>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
            disabled={safeCurrentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm font-medium text-gray-700">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={safeCurrentPage >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

    </section>
  );
}
