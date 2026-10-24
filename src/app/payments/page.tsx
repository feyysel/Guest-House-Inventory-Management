
import Link from "next/link";
import { prisma } from "@/lib/db";
import PaymentHistoryFilters from "./PaymentHistoryFilters";
export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      reservation: {
        include: {
          guest: true,
          room: true,
        },
      },
    },
    orderBy: {
      paidAt: "desc",
    },
  });

  const totalCompleted = payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  const totalPending = payments
    .filter((payment) => payment.status === "PENDING")
    .reduce((total, payment) => total + Number(payment.amount), 0);
    
  const totalFailed = payments
    .filter((payment) => payment.status === "FAILED")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  const totalRefunded = payments
    .filter((payment) => payment.status === "REFUNDED")
    .reduce((total, payment) => total + Number(payment.amount), 0);
    
  const paymentMethodBreakdown = [
    { method: "CASH", label: "Cash" },
    { method: "BANK_TRANSFER", label: "Bank Transfer" },
    { method: "TELEBIRR", label: "Telebirr" },
    { method: "CARD", label: "Card" },
    { method: "OTHER", label: "Other" },
  ].map(({ method, label }) => {
    const methodPayments = payments.filter(
      (payment) => payment.method === method
    );
    

    const getTotal = (status: string) =>
      methodPayments
        .filter((payment) => payment.status === status)
        .reduce((total, payment) => total + Number(payment.amount), 0);

    return {
      method,
      label,
      completed: getTotal("COMPLETED"),
      pending: getTotal("PENDING"),
      failed: getTotal("FAILED"),
      refunded: getTotal("REFUNDED"),
    };
  });

  const revenueByDate = Object.values(
    payments
      .filter((payment) => payment.status === "COMPLETED")
      .reduce(
        (groups, payment) => {
          const date = payment.paidAt.toISOString().slice(0, 10);

          if (!groups[date]) {
            groups[date] = {
              date,
              revenue: 0,
            };
          }

          groups[date].revenue += Number(payment.amount);

          return groups;
        },
        {} as Record<string, { date: string; revenue: number }>
      )
  ).sort((a, b) => a.date.localeCompare(b.date));
  
const monthlyRevenue = Object.values(
  payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce(
      (groups, payment) => {
        const date = payment.paidAt;
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!groups[monthKey]) {
          groups[monthKey] = {
            month: monthKey,
            revenue: 0,
            paymentCount: 0,
          };
        }

        groups[monthKey].revenue += Number(payment.amount);
        groups[monthKey].paymentCount += 1;

        return groups;
      },
      {} as Record<
        string,
        { month: string; revenue: number; paymentCount: number }
      >
    )
).sort((a, b) => a.month.localeCompare(b.month));




  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payments Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track guest payments and transaction records.
          </p>
        </div>

        <Link
          href="/payments/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
        >
          + Record Payment
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="mt-2 text-2xl font-bold">{payments.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Completed Amount</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {totalCompleted.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Pending Amount</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {totalPending.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Failed Amount</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {totalFailed.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Refunded Amount</p>
          <p className="mt-2 text-2xl font-bold text-gray-600">
            {totalRefunded.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

      </div>
      
<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="mb-5">
    <h2 className="text-lg font-semibold text-gray-900">
      Payment Method Breakdown
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Compare payment totals by method and status.
    </p>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full min-w-[700px] text-left text-sm">
      <thead className="border-b bg-gray-50 text-gray-600">
        <tr>
          <th className="px-4 py-3 font-semibold">Payment Method</th>
          <th className="px-4 py-3 text-right font-semibold">Completed</th>
          <th className="px-4 py-3 text-right font-semibold">Pending</th>
          <th className="px-4 py-3 text-right font-semibold">Failed</th>
          <th className="px-4 py-3 text-right font-semibold">Refunded</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {paymentMethodBreakdown.map((item) => (
          <tr key={item.method} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">
              {item.label}
            </td>
            <td className="px-4 py-3 text-right text-green-700">
              {item.completed.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
            <td className="px-4 py-3 text-right text-amber-700">
              {item.pending.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
            <td className="px-4 py-3 text-right text-red-700">
              {item.failed.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
            <td className="px-4 py-3 text-right text-gray-600">
              {item.refunded.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

</section>

<div className="my-6" />

<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-900">
      Revenue Over Time
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Daily revenue from completed payments.
    </p>
  </div>

  {revenueByDate.length === 0 ? (
    <div className="rounded-lg bg-gray-50 px-4 py-10 text-center">
      <p className="font-medium text-gray-700">
        No completed payment revenue yet
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Completed payments will appear here.
      </p>
    </div>
  ) : (
    <div className="space-y-5">
      {revenueByDate.slice(-14).map((item) => {
        const recentRevenue = revenueByDate.slice(-14);
        const maxRevenue = Math.max(
          ...recentRevenue.map((entry) => entry.revenue),
          1
        );

        const width = (item.revenue / maxRevenue) * 100;

        return (
          <div key={item.date}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600">
                {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>

              <span className="font-semibold text-gray-900">
                {item.revenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>

<div className="my-6" />

<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-900">
      Monthly Revenue Analytics
    </h2>
    <p className="mt-1 text-sm text-gray-500">
      Revenue and completed payment counts by month.
    </p>
  </div>

  {monthlyRevenue.length === 0 ? (
    <div className="rounded-lg bg-gray-50 px-4 py-10 text-center">
      <p className="font-medium text-gray-700">
        No monthly revenue data yet
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Completed payments will appear here.
      </p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead className="border-b bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Month</th>
            <th className="px-4 py-3 text-right font-semibold">
              Revenue
            </th>
            <th className="px-4 py-3 text-right font-semibold">
              Completed Payments
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {monthlyRevenue.slice(-12).map((item) => {
            const [year, month] = item.month.split("-");

            const monthLabel = new Date(
              Number(year),
              Number(month) - 1,
              1,
              12
            ).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            });

            return (
              <tr key={item.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {monthLabel}
                </td>

                <td className="px-4 py-3 text-right font-semibold text-green-700">
                  {item.revenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>

                <td className="px-4 py-3 text-right text-gray-600">
                  {item.paymentCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</section>

<div className="my-6" />

<PaymentHistoryFilters

        payments={payments.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt.toISOString(),
          transactionRef: payment.transactionRef,
          bookingCode: payment.reservation.bookingCode,
          guestName: `${payment.reservation.guest.firstName} ${payment.reservation.guest.lastName}`,
          roomName:
            payment.reservation.room.name ??
            payment.reservation.room.roomNumber,
        }))}
      />

      
    </div>
  );
}
