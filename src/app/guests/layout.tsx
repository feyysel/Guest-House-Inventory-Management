import { requirePermission } from "@/lib/session";

export default async function GuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("guests:view");
  return children;
}
