
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

type Props = {
  paymentId: string;
  currentStatus: PaymentStatus;
};

export default function PaymentStatusEditor({
  paymentId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdate() {
    if (status === currentStatus) {
      setMessage("Choose a different status first.");
      return;
    }

    const confirmed = window.confirm(
      `Change payment status from ${currentStatus} to ${status}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update payment status.");
      }

      setMessage("Payment status updated successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="payment-status"
        className="block text-sm font-medium text-gray-700"
      >
        Update Payment Status
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          id="payment-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as PaymentStatus)
          }
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <button
          type="button"
          onClick={handleUpdate}
          disabled={loading || status === currentStatus}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Status"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className="text-sm text-gray-600"
        >
          {message}
        </p>
      )}
    </div>
  );
}
