"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import {
  clearSessionCookie,
  setSessionCookie,
  type SessionUser,
} from "@/lib/session";

export type LoginResult = { error?: string; user?: SessionUser };

export async function signIn(
  email: string,
  password: string
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password, or the account is inactive." };
  }

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  await setSessionCookie(sessionUser);

  return { user: sessionUser };
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
