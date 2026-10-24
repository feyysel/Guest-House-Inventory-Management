
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DeleteGuestButton from "@/components/guests/delete-guest-button";


export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GuestDetailsPage({ params }: Props) {
  const { id } = await params;

  const guest = await prisma.guest.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          room: true,
          payments: true,
        },
      },
    },
  });

  if (!guest) {
    notFound();
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatMoney = (amount: { toString(): string }) =>
    `ETB ${Number(amount.toString()).toLocaleString("en-ET", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusStyles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-green-100 text-green-800",
    CHECKED_OUT: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-orange-100 text-orange-800",
  };

  const totalBookings = guest.reservations.length;

  const totalSpent = guest.reservations
    .filter((reservation) =>
      ["CHECKED_OUT", "CHECKED_IN"].includes(reservation.status)
    )
    .reduce(
      (sum, reservation) => sum + Number(reservation.totalAmount.toString()),
      0
    );

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/guests"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Guests
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-medium text-blue-600">
            HAVENSTAY / GUEST DETAILS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {guest.firstName} {guest.lastName}
          </h1>

          <p className="mt-2 text-gray-500">
            Guest profile and reservation history
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Reservations</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalBookings}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Value of Current and Completed Stays
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatMoney({ toString: () => String(totalSpent) })}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Based on checked-in and checked-out reservations, not payment
              records.
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Guest Information
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="mt-1 font-medium text-gray-900">
                {guest.firstName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="mt-1 font-medium text-gray-900">
                {guest.lastName}
              </p>
            </div>

           

            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="mt-1 font-medium text-gray-900">
                {guest.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 font-medium text-gray-900">
                {guest.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="mt-1 font-medium text-gray-900">
                {guest.address || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nationality</p>
              <p className="mt-1 font-medium text-gray-900">
                {guest.nationality || "—"}
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                {guest.notes || "No notes"}
              </p>
            </div>
            
          </div>
           <Link
  href={`/guests/${guest.id}/edit`}
  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
>
  Edit Guest
</Link>
 <DeleteGuestButton
    guestId={guest.id}
    guestName={`${guest.firstName} ${guest.lastName}`}
    hasReservations={guest.reservations.length > 0}
  />
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Reservation History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              All reservations associated with this guest.
            </p>
          </div>

          {guest.reservations.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-semibold text-gray-900">
                No reservations yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Reservations for this guest will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Booking Code</th>
                    <th className="px-5 py-4 font-semibold">Room</th>
                    <th className="px-5 py-4 font-semibold">Check-in</th>
                    <th className="px-5 py-4 font-semibold">Check-out</th>
                    <th className="px-5 py-4 font-semibold">Guests</th>
                    <th className="px-5 py-4 font-semibold">Total</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {guest.reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {reservation.bookingCode}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {reservation.room.roomNumber}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(reservation.checkIn)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(reservation.checkOut)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {reservation.adults + reservation.children}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatMoney(reservation.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[reservation.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {reservation.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
