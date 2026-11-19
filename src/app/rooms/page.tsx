
import { prisma } from "@/lib/db";
import RoomsManager from "@/components/rooms/rooms-manager";
import { can } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const user = await requirePermission("rooms:view");
  const databaseRooms = await prisma.room.findMany({
    orderBy: { roomNumber: "asc" },
  });

  const rooms = databaseRooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    name: room.name ?? "",
    type: room.type,
    status: room.status,
    capacity: room.capacity,
    pricePerNight: Number(room.pricePerNight),
    description: room.description ?? "",
  }));

  return (
    <RoomsManager
      key={rooms
        .map(
          (room) =>
            `${room.id}:${room.roomNumber}:${room.status}:${room.pricePerNight}`,
        )
        .join("|")}
      initialRooms={rooms}
      canDelete={can(user.role, "rooms:delete")}
    />
  );
}
