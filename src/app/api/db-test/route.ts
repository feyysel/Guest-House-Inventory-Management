
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { getGuesthouseSettings } from "@/lib/settings";

export async function GET() {
  const denied = await requireApiPermission("settings:update");
  if (denied) return denied;

  try {
    await prisma.$queryRaw`SELECT 1`;
    const settings = await getGuesthouseSettings();

    return NextResponse.json({
      success: true,
      message: `${settings.guesthouseName} is connected to PostgreSQL.`,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed.",
      },
      { status: 500 }
    );
  }
}
