"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export type LoginResult = { error?: string };

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

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect("/");
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
