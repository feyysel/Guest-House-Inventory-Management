import { NextResponse } from "next/server";
import { can, type Permission } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export async function requireApiPermission(permission: Permission) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to continue." },
      { status: 401 }
    );
  }

  if (!can(user.role, permission)) {
    return NextResponse.json(
      { error: "You do not have permission to do that." },
      { status: 403 }
    );
  }

  return null;
}
