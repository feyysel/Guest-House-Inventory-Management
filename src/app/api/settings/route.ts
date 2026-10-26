
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.guestHouseSettings.findFirst();

    return NextResponse.json(
      settings ?? {
        guesthouseName: "HavenStay Guest House",
        email: "",
        phone: "",
        address: "",
        checkInTime: "12:00",
        checkOutTime: "11:00",
        currency: "ETB",
      },
    );
  } catch (error) {
    console.error("Failed to load guesthouse settings:", error);

    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const guesthouseName =
      typeof body.guesthouseName === "string"
        ? body.guesthouseName.trim()
        : "";

    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const address =
      typeof body.address === "string" ? body.address.trim() : "";
    const checkInTime = body.checkInTime;
    const checkOutTime = body.checkOutTime;
    const currency = body.currency;

    const validTime = (value: unknown) =>
      typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

    if (!guesthouseName) {
      return NextResponse.json(
        { error: "Guesthouse name is required." },
        { status: 400 },
      );
    }

    if (!validTime(checkInTime) || !validTime(checkOutTime)) {
      return NextResponse.json(
        { error: "Please provide valid check-in and check-out times." },
        { status: 400 },
      );
    }

    if (!["ETB", "USD", "EUR"].includes(currency)) {
      return NextResponse.json(
        { error: "Please select a supported currency." },
        { status: 400 },
      );
    }

    const existing = await prisma.guestHouseSettings.findFirst();

    const data = {
      guesthouseName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      checkInTime,
      checkOutTime,
      currency,
    };

    const settings = existing
      ? await prisma.guestHouseSettings.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.guestHouseSettings.create({ data });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to save guesthouse settings:", error);

    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 },
    );
  }
}
