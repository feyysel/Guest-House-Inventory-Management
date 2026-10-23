
import { prisma } from "@/lib/db";

export async function getRooms() {
  return prisma.room.findMany({
    orderBy: {
      roomNumber: "asc",
    },
  });
}

export async function getRoomStats() {
  const [total, available, occupied, maintenance] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({
      where: { status: "AVAILABLE" },
    }),
    prisma.room.count({
      where: { status: "OCCUPIED" },
    }),
    prisma.room.count({
      where: { status: "MAINTENANCE" },
    }),
  ]);

  return { total, available, occupied, maintenance };
}
