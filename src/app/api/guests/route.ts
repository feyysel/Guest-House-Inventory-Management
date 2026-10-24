
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
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

    const guest = await prisma.guest.create({
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

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error("Create guest error:", error);

    return NextResponse.json(
      { error: "Unable to create guest. Please try again." },
      { status: 500 }
    );
  }
}
