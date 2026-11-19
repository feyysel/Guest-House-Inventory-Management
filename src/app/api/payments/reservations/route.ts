
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiPermission } from "@/lib/api-auth";
import { CACHE_KEYS, cachedJson } from "@/lib/redis-cache";
import { calculateStayBilling } from "@/lib/reservation-billing";

export async function GET() {
  const denied = await requireApiPermission("payments:view");
  if (denied) return denied;

  try {
    const data = await cachedJson(
      CACHE_KEYS.paymentReservations,
      10,
      async () => {
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

        return {
          reservations: reservations.map((reservation) => {
            const amountPaid = reservation.payments.reduce(
              (sum, payment) => sum + Number(payment.amount),
              0
            );

            const billing = calculateStayBilling({
              checkIn: reservation.checkIn,
              checkOut: reservation.checkOut,
              totalAmount: Number(reservation.totalAmount),
              status: reservation.status,
              pricePerNight: Number(reservation.room.pricePerNight),
              amountPaid,
            });

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
              totalAmount: billing.currentTotal,
              amountPaid,
              balance: billing.balance,
              openEnded: reservation.openEnded,
              currentNights: billing.chargedNights,
              extraNights: billing.extraNights,
            };
          }),
        };
      }
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Load payment reservations error:", error);

    return NextResponse.json(
      { error: "Unable to load reservations." },
      { status: 500 },
    );
  }
}
