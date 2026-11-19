import { NextResponse } from "next/server";
import { getGuesthouseSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const [session, settings] = await Promise.all([
    getSession(),
    getGuesthouseSettings(),
  ]);

  return NextResponse.json({
    user: session,
    guesthouseName: settings.guesthouseName,
  });
}
