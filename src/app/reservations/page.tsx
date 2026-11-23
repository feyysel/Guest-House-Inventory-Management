
import { prisma } from "@/lib/db";
import { calculateStayBilling } from "@/lib/reservation-billing";
import ReservationsManager from "@/components/reservations/reservations-manager";
import { requirePermission } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  await requirePermission("reservations:view");

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

    const billing = calculateStayBilling({
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      totalAmount,
      status: reservation.status,
      pricePerNight: Number(reservation.room.pricePerNight),
      amountPaid,
    });

    return {
      id: reservation.id,
      bookingCode: reservation.bookingCode,
      guestName: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
      phone: reservation.guest.phone,
      roomNumber: reservation.room.roomNumber,
      checkIn: reservation.checkIn.toISOString().slice(0, 10),
      checkOut: reservation.checkOut.toISOString().slice(0, 10),
      openEnded: reservation.openEnded,
      adults: reservation.adults,
      children: reservation.children,
      status: reservation.status,
      totalAmount: billing.currentTotal,
      amountPaid,
      balance: billing.balance,
      currentNights: billing.chargedNights,
      currentTotal: billing.currentTotal,
      currentBalance: billing.balance,
      extraNights: billing.extraNights,
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
      key={[
        reservations
          .map(
            (reservation) =>
              `${reservation.id}:${reservation.status}:${reservation.currentTotal}:${reservation.amountPaid}`,
          )
          .join("|"),
        rooms.map((room) => `${room.id}:${room.status}`).join("|"),
      ].join("#")}
      initialReservations={reservations}
      rooms={rooms}
    />
  );
}
