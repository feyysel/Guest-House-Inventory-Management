
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

    const startDate = new Date(`${startParam}T00:00:00.000Z`);
    const endDate = new Date(`${endParam}T23:59:59.999Z`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startParam) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endParam)
    ) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date." },
        { status: 400 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        paidAt: true,
        amount: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    const dailyRevenue = new Map<string, number>();

    for (const payment of payments) {
      const date = payment.paidAt.toISOString().slice(0, 10);
      const amount = Number(payment.amount);

      dailyRevenue.set(
        date,
        (dailyRevenue.get(date) ?? 0) + amount
      );
    }

    return NextResponse.json({
      dailyRevenue: Array.from(dailyRevenue, ([date, revenue]) => ({
        date,
        revenue,
      })),
    });
  } catch (error) {
    console.error("Failed to load daily revenue:", error);

    return NextResponse.json(
      { error: "Failed to load daily revenue." },
      { status: 500 }
    );
  }
}
