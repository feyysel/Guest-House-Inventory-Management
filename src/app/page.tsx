import { getRoomStats } from "@/lib/rooms";

import DashboardClient from "@/components/dashboard-client";
import { requirePermission } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("dashboard:view");
  const roomStats = await getRoomStats();

  return <DashboardClient roomStats={roomStats} />;
}
