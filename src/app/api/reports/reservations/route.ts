
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "Start date and end date are required." },
        { status: 400 }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startParam) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endParam)
    ) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const startDate = new Date(`${startParam}T00:00:00.000Z`);
    const endDate = new Date(`${endParam}T23:59:59.999Z`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid date." },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date." },
        { status: 400 }
      );
    }

    const reservations = await prisma.reservation.groupBy({
      by: ["status"],
      where: {
        checkIn: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        _all: true,
      },
    });

    const statuses = [
      "PENDING",
      "CONFIRMED",
      "CHECKED_IN",
      "CHECKED_OUT",
      "CANCELLED",
      "NO_SHOW",
    ] as const;

    const counts = Object.fromEntries(
      statuses.map((status) => [
        status,
        reservations.find((item) => item.status === status)?._count._all ?? 0,
      ])
    );

    return NextResponse.json({
      reservationCounts: counts,
      totalReservations: reservations.reduce(
        (total, item) => total + item._count._all,
        0
      ),
      startDate: startParam,
      endDate: endParam,
    });
  } catch (error) {
    console.error("Failed to load reservation analytics:", error);

    return NextResponse.json(
      { error: "Failed to load reservation analytics." },
      { status: 500 }
    );
  }
}
