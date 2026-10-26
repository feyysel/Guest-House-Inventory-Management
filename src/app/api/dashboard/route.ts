
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function getAddisAbabaDayRange() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const date = `${values.year}-${values.month}-${values.day}`;
  const start = new Date(`${date}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export async function GET() {
  try {
    const { start, end } = getAddisAbabaDayRange();

    const [
      rooms,
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      inactiveRooms,
      pendingReservations,
      todayArrivals,
      todayDepartures,
      todayRevenue,
      recentReservations,
      settings,
    ] = await Promise.all([
      prisma.room.findMany({
        orderBy: { roomNumber: "asc" },
        select: {
          id: true,
          roomNumber: true,
          name: true,
          type: true,
          status: true,
          pricePerNight: true,
        },
      }),
      prisma.room.count(),
      prisma.room.count({ where: { status: "AVAILABLE" } }),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.room.count({ where: { status: "MAINTENANCE" } }),
      prisma.room.count({ where: { status: "INACTIVE" } }),
      prisma.reservation.count({
        where: { status: "PENDING" },
      }),
      prisma.reservation.count({
        where: {
          checkIn: { gte: start, lt: end },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
      }),
      prisma.reservation.count({
        where: {
          checkOut: { gte: start, lt: end },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          paidAt: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.reservation.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          guest: {
            select: { firstName: true, lastName: true },
          },
          room: {
            select: { roomNumber: true, type: true },
          },
        },
      }),
      prisma.guestHouseSettings.findFirst(),
    ]);

    return NextResponse.json({
      date: start.toISOString(),
      settings: {
        guesthouseName:
          settings?.guesthouseName ?? "HavenStay Guest House",
        currency: settings?.currency ?? "ETB",
      },
      roomStats: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        inactive: inactiveRooms,
      },
      activity: {
        arrivals: todayArrivals,
        departures: todayDepartures,
        pendingReservations,
      },
      todayRevenue: Number(todayRevenue._sum.amount ?? 0),
      rooms: rooms.map((room) => ({
        ...room,
        pricePerNight: Number(room.pricePerNight),
      })),
      recentReservations: recentReservations.map((reservation) => ({
        id: reservation.id,
        bookingCode: reservation.bookingCode,
        guest: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
        room: reservation.room.roomNumber,
        roomType: reservation.room.type,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        amount: Number(reservation.totalAmount),
        status: reservation.status,
        createdAt: reservation.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Unable to load dashboard data." },
      { status: 500 },
    );
  }
}
