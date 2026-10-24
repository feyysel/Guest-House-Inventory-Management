
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  nationality: string | null;
  notes: string | null;
};

export default function EditGuestForm({ guest }: { guest: Guest }) {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    email: guest.email ?? "",
    address: guest.address ?? "",
    nationality: guest.nationality ?? "",
    notes: guest.notes ?? "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to update guest.");
        return;
      }

      router.push(`/guests/${guest.id}`);
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Edit Guest Information
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Update the guest's details below.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">
          First Name *
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
            maxLength={100}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Last Name *
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
            maxLength={100}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Phone Number *
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            maxLength={30}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            maxLength={254}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Address
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            maxLength={200}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Nationality
          <input
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            maxLength={100}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-700">
        Notes
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={4}
          maxLength={2000}
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/guests/${guest.id}`)}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
