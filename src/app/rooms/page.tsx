
import { prisma } from "@/lib/db";
import RoomsManager from "@/components/rooms/rooms-manager";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
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

  return <RoomsManager initialRooms={rooms} />;
}
