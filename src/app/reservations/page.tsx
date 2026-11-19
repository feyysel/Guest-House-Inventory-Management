
import { prisma } from "@/lib/db";
import ReservationsManager from "@/components/reservations/reservations-manager";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const [databaseReservations, databaseRooms, databaseActiveBookings] =
    await Promise.all([
      prisma.reservation.findMany({
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
      }),

      prisma.room.findMany({
        orderBy: {
          roomNumber: "asc",
        },
      }),

      prisma.reservation.findMany({
        where: {
          status: {
            in: ["PENDING", "CONFIRMED", "CHECKED_IN"],
          },
        },
        select: {
          roomId: true,
          checkIn: true,
          checkOut: true,
        },
      }),
    ]);

  const reservations = databaseReservations.map((reservation) => {
    const totalAmount = Number(reservation.totalAmount);
    const amountPaid = reservation.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return {
      id: reservation.id,
      bookingCode: reservation.bookingCode,
      guestName: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
      phone: reservation.guest.phone,
      roomNumber: reservation.room.roomNumber,
      checkIn: reservation.checkIn.toISOString().slice(0, 10),
      checkOut: reservation.checkOut.toISOString().slice(0, 10),
      adults: reservation.adults,
      children: reservation.children,
      status: reservation.status,
      totalAmount,
      amountPaid,
      balance: Math.max(0, totalAmount - amountPaid),
    };
  });

  const rooms = databaseRooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    name: room.name ?? "",
    type: room.type,
    status: room.status,
    capacity: room.capacity,
    pricePerNight: Number(room.pricePerNight),
    bookings: databaseActiveBookings
      .filter((booking) => booking.roomId === room.id)
      .map((booking) => ({
        checkIn: booking.checkIn.toISOString().slice(0, 10),
        checkOut: booking.checkOut.toISOString().slice(0, 10),
      })),
  }));

  return (
    <ReservationsManager
      initialReservations={reservations}
      rooms={rooms}
    />
  );
}
