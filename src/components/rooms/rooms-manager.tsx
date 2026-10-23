
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createRoom,
  updateRoom,
  deleteRoom,
  type RoomInput,
} from "@/app/rooms/actions";

type Room = {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  status: string;
  capacity: number;
  pricePerNight: number;
  description: string;
};

const roomTypes = ["SINGLE", "DOUBLE", "TWIN", "DELUXE", "SUITE"];
const roomStatuses = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "INACTIVE",
];

const emptyForm: RoomInput = {
  roomNumber: "",
  name: "",
  type: "SINGLE",
  status: "AVAILABLE",
  capacity: 1,
  pricePerNight: 0,
  description: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function labelStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export default function RoomsManager({
  initialRooms,
}: {
  initialRooms: Room[];
}) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  useEffect(() => {
  setRooms(initialRooms);
}, [initialRooms]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState<RoomInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        `${room.roomNumber} ${room.name} ${room.type}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter = filter === "ALL" || room.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [rooms, search, filter]);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  function startEdit(room: Room) {
    setEditingId(room.id);
    setForm({
      roomNumber: room.roomNumber,
      name: room.name,
      type: room.type,
      status: room.status,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      description: room.description,
    });
    setError("");
    setMessage("");
    document.getElementById("room-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function changeField<K extends keyof RoomInput>(
    key: K,
    value: RoomInput[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function submitRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = editingId
        ? await updateRoom(editingId, form)
        : await createRoom(form);

      if (!result.success) {
        setError(result.error?? "An unknown error occurred");
        return;
      }

      setMessage(editingId ? "Room updated successfully." : "Room added successfully.");
      setEditingId(null);
      setForm(emptyForm);
      router.refresh();
    });
  }

  function removeRoom(room: Room) {
    if (!window.confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await deleteRoom(room.id);

      if (!result.success) {
        setError(result.error?? "An unknown error occurred");
        return;
      }

      setRooms((previous) => previous.filter((item) => item.id !== room.id));
      setMessage(`Room ${room.roomNumber} deleted.`);
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">HAVENSTAY / MANAGEMENT</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Rooms</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage room details, prices, and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={startAdd}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add room
          </button>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total rooms", rooms.length],
            ["Available", rooms.filter((r) => r.status === "AVAILABLE").length],
            ["Occupied", rooms.filter((r) => r.status === "OCCUPIED").length],
            ["Maintenance", rooms.filter((r) => r.status === "MAINTENANCE").length],
          ].map(([title, value]) => (
            <div key={title} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{title}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section id="room-form" className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit room" : "Add a room"}
          </h2>

          <form onSubmit={submitRoom} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">
              Room number *
              <input
                required
                maxLength={30}
                className={inputClass}
                value={form.roomNumber}
                onChange={(e) => changeField("roomNumber", e.target.value)}
                placeholder="e.g. 203"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Room name
              <input
                className={inputClass}
                maxLength={100}
                value={form.name}
                onChange={(e) => changeField("name", e.target.value)}
                placeholder="e.g. Deluxe room"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Room type *
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => changeField("type", e.target.value)}
              >
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{labelStatus(type)}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Capacity *
              <input
                required
                type="number"
                min={1}
                max={50}
                step={1}
                className={inputClass}
                value={form.capacity}
                onChange={(e) => changeField("capacity", Number(e.target.value))}
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Price per night (ETB) *
              <input
                required
                type="number"
                min={0}
                max={100000000}
                step="0.01"
                className={inputClass}
                value={form.pricePerNight}
                onChange={(e) => changeField("pricePerNight", Number(e.target.value))}
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Status *
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => changeField("status", e.target.value)}
              >
                {roomStatuses.map((status) => (
                  <option key={status} value={status}>{labelStatus(status)}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
              Description
              <textarea
                rows={2}
                maxLength={1000}
                className={inputClass}
                value={form.description}
                onChange={(e) => changeField("description", e.target.value)}
                placeholder="Optional room details"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-sm text-green-700 sm:col-span-2 lg:col-span-3">
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <button
                disabled={isPending}
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isPending ? "Saving..." : editingId ? "Save changes" : "Create room"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
            <input
              aria-label="Search rooms"
              className={`${inputClass} sm:max-w-sm`}
              placeholder="Search room number, name, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter by status"
              className={`${inputClass} sm:max-w-48`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              {roomStatuses.map((status) => (
                <option key={status} value={status}>{labelStatus(status)}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Price / night</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold">{room.roomNumber}</p>
                      <p className="mt-1 text-xs text-gray-500">{room.name || "—"}</p>
                    </td>
                    <td className="px-5 py-4">{labelStatus(room.type)}</td>
                    <td className="px-5 py-4">{room.capacity} guests</td>
                    <td className="px-5 py-4 font-medium">
                      {room.pricePerNight.toLocaleString()} ETB
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                        {labelStatus(room.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(room)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => removeRoom(room)}
                          className="font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      No rooms match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </div>
        </section>
      </div>
    </main>
  );
}
