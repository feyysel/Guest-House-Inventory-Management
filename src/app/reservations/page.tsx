
import { prisma } from "@/lib/db";
import ReservationsManager from "@/components/reservations/reservations-manager";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const [databaseReservations, databaseRooms] = await Promise.all([
    prisma.reservation.findMany({
      include: {
        guest: true,
        room: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.room.findMany({
      where: {
        status: "AVAILABLE",
      },
      orderBy: {
        roomNumber: "asc",
      },
    }),
  ]);

  const reservations = databaseReservations.map((reservation) => ({
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
    totalAmount: Number(reservation.totalAmount),
  }));

  const rooms = databaseRooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    name: room.name ?? "",
    type: room.type,
    capacity: room.capacity,
    pricePerNight: Number(room.pricePerNight),
  }));

  return (
    <ReservationsManager
      initialReservations={reservations}
      rooms={rooms}
    />
  );
}
