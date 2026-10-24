
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  guestId: string;
  guestName: string;
  hasReservations: boolean;
};

export default function DeleteGuestButton({
  guestId,
  guestName,
  hasReservations,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (hasReservations) {
      setError(
        "This guest has reservation history and cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${guestName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete guest.");
        return;
      }

      router.push("/guests");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading || hasReservations}
        title={
          hasReservations
            ? "Guests with reservation history cannot be deleted."
            : "Delete guest"
        }
        className="inline-flex items-center rounded-lg border border-red-200 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete Guest"}
      </button>

      {hasReservations && (
        <p className="mt-2 text-sm text-gray-500">
          This guest has reservation history and cannot be deleted.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
