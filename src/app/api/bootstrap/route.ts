import { NextResponse } from "next/server";
import { getGuesthouseSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [session, settings] = await Promise.all([
      getSession(),
      getGuesthouseSettings(),
    ]);

    let pendingReservations = 0;
    if (session && can(session.role, "reservations:view")) {
      pendingReservations = await prisma.reservation.count({
        where: { status: "PENDING" },
      });
    }

    return NextResponse.json({
      user: session,
      guesthouseName: settings.guesthouseName,
      pendingReservations,
    });
  } catch (error) {
    console.error("Bootstrap API error:", error);
    return NextResponse.json(
      { error: "Unable to load bootstrap data." },
      { status: 500 },
    );
  }
}
