import { requirePermission } from "@/lib/session";

export default async function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("rooms:view");
  return children;
}
