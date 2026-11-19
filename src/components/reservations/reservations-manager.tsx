
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createReservation,
  updateReservationStatus,
} from "@/app/reservations/actions";
import {
  resetReservationDraft,
  setReservationDraft,
  setReservationFormOpen,
  setReservationSearch,
  setReservationStatusFilter,
  type ReservationDraft,
  useAppDispatch,
  useAppSelector,
} from "@/store";

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
  openEnded: boolean;
  adults: number;
  children: number;
  status: ReservationStatus;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currentNights: number;
  currentTotal: number;
  currentBalance: number;
  extraNights: number;
};

type Room = {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  status: string;
  capacity: number;
  pricePerNight: number;
  bookings: { checkIn: string; checkOut: string }[];
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

function isRoomBookable(room: Room, checkIn: string, checkOut: string) {
  if (room.status !== "AVAILABLE") return false;
  if (!checkIn || !checkOut || checkOut <= checkIn) return true;

  return !room.bookings.some(
    (booking) =>
      booking.checkIn < checkOut && checkIn < booking.checkOut
  );
}

export default function ReservationsManager({
  initialReservations,
  rooms,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reservations = initialReservations;

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  const search = useAppSelector((state) => state.ui.reservationSearch);
  const statusFilter = useAppSelector(
    (state) => state.ui.reservationStatusFilter
  );
  const showForm = useAppSelector(
    (state) => state.ui.reservationFormOpen
  );
  const draft = useAppSelector((state) => state.reservationDraft);
  const guesthouseName = useAppSelector(
    (state) => state.ui.guesthouseName
  );

  const defaultCheckIn = localDateString(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckOut = localDateString(tomorrow);

  const firstName = draft.firstName;
  const lastName = draft.lastName;
  const phone = draft.phone;
  const email = draft.email;
  const roomId = draft.roomId;
  const checkIn = draft.checkIn || defaultCheckIn;
  const checkOut = draft.checkOut || defaultCheckOut;
  const openEnded = draft.openEnded;
  const adults = draft.adults;
  const children = draft.children;
  const notes = draft.notes;
  const paymentAmount = draft.paymentAmount;
  const paymentMethod = draft.paymentMethod;
  const paymentTransactionRef = draft.paymentTransactionRef;

  const setSearch = (value: string) =>
    dispatch(setReservationSearch(value));
  const setStatusFilter = (value: string) =>
    dispatch(setReservationStatusFilter(value));
  const setShowForm = (value: boolean) =>
    dispatch(setReservationFormOpen(value));

  const updateDraft = (patch: Partial<ReservationDraft>) =>
    dispatch(setReservationDraft(patch));
  const setFirstName = (value: string) => updateDraft({ firstName: value });
  const setLastName = (value: string) => updateDraft({ lastName: value });
  const setPhone = (value: string) => updateDraft({ phone: value });
  const setEmail = (value: string) => updateDraft({ email: value });
  const setRoomId = (value: string) => updateDraft({ roomId: value });
  const setCheckIn = (value: string) => updateDraft({ checkIn: value });
  const setCheckOut = (value: string) => updateDraft({ checkOut: value });
  const setOpenEnded = (value: boolean) =>
    updateDraft({ openEnded: value });
  const setAdults = (value: string) => updateDraft({ adults: value });
  const setChildren = (value: string) => updateDraft({ children: value });
  const setNotes = (value: string) => updateDraft({ notes: value });
  const setPaymentAmount = (value: string) =>
    updateDraft({ paymentAmount: value });
  const setPaymentMethod = (value: string) =>
    updateDraft({ paymentMethod: value });
  const setPaymentTransactionRef = (value: string) =>
    updateDraft({ paymentTransactionRef: value });

  const openStayCheckOut = useMemo(() => {
    if (!checkIn) return checkOut;

    const date = new Date(`${checkIn}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }, [checkIn, checkOut]);

  const effectiveCheckOut = openEnded ? openStayCheckOut : checkOut;

  const availableRooms = useMemo(
    () =>
      rooms.filter((room) =>
        isRoomBookable(room, checkIn, effectiveCheckOut)
      ),
    [rooms, checkIn, effectiveCheckOut]
  );

  const selectedRoom = availableRooms.find((room) => room.id === roomId);

  const nights =
    checkIn && effectiveCheckOut
      ? (new Date(`${effectiveCheckOut}T00:00:00Z`).getTime() -
          new Date(`${checkIn}T00:00:00Z`).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

  const chargedNights = openEnded && checkIn ? 1 : nights;

  const estimatedTotal =
    selectedRoom && chargedNights > 0
      ? selectedRoom.pricePerNight * chargedNights
      : 0;

  const minimumDeposit = openEnded ? estimatedTotal : estimatedTotal / 2;
  const suggestedDeposit = Math.ceil(minimumDeposit * 100) / 100;
  const depositEntered = Number(paymentAmount);
  const depositIsValid =
    Number.isFinite(depositEntered) &&
    depositEntered >= minimumDeposit &&
    minimumDeposit > 0;

  function syncDeposit(
    nextRoomId: string,
    nextCheckIn: string,
    nextCheckOut: string,
    nextOpenEnded: boolean = openEnded
  ) {
    const nextRoom = rooms.find((room) => room.id === nextRoomId);
    const nextCheckOutForBooking =
      nextOpenEnded && nextCheckIn
        ? new Date(
            new Date(`${nextCheckIn}T00:00:00Z`).getTime() + 86400000
          )
            .toISOString()
            .slice(0, 10)
        : nextCheckOut;

    if (
      nextRoomId &&
      (!nextRoom ||
        !isRoomBookable(nextRoom, nextCheckIn, nextCheckOutForBooking))
    ) {
      setRoomId("");
      setPaymentAmount("");
      return;
    }

    const nextNights =
      nextCheckIn && nextCheckOutForBooking
        ? (new Date(`${nextCheckOutForBooking}T00:00:00Z`).getTime() -
            new Date(`${nextCheckIn}T00:00:00Z`).getTime()) /
          (1000 * 60 * 60 * 24)
        : 0;
    const nextMinimum =
      nextRoom && nextNights > 0
        ? nextOpenEnded
          ? nextRoom.pricePerNight * nextNights
          : (nextRoom.pricePerNight * nextNights) / 2
        : 0;

    if (
      nextMinimum > 0 &&
      Math.abs(depositEntered - minimumDeposit) < 0.005
    ) {
      setPaymentAmount((Math.ceil(nextMinimum * 100) / 100).toFixed(2));
    }
  }

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
    dispatch(resetReservationDraft());

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    updateDraft({
      checkIn: localDateString(tomorrow),
      checkOut: localDateString(dayAfter),
    });
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
        checkOut: openEnded ? "" : checkOut,
        openEnded,
        adults: Number(adults),
        children: Number(children),
        notes,
        paymentAmount: Number(paymentAmount),
        paymentMethod,
        paymentTransactionRef,
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
              {guesthouseName.toUpperCase()} / OPERATIONS
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

            {availableRooms.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No rooms are free for these dates. Occupied, booked and
                under-maintenance rooms are hidden. Change the dates or update
                a room before creating a reservation.
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
                        onChange={(event) => {
                          const nextRoomId = event.target.value;
                          setRoomId(nextRoomId);
                          syncDeposit(nextRoomId, checkIn, checkOut);
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="">Choose an available room</option>
                        {availableRooms.map((room) => (
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
                      <span className="mt-1 block text-xs text-slate-500">
                        {availableRooms.length === 0
                          ? "No rooms are free for these dates. Occupied, booked and maintenance rooms are hidden."
                          : "Occupied, booked and maintenance rooms are hidden."}
                      </span>
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Check-in *
                      <input
                        required
                        type="date"
                        value={checkIn}
                        onChange={(event) => {
                          const nextCheckIn = event.target.value;
                          setCheckIn(nextCheckIn);
                          syncDeposit(roomId, nextCheckIn, checkOut);
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Check-out {openEnded ? "" : "*"}
                      <input
                        required={!openEnded}
                        disabled={openEnded}
                        type="date"
                        min={checkIn || undefined}
                        value={openEnded ? openStayCheckOut : checkOut}
                        onChange={(event) => {
                          const nextCheckOut = event.target.value;
                          setCheckOut(nextCheckOut);
                          syncDeposit(roomId, checkIn, nextCheckOut);
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
                      <input
                        type="checkbox"
                        checked={openEnded}
                        onChange={(event) => {
                          const nextOpenEnded = event.target.checked;
                          setOpenEnded(nextOpenEnded);
                          syncDeposit(
                            roomId,
                            checkIn,
                            checkOut,
                            nextOpenEnded
                          );
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Check-out date not known yet (open stay, charged nightly)
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
                            {chargedNights > 0
                              ? `${chargedNights} night${chargedNights === 1 ? "" : "s"} × ${formatETB(selectedRoom.pricePerNight)}${openEnded ? " — first night charged now, extra nights at checkout" : ""}`
                              : "Choose a valid check-in date."}
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
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    Reservation payment
                  </h3>

                  <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                    {openEnded
                      ? `Open stays require the full first-night price (${formatETB(minimumDeposit)}). Extra nights are charged at the nightly rate and must be cleared before check-out.`
                      : `At least 50% of the room total (${formatETB(minimumDeposit)}) must be paid when the reservation is made. The remaining balance must be paid before check-in or check-out.`}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700">
                      Deposit amount *
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(event) =>
                          setPaymentAmount(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Amount paid now"
                      />
                      <span
                        className={`mt-1 block text-xs ${
                          paymentAmount && !depositIsValid
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {minimumDeposit <= 0
                          ? "Choose a room and dates to see the minimum."
                          : paymentAmount && !depositIsValid
                            ? `Below the ${formatETB(minimumDeposit)} minimum.`
                            : `Minimum: ${formatETB(minimumDeposit)}.`}
                      </span>
                      <button
                        type="button"
                        disabled={minimumDeposit <= 0}
                        onClick={() =>
                          setPaymentAmount(suggestedDeposit.toFixed(2))
                        }
                        className="mt-1 text-xs font-semibold text-teal-700 hover:underline disabled:opacity-50"
                      >
                        {openEnded ? "Use first-night price" : "Use 50% deposit"}
                      </button>
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Payment method *
                      <select
                        required
                        value={paymentMethod}
                        onChange={(event) =>
                          setPaymentMethod(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="TELEBIRR">Telebirr</option>
                        <option value="CARD">Card</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Transaction reference (optional)
                      <input
                        maxLength={191}
                        value={paymentTransactionRef}
                        onChange={(event) =>
                          setPaymentTransactionRef(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        placeholder="Receipt or transaction ID"
                      />
                    </label>
                  </div>
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
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Guest</th>
                    <th className="px-5 py-4 font-semibold">Room</th>
                    <th className="px-5 py-4 font-semibold">Stay dates</th>
                    <th className="px-5 py-4 font-semibold">Guests</th>
                    <th className="px-5 py-4 font-semibold">Total</th>
                    <th className="px-5 py-4 font-semibold">Paid</th>
                    <th className="px-5 py-4 font-semibold">Balance</th>
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
                          {reservation.openEnded
                            ? `Open · ${reservation.currentNights} night${reservation.currentNights === 1 ? "" : "s"} so far`
                            : `to ${reservation.checkOut}`}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {reservation.adults} adult(s)
                        {reservation.children > 0 &&
                          `, ${reservation.children} child(ren)`}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {formatETB(reservation.currentTotal)}
                        {reservation.extraNights > 0 && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            +{reservation.extraNights} extra night
                            {reservation.extraNights === 1 ? "" : "s"}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatETB(reservation.amountPaid)}
                      </td>
                      <td
                        className={`px-5 py-4 font-semibold ${
                          reservation.currentBalance > 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatETB(reservation.currentBalance)}
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
        disabled={isPending || reservation.currentBalance > 0}
        title={
          reservation.currentBalance > 0
            ? "Pay the full room price before check-in"
            : undefined
        }
        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        disabled={isPending || reservation.currentBalance > 0}
        title={
          reservation.currentBalance > 0
            ? "Pay the room total and any extra nights before check-out"
            : undefined
        }
        className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Check out
      </button>
    )}

    {reservation.currentBalance > 0 &&
      ["CONFIRMED", "CHECKED_IN"].includes(reservation.status) && (
        <Link
          href="/payments/new"
          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
        >
          Pay balance
        </Link>
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
          {guesthouseName} · Guest House Management System
        </p>
      </div>
    </main>
  );
}
