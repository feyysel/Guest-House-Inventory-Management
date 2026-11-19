
"use server";

import { revalidatePath } from "next/cache";
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ReservationStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/session";

export type ReservationInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  notes?: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentTransactionRef?: string;
};

export type ReservationActionResult = {
  success: boolean;
  message: string;
  bookingCode?: string;
};

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

export async function createReservation(
  input: ReservationInput
): Promise<ReservationActionResult> {
  const auth = await authorize("reservations:create");
  if (auth.error) return { success: false, message: auth.error };

  try {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phone = input.phone.trim();
    const email = input.email?.trim() || null;
    const notes = input.notes?.trim() || null;

    if (!firstName || !lastName || !phone) {
      return {
        success: false,
        message: "Guest first name, last name, and phone are required.",
      };
    }

    if (firstName.length > 100 || lastName.length > 100) {
      return {
        success: false,
        message: "Guest names must be 100 characters or fewer.",
      };
    }

    if (phone.length > 30) {
      return {
        success: false,
        message: "Phone number must be 30 characters or fewer.",
      };
    }

    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
      return {
        success: false,
        message: "Enter a valid email address.",
      };
    }

    if (!input.roomId.trim()) {
      return {
        success: false,
        message: "Please select a room.",
      };
    }

    if (
      !Number.isInteger(input.adults) ||
      input.adults < 1 ||
      input.adults > 50 ||
      !Number.isInteger(input.children) ||
      input.children < 0 ||
      input.children > 50
    ) {
      return {
        success: false,
        message: "Enter valid numbers of adults and children.",
      };
    }

    const paymentAmount = Number(input.paymentAmount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return {
        success: false,
        message: "Enter the deposit amount paid at reservation.",
      };
    }

    const paymentMethod = String(input.paymentMethod ?? "").trim();

    if (
      !Object.values(PaymentMethod).includes(
        paymentMethod as PaymentMethod
      )
    ) {
      return {
        success: false,
        message: "Please select a valid payment method.",
      };
    }

    const paymentTransactionRef =
      input.paymentTransactionRef?.trim() || null;

    if (paymentTransactionRef && paymentTransactionRef.length > 191) {
      return {
        success: false,
        message: "Transaction reference must be 191 characters or fewer.",
      };
    }

    const checkIn = parseDate(input.checkIn);
    const checkOut = parseDate(input.checkOut);

    if (!checkIn || !checkOut) {
      return {
        success: false,
        message: "Enter valid check-in and check-out dates.",
      };
    }

    if (checkOut <= checkIn) {
      return {
        success: false,
        message: "Check-out must be after check-in.",
      };
    }

    const nights =
      (checkOut.getTime() - checkIn.getTime()) /
      (1000 * 60 * 60 * 24);

    const reservation = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: input.roomId },
      });

      if (!room) {
        throw new Error("ROOM_NOT_FOUND");
      }

     if (
  room.status === "MAINTENANCE" ||
  room.status === "INACTIVE"
) {
  throw new Error("ROOM_NOT_AVAILABLE");
}

      if (input.adults + input.children > room.capacity) {
        throw new Error("ROOM_CAPACITY_EXCEEDED");
      }

      const conflict = await tx.reservation.findFirst({
        where: {
          roomId: room.id,
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
              ReservationStatus.CHECKED_IN,
            ],
          },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new Error("DATES_UNAVAILABLE");
      }

      const guest = await tx.guest.create({
        data: {
          firstName,
          lastName,
          phone,
          ...(email ? { email } : {}),
        },
      });

      const totalAmount = room.pricePerNight.mul(nights);
      const minimumDeposit = totalAmount.div(2);

      if (new Prisma.Decimal(paymentAmount).lt(minimumDeposit)) {
        throw new Error(
          `DEPOSIT_BELOW_MINIMUM:${minimumDeposit.toFixed(2)}`
        );
      }

      return tx.reservation.create({
        data: {
          guestId: guest.id,
          roomId: room.id,
          checkIn,
          checkOut,
          adults: input.adults,
          children: input.children,
          status: ReservationStatus.PENDING,
          totalAmount,
          ...(notes ? { notes } : {}),
          payments: {
            create: {
              amount: paymentAmount,
              method: paymentMethod as PaymentMethod,
              status: PaymentStatus.COMPLETED,
              ...(paymentTransactionRef
                ? { transactionRef: paymentTransactionRef }
                : {}),
            },
          },
        },
        select: {
          bookingCode: true,
          totalAmount: true,
        },
      });
    });

    revalidatePath("/reservations");
    revalidatePath("/");
    revalidatePath("/rooms");

    return {
      success: true,
      message: `Reservation created successfully. Total: ETB ${reservation.totalAmount.toFixed(2)}. Deposit paid: ETB ${paymentAmount.toFixed(2)}.`,
      bookingCode: reservation.bookingCode,
    };
  } catch (error) {
    console.error("Create reservation failed:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "ROOM_NOT_FOUND":
          return { success: false, message: "The selected room was not found." };

        case "ROOM_NOT_AVAILABLE":
          return {
            success: false,
            message: "This room is not available for booking.",
          };

        case "ROOM_CAPACITY_EXCEEDED":
          return {
            success: false,
            message: "The number of guests exceeds the room capacity.",
          };

        case "DATES_UNAVAILABLE":
          return {
            success: false,
            message: "This room already has a reservation during those dates.",
          };
      }

      if (error.message.startsWith("DEPOSIT_BELOW_MINIMUM:")) {
        const minimum = error.message.split(":")[1];
        return {
          success: false,
          message: `A deposit of at least ETB ${minimum} (50% of the room total) is required to reserve.`,
        };
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          success: false,
          message: "The selected room or guest is no longer available.",
        };
      }

      if (error.code === "P2002") {
        return {
          success: false,
          message: "That transaction reference is already in use.",
        };
      }
    }

    return {
      success: false,
      message: "Could not create the reservation. Please try again.",
    };
  }
}


