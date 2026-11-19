
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiPermission } from "@/lib/api-auth";

export async function GET() {
  const denied = await requireApiPermission("payments:view");
  if (denied) return denied;

  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        guest: true,
        room: true,
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedReservations = reservations.map((reservation) => {
      const totalAmount = Number(reservation.totalAmount);
      const amountPaid = reservation.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      return {
        id: reservation.id,
        bookingCode: reservation.bookingCode,
        guest: {
          firstName: reservation.guest.firstName,
          lastName: reservation.guest.lastName,
        },
        room: {
          name: reservation.room.name ?? reservation.room.roomNumber,
        },
        totalAmount,
        amountPaid,
        balance: Math.max(0, totalAmount - amountPaid),
      };
    });

    return NextResponse.json({
      reservations: formattedReservations,
    });
  } catch (error) {
    console.error("Load payment reservations error:", error);

    return NextResponse.json(
      { error: "Unable to load reservations." },
      { status: 500 }
    );
  }
}
