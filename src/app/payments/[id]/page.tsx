
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PaymentStatusEditor from "./PaymentStatusEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function PaymentDetailsPage({ params }: Props) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      reservation: {
        include: {
          guest: true,
          room: true,
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  const amount = Number(payment.amount);
  const totalAmount = Number(payment.reservation.totalAmount);

  const statusStyles: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/payments"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Payments
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Details
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Transaction ID: {payment.id}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
              statusStyles[payment.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {payment.status}
          </span>
        </div>
      </div>

            <section className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Manage Payment Status
        </h2>

        <p className="text-sm text-gray-500">
          Update the payment status when its payment state has been verified.
        </p>

        <PaymentStatusEditor
          paymentId={payment.id}
          currentStatus={payment.status}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Payment Amount</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Payment Method</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {payment.method.replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Transaction Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Transaction Reference</p>
            <p className="mt-1 font-medium">
              {payment.transactionRef || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Date</p>
            <p className="mt-1 font-medium">
              {payment.paidAt.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Record Created</p>
            <p className="mt-1 font-medium">
              {payment.createdAt.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Payment Record ID</p>
            <p className="mt-1 break-all font-medium">{payment.id}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap">
            {payment.notes || "No notes"}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Guest and Reservation
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Guest Name</p>
            <p className="mt-1 font-medium">
              {payment.reservation.guest.firstName}{" "}
              {payment.reservation.guest.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="mt-1 font-medium">
              {payment.reservation.guest.phone}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Booking Code</p>
            <p className="mt-1 font-medium">
              {payment.reservation.bookingCode}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Room</p>
            <p className="mt-1 font-medium">
              {payment.reservation.room.name ?? payment.reservation.room.roomNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Check-in</p>
            <p className="mt-1 font-medium">
              {payment.reservation.checkIn.toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Check-out</p>
            <p className="mt-1 font-medium">
              {payment.reservation.checkOut.toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Reservation Total</p>
            <p className="mt-1 font-medium">
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
