
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date");

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "A valid date is required (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    const date = new Date(`${dateParam}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateParam) {
      return NextResponse.json(
        { error: "Invalid date." },
        { status: 400 }
      );
    }

    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const [totalRooms, maintenanceRooms, inactiveRooms, occupiedRooms] =
      await Promise.all([
        prisma.room.count(),
        prisma.room.count({ where: { status: "MAINTENANCE" } }),
        prisma.room.count({ where: { status: "INACTIVE" } }),
        prisma.room.count({
          where: {
            reservations: {
              some: {
                status: "CHECKED_IN",
                checkIn: { lt: nextDate },
                checkOut: { gt: date },
              },
            },
          },
        }),
      ]);

    const unavailableRooms = maintenanceRooms + inactiveRooms;
    const usableRooms = totalRooms - unavailableRooms;
    const availableRooms = Math.max(0, usableRooms - occupiedRooms);
    const occupancyRate =
      usableRooms > 0
        ? Math.round((occupiedRooms / usableRooms) * 100)
        : 0;

    return NextResponse.json({
      date: dateParam,
      totalRooms,
      usableRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      inactiveRooms,
      occupancyRate,
    });
  } catch (error) {
    console.error("Occupancy report error:", error);

    return NextResponse.json(
      { error: "Failed to generate occupancy report." },
      { status: 500 }
    );
  }
}
