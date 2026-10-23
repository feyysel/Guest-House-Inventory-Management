
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createReservation,
  updateReservationStatus,
} from "@/app/reservations/actions";

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "NO_SHOW";

type Reservation = {
  id: string;
  bookingCode: string;
  guestName: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  totalAmount: number;
};

type Room = {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
};

type Props = {
  initialReservations: Reservation[];
  rooms: Room[];
};

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

function formatETB(amount: number) {
  return `ETB ${amount.toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReservationsManager({
  initialReservations,
  rooms,
}: Props) {
  const router = useRouter();

  const [reservations, setReservations] =
    useState(initialReservations);
    useEffect(() => {
  setReservations(initialReservations);
}, [initialReservations]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState(() =>
    localDateString(new Date())
  );
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return localDateString(tomorrow);
  });
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  const selectedRoom = rooms.find((room) => room.id === roomId);

  const nights =
    checkIn && checkOut
      ? (new Date(`${checkOut}T00:00:00Z`).getTime() -
          new Date(`${checkIn}T00:00:00Z`).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

  const estimatedTotal =
    selectedRoom && nights > 0
      ? selectedRoom.pricePerNight * nights
      : 0;

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesSearch =
        !query ||
        reservation.guestName.toLowerCase().includes(query) ||
        reservation.phone.toLowerCase().includes(query) ||
        reservation.bookingCode.toLowerCase().includes(query) ||
        reservation.roomNumber.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        reservation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, search, statusFilter]);

  const pendingCount = reservations.filter(
    (reservation) => reservation.status === "PENDING"
  ).length;

  const confirmedCount = reservations.filter(
    (reservation) => reservation.status === "CONFIRMED"
  ).length;

  const checkedInCount = reservations.filter(
    (reservation) => reservation.status === "CHECKED_IN"
  ).length;

  function resetForm() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setRoomId("");
    setNotes("");
    setAdults("1");
    setChildren("0");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    setCheckIn(localDateString(tomorrow));
    setCheckOut(localDateString(dayAfter));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await createReservation({
        firstName,
        lastName,
        phone,
        email,
        roomId,
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        notes,
      });

      setMessage(result.message);
      setMessageSuccess(result.success);

      if (result.success) {
        resetForm();
        setShowForm(false);
        router.refresh();
      }
    });
  }

  // Keep the list synchronized with refreshed server data.
  // The server page is the source of truth after a refresh.
  const displayedReservations = filteredReservations;

  
function handleStatusUpdate(
  reservationId: string,
  nextStatus: ReservationStatus
) {
  setMessage("");

  startTransition(async () => {
    const result = await updateReservationStatus(
      reservationId,
      nextStatus
    );

    setMessage(result.message);
    setMessageSuccess(result.success);

    if (result.success) {
      router.refresh();
    }
  });
}


  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-teal-700">
              HAVENSTAY / OPERATIONS
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Reservations
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage guest bookings, room assignments, and stay dates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setShowForm(!showForm);
            }}
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            {showForm ? "Close form" : "+ New reservation"}
          </button>
        </header>

        {message && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${
              messageSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total reservations</p>
            <p className="mt-3 text-3xl font-bold">{reservations.length}</p>
            <p className="mt-2 text-xs text-slate-400">All booking statuses</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
            <p className="mt-2 text-xs text-slate-400">Awaiting confirmation</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Confirmed</p>
            <p className="mt-3 text-3xl font-bold text-blue-600">
              {confirmedCount}
            </p>
            <p className="mt-2 text-xs text-slate-400">Confirmed bookings</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Currently checked in</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">
              {checkedInCount}
            </p>
            <p className="mt-2 text-xs text-slate-400">Active stays</p>
          </div>
        </section>

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Create reservation</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the guest details and select an available room.
              </p>
            </div>

            {rooms.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No rooms are currently marked as available. Add or update a
                room before creating a reservation.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    Guest information
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700">
                      First name *
                      <input
                        required
                        maxLength={100}
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Guest first name"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Last name *
                      <input
                        required
                        maxLength={100}
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Guest last name"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Phone number *
                      <input
                        required
                        maxLength={30}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="+251..."
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                      Email address (optional)
                      <input
                        type="email"
                        maxLength={254}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="guest@example.com"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    Room and stay
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                      Select room *
                      <select
                        required
                        value={roomId}
                        onChange={(event) => setRoomId(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="">Choose an available room</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.roomNumber}
                            {room.name ? ` — ${room.name}` : ""}
                            {" · "}
                            {formatETB(room.pricePerNight)}/night
                            {" · Capacity "}
                            {room.capacity}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Check-in *
                      <input
                        required
                        type="date"
                        value={checkIn}
                        onChange={(event) => setCheckIn(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Check-out *
                      <input
                        required
                        type="date"
                        min={checkIn || undefined}
                        value={checkOut}
                        onChange={(event) => setCheckOut(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm font-medium text-slate-700">
                        Adults *
                        <input
                          required
                          type="number"
                          min="1"
                          max="50"
                          value={adults}
                          onChange={(event) => setAdults(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </label>

                      <label className="text-sm font-medium text-slate-700">
                        Children
                        <input
                          required
                          type="number"
                          min="0"
                          max="50"
                          value={children}
                          onChange={(event) => setChildren(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </label>
                    </div>
                  </div>

                  {selectedRoom && (
                    <div className="mt-5 rounded-xl bg-teal-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-teal-900">
                            Estimated stay total
                          </p>
                          <p className="mt-1 text-xs text-teal-700">
                            {nights > 0
                              ? `${nights} night${nights === 1 ? "" : "s"} × ${formatETB(selectedRoom.pricePerNight)}`
                              : "Choose a valid check-out date after check-in."}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-teal-900">
                          {formatETB(estimatedTotal)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-teal-700">
                        Room capacity: {selectedRoom.capacity} guest(s).
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="block text-sm font-medium text-slate-700">
                    Booking notes (optional)
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      placeholder="Special requests or additional information..."
                    />
                  </label>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setMessage("");
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending || nights <= 0 || !roomId}
                    className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? "Creating reservation..." : "Create reservation"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">All reservations</h2>
              <p className="mt-1 text-sm text-slate-500">
                {displayedReservations.length} booking(s) found
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest, phone, booking..."
                className="min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:w-72"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-600"
              >
                <option value="ALL">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {displayedReservations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                <span aria-hidden="true">▤</span>
              </div>
              <h3 className="mt-4 font-semibold">No reservations found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search or create a new reservation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Guest</th>
                    <th className="px-5 py-4 font-semibold">Room</th>
                    <th className="px-5 py-4 font-semibold">Stay dates</th>
                    <th className="px-5 py-4 font-semibold">Guests</th>
                    <th className="px-5 py-4 font-semibold">Total</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Booking code</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100">
                  {displayedReservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {reservation.guestName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {reservation.phone}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium">
                        Room {reservation.roomNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p>{reservation.checkIn}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          to {reservation.checkOut}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {reservation.adults} adult(s)
                        {reservation.children > 0 &&
                          `, ${reservation.children} child(ren)`}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {formatETB(reservation.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            reservation.status === "CONFIRMED"
                              ? "bg-blue-50 text-blue-700"
                              : reservation.status === "PENDING"
                                ? "bg-amber-50 text-amber-700"
                                : reservation.status === "CHECKED_IN"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : reservation.status === "CHECKED_OUT"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-red-50 text-red-700"
                          }`}
                        >
                          {statusLabels[reservation.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {reservation.bookingCode}
                      </td>
                      
<td className="px-5 py-4">
  <div className="flex flex-wrap gap-2">
    {reservation.status === "PENDING" && (
      <>
        <button
          type="button"
          onClick={() =>
            handleStatusUpdate(reservation.id, "CONFIRMED")
          }
          disabled={isPending}
          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
        >
          Confirm
        </button>

        <button
          type="button"
          onClick={() =>
            handleStatusUpdate(reservation.id, "CANCELLED")
          }
          disabled={isPending}
          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
        >
          Cancel
        </button>
      </>
    )}

    {reservation.status === "CONFIRMED" && (
      <button
        type="button"
        onClick={() =>
          handleStatusUpdate(reservation.id, "CHECKED_IN")
        }
        disabled={isPending}
        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
      >
        Check in
      </button>
    )}

    {reservation.status === "CHECKED_IN" && (
      <button
        type="button"
        onClick={() =>
          handleStatusUpdate(reservation.id, "CHECKED_OUT")
        }
        disabled={isPending}
        className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
      >
        Check out
      </button>
    )}

    {["CHECKED_OUT", "CANCELLED", "NO_SHOW"].includes(
      reservation.status
    ) && (
      <span className="text-xs text-slate-400">
        No actions available
      </span>
    )}
  </div>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-400">
          HavenStay · Guest House Management System
        </p>
      </div>
    </main>
  );
}
