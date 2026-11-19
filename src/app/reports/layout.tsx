import { requirePermission } from "@/lib/session";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("reports:view");
  return children;
}
