
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Reservation = {
  id: string;
  bookingCode: string;
  guest: {
    firstName: string;
    lastName: string;
  };
  room: {
    name: string;
  };
  totalAmount: number;
};

export default function NewPaymentPage() {
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationId, setReservationId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [status, setStatus] = useState("COMPLETED");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
useEffect(() => {
  async function loadReservations() {
    try {
      const response = await fetch("/api/payments/reservations");

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.reservations)) {
        throw new Error("Invalid reservations response.");
      }

      setReservations(data.reservations);
      setError("");
    } catch (error) {
      console.error("Load reservations error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load reservations."
      );
    }
  }

  loadReservations();
}, []);


  
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        amount: Number(amount),
        method,
        status,
        transactionRef,
        notes,
      }),
    });

    const responseText = await response.text();

    let data: { error?: string } = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Invalid API response:", responseText);
      }
    }

    if (!response.ok) {
      throw new Error(
        data.error ??
          `Payment failed. Server returned status ${response.status}.`
      );
    }

    if (!responseText) {
      throw new Error("The server returned an empty response.");
    }

    router.push("/payments");
    router.refresh();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to record payment. Please try again."
    );
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href="/payments"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Payments
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Record Payment
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a payment against an existing reservation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Reservation *
          </label>
          <select
            required
            value={reservationId}
            onChange={(event) => setReservationId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select a reservation</option>
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.bookingCode} —{" "}
                {reservation.guest.firstName} {reservation.guest.lastName} —{" "}
                Room {reservation.room.name}
              </option>
            ))}
          </select>
          {reservations.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              No reservations found. Create a reservation first.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Amount *
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter payment amount"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Payment Method *
            </label>
            <select
              required
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="TELEBIRR">Telebirr</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Payment Status *
            </label>
            <select
              required
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Transaction Reference
          </label>
          <input
            value={transactionRef}
            onChange={(event) => setTransactionRef(event.target.value)}
            placeholder="Optional transaction ID"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional payment notes"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/payments"
            className="rounded-lg border px-5 py-2 text-center font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading || reservations.length === 0}
            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
