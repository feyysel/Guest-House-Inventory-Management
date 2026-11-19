import { getRoomStats } from "@/lib/rooms";

import DashboardClient from "@/components/dashboard-client";
import { roleLabels } from "@/lib/permissions";
import { getSession, requirePermission } from "@/lib/session";
import { getGuesthouseSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("dashboard:view");
  const [roomStats, session, settings] = await Promise.all([
    getRoomStats(),
    getSession(),
    getGuesthouseSettings(),
  ]);

  return (
    <DashboardClient
      roomStats={roomStats}
      guesthouseName={settings.guesthouseName}
      roleLabel={session ? roleLabels[session.role] : "Staff"}
    />
  );
}
