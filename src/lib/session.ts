import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { can, type Permission } from "@/lib/permissions";

export const SESSION_COOKIE = "havenstay_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

const sessionSecret =
  process.env.SESSION_SECRET ?? "havenstay-development-secret-change-me";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type SessionPayload = SessionUser & { expiresAt: number };

function sign(value: string): string {
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function createToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function readToken(token: string): SessionUser | null {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);

  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;

    if (
      !payload.id ||
      !payload.name ||
      !payload.email ||
      !Object.values(UserRole).includes(payload.role) ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export const getSession = cache(
  async (): Promise<SessionUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    const sessionUser = readToken(token);

    if (!sessionUser) return null;

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
);

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!can(user.role, permission)) {
    redirect("/unauthorized");
  }

  return user;
}

export type AuthResult =
  | { user: SessionUser; error: null }
  | { user: null; error: string };

export async function authorize(permission: Permission): Promise<AuthResult> {
  const user = await getSession();

  if (!user) {
    return {
      user: null,
      error: "Your session has expired. Please sign in again.",
    };
  }

  if (!can(user.role, permission)) {
    return {
      user: null,
      error: "You do not have permission to perform this action.",
    };
  }

  return { user, error: null };
}
