import { requirePermission } from "@/lib/session";

export default async function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("payments:view");
  return children;
}
