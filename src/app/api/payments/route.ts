
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const paymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "TELEBIRR",
  "CARD",
  "OTHER",
] as const;

const paymentStatuses = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const reservationId = String(body.reservationId ?? "").trim();
    const amount = Number(body.amount);
    const method = String(body.method ?? "").trim();
    const status = String(body.status ?? "COMPLETED").trim();
    const transactionRef = String(body.transactionRef ?? "").trim();
    const notes = String(body.notes ?? "").trim();

    if (!reservationId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "A reservation and a valid positive amount are required." },
        { status: 400 }
      );
    }

    if (
      !paymentMethods.includes(method as (typeof paymentMethods)[number])
    ) {
      return NextResponse.json(
        { error: "Please select a valid payment method." },
        { status: 400 }
      );
    }

    if (
      !paymentStatuses.includes(status as (typeof paymentStatuses)[number])
    ) {
      return NextResponse.json(
        { error: "Please select a valid payment status." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "The selected reservation does not exist." },
        { status: 404 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        reservationId,
        amount,
        method: method as (typeof paymentMethods)[number],
        status: status as (typeof paymentStatuses)[number],
        transactionRef: transactionRef || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This transaction reference is already in use." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to record payment. Please try again." },
      { status: 500 }
    );
  }
}
