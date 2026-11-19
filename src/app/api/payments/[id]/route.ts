
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiPermission } from "@/lib/api-auth";

const paymentStatuses = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const;

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const denied = await requireApiPermission("payments:update");
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (
      typeof status !== "string" ||
      !paymentStatuses.includes(status as (typeof paymentStatuses)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid payment status." },
        { status: 400 }
      );
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: status as (typeof paymentStatuses)[number],
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Payment status update error:", error);

    return NextResponse.json(
      { error: "Failed to update payment status." },
      { status: 500 }
    );
  }
}
