import { requirePermission } from "@/lib/session";

export default async function ReservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("reservations:view");
  return children;
}
