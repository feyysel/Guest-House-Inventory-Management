
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam
      ? new Date(`${startDateParam}T00:00:00.000Z`)
      : null;

    const endDate = endDateParam
      ? new Date(`${endDateParam}T23:59:59.999Z`)
      : null;

    if (
      (startDateParam && (!startDate || Number.isNaN(startDate.getTime()))) ||
      (endDateParam && (!endDate || Number.isNaN(endDate.getTime())))
    ) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date." },
        { status: 400 }
      );
    }

    const paymentDateFilter = {
      ...(startDate || endDate
        ? {
            paidAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [
      completedPayments,
      pendingPayments,
      reservationCount,
      totalRooms,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          ...paymentDateFilter,
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "PENDING",
          ...paymentDateFilter,
        },
        _sum: { amount: true },
      }),
      prisma.reservation.count({
        where:
          startDate || endDate
            ? {
                checkIn: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {},
      }),
      prisma.room.count(),
    ]);

    return NextResponse.json({
      totalRevenue: Number(completedPayments._sum.amount ?? 0),
      pendingPayments: Number(pendingPayments._sum.amount ?? 0),
      reservationCount,
      totalRooms,
      startDate: startDateParam,
      endDate: endDateParam,
    });
  } catch (error) {
    console.error("Failed to load report summary:", error);

    return NextResponse.json(
      { error: "Failed to load report summary." },
      { status: 500 }
    );
  }
}
