import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  permissionLabels,
  roleLabels,
  rolePermissions,
} from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import UsersManager from "./users-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await requirePermission("users:view");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <UsersManager
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt.toISOString().slice(0, 10),
      }))}
      currentUserId={currentUser.id}
      roleLabels={roleLabels}
      roles={Object.values(UserRole)}
      rolePermissions={rolePermissions}
      permissionLabels={permissionLabels}
    />
  );
}
