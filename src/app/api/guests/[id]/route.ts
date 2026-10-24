
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const address = String(body.address ?? "").trim();
    const nationality = String(body.nationality ?? "").trim();
    const notes = String(body.notes ?? "").trim();

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required." },
        { status: 400 }
      );
    }

    const existingGuest = await prisma.guest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingGuest) {
      return NextResponse.json(
        { error: "Guest not found." },
        { status: 404 }
      );
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null,
        nationality: nationality || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Update guest error:", error);

    return NextResponse.json(
      { error: "Unable to update guest. Please try again." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found." },
        { status: 404 }
      );
    }

    if (guest._count.reservations > 0) {
      return NextResponse.json(
        {
          error:
            "This guest cannot be deleted because they have reservation history.",
        },
        { status: 409 }
      );
    }

    await prisma.guest.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Guest deleted successfully.",
    });
  } catch (error) {
    console.error("Delete guest error:", error);

    return NextResponse.json(
      { error: "Unable to delete guest. Please try again." },
      { status: 500 }
    );
  }
}