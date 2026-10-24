
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        guest: true,
        room: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedReservations = reservations.map((reservation) => ({
      id: reservation.id,
      bookingCode: reservation.bookingCode,
      guest: {
        firstName: reservation.guest.firstName,
        lastName: reservation.guest.lastName,
      },
      room: {
        name: reservation.room.name ?? reservation.room.roomNumber,
      },
      totalAmount: Number(reservation.totalAmount),
    }));

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
