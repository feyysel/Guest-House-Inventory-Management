
import { prisma } from "@/lib/db";
import GuestsTable from "@/components/guests/guests-table";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const guests = await prisma.guest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          reservations: true,
        },
      },
    },
  });

  const guestsWithCounts = guests.map((guest) => ({
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    email: guest.email,
    createdAt: guest.createdAt.toISOString(),
    reservationCount: guest._count.reservations,
  }));

  const guestsWithReservations = guests.filter(
    (guest) => guest._count.reservations > 0
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        
<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <p className="text-sm font-medium text-blue-600">
      HAVENSTAY / MANAGEMENT
    </p>

    <h1 className="mt-2 text-3xl font-bold text-gray-900">
      Guest Management
    </h1>

    <p className="mt-2 text-gray-500">
      Manage your registered guests and their reservations.
    </p>
  </div>

  <Link
    href="/guests/new"
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
  >
    <span className="text-xl">+</span>
    Register New Guest
  </Link>
</div>


        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Guests</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {guests.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Guests With Reservations</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {guestsWithReservations}
            </p>
          </div>
        </div>

        <GuestsTable guests={guestsWithCounts} />
      </div>
    </main>
  );
}
