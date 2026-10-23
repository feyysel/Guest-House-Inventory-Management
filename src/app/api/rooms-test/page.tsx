
import { getRooms, getRoomStats } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function RoomsTestPage() {
  const [rooms, stats] = await Promise.all([
    getRooms(),
    getRoomStats(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">HavenStay Rooms</h1>
          <p className="mt-2 text-gray-600">
            Live room information from PostgreSQL
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Total Rooms", stats.total],
            ["Available", stats.available],
            ["Occupied", stats.occupied],
            ["Maintenance", stats.maintenance],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">Room</th>
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Price/Night</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-t">
                  <td className="p-4 font-medium">{room.roomNumber}</td>
                  <td className="p-4">{room.name ?? "—"}</td>
                  <td className="p-4">{room.type}</td>
                  <td className="p-4">{room.capacity}</td>
                  <td className="p-4">
                    {Number(room.pricePerNight).toLocaleString()} ETB
                  </td>
                  <td className="p-4">{room.status}</td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    No rooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
