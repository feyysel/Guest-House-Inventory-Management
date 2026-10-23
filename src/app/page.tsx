import { getRoomStats } from "@/lib/rooms";

import DashboardClient from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const roomStats = await getRoomStats();

  return <DashboardClient roomStats={roomStats} />;
}
