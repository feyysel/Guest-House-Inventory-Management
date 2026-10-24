
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  reservationCount: number;
};

export default function GuestsTable({ guests }: { guests: Guest[] }) {
  const [search, setSearch] = useState("");

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return guests;

    return guests.filter((guest) =>
      [
        guest.firstName,
        guest.lastName,
        `${guest.firstName} ${guest.lastName}`,
        guest.phone ?? "",
        guest.email ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [guests, search]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Registered Guests
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredGuests.length} of {guests.length} guests
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, or email..."
          aria-label="Search guests"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
        />
      </div>

      {filteredGuests.length === 0 ? (
        <div className="p-10 text-center">
          <h3 className="font-semibold text-gray-900">
            {guests.length === 0 ? "No guests found" : "No matching guests"}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {guests.length === 0
              ? "Guests will appear here when reservations are created."
              : "Try another name, phone number, or email address."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Guest</th>
                <th className="px-5 py-4 font-semibold">Phone</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Reservations</th>
                <th className="px-5 py-4 font-semibold">Registered</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
  <Link
    href={`/guests/${guest.id}`}
    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
  >
    {guest.firstName} {guest.lastName}
  </Link>
</td>
                  <td className="px-5 py-4 text-gray-600">
                    {guest.phone || "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {guest.email || "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {guest.reservationCount}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(guest.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
