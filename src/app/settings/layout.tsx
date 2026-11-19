import { requirePermission } from "@/lib/session";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("settings:view");
  return children;
}