export async function updateReservationStatus(
  reservationId: string,
  nextStatus: ReservationStatus
): Promise<ReservationActionResult> {
  const auth = await authorize("reservations:update");
  if (auth.error) return { success: false, message: auth.error };

  const allowedTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
    CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
    CHECKED_IN: ["CHECKED_OUT"],
    CHECKED_OUT: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  try {
    if (
      !Object.prototype.hasOwnProperty.call(
        allowedTransitions,
        nextStatus
      )
    ) {
      return {
        success: false,
        message: "Invalid reservation status.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: {
          id: true,
          roomId: true,
          status: true,
          totalAmount: true,
        },
      });

      if (!reservation) {
        throw new Error("RESERVATION_NOT_FOUND");
      }

      if (!allowedTransitions[reservation.status]?.includes(nextStatus)) {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      if (
        nextStatus === ReservationStatus.CHECKED_IN ||
        nextStatus === ReservationStatus.CHECKED_OUT
      ) {
        const paymentTotal = await tx.payment.aggregate({
          where: {
            reservationId: reservation.id,
            status: PaymentStatus.COMPLETED,
          },
          _sum: { amount: true },
        });

        const amountPaid = paymentTotal._sum.amount ?? new Prisma.Decimal(0);

        if (amountPaid.lt(reservation.totalAmount)) {
          const remaining = reservation.totalAmount.minus(amountPaid);
          throw new Error(`FULL_PAYMENT_REQUIRED:${remaining.toFixed(2)}`);
        }
      }

      if (nextStatus === ReservationStatus.CHECKED_IN) {
        const room = await tx.room.findUnique({
          where: { id: reservation.roomId },
          select: { status: true },
        });

        if (!room || room.status !== "AVAILABLE") {
          throw new Error("ROOM_NOT_AVAILABLE");
        }
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: nextStatus },
      });

      if (nextStatus === ReservationStatus.CHECKED_IN) {
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: "OCCUPIED" },
        });
      }

      if (nextStatus === ReservationStatus.CHECKED_OUT) {
        const otherActiveStay = await tx.reservation.findFirst({
          where: {
            roomId: reservation.roomId,
            id: { not: reservation.id },
            status: ReservationStatus.CHECKED_IN,
          },
          select: { id: true },
        });

        if (!otherActiveStay) {
          await tx.room.update({
            where: { id: reservation.roomId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      if (
        nextStatus === ReservationStatus.CANCELLED ||
        nextStatus === ReservationStatus.NO_SHOW
      ) {
        const otherActiveStay = await tx.reservation.findFirst({
          where: {
            roomId: reservation.roomId,
            id: { not: reservation.id },
            status: ReservationStatus.CHECKED_IN,
          },
          select: { id: true },
        });

        if (!otherActiveStay) {
          await tx.room.updateMany({
            where: {
              id: reservation.roomId,
              status: "OCCUPIED",
            },
            data: { status: "AVAILABLE" },
          });
        }
      }

      return reservation;
    });

    revalidatePath("/reservations");
    revalidatePath("/rooms");
    revalidatePath("/");

    return {
      success: true,
      message: `Reservation status updated to ${nextStatus
        .replaceAll("_", " ")
        .toLowerCase()}.`,
    };
  } catch (error) {
    console.error("Update reservation status failed:", error);

    if (error instanceof Error) {
      if (error.message === "RESERVATION_NOT_FOUND") {
        return {
          success: false,
          message: "Reservation not found.",
        };
      }

      if (error.message === "INVALID_STATUS_TRANSITION") {
        return {
          success: false,
          message: "This reservation cannot move to that status.",
        };
      }

      if (error.message === "ROOM_NOT_AVAILABLE") {
        return {
          success: false,
          message:
            "This room is not currently available. Check its status before checking in.",
        };
      }

      if (error.message.startsWith("FULL_PAYMENT_REQUIRED:")) {
        const remaining = error.message.split(":")[1];
        return {
          success: false,
          message: `The full room price must be paid before check-in or check-out. Remaining balance: ETB ${remaining}.`,
        };
      }
    }

    return {
      success: false,
      message: "Could not update the reservation. Please try again.",
    };
  }
}

