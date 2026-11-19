"use server";

import { revalidatePath } from "next/cache";
import { Prisma, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { authorize } from "@/lib/session";

export type UserActionResult = {
  success: boolean;
  message: string;
};

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
  role: string;
};

function validRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export async function createUser(
  input: NewUserInput
): Promise<UserActionResult> {
  const auth = await authorize("users:create");
  if (!auth.user) return { success: false, message: auth.error };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = input.role.trim();

  if (!name || name.length > 100) {
    return { success: false, message: "Enter a name of 100 characters or fewer." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { success: false, message: "Enter a valid email address." };
  }

  if (input.password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }

  if (!validRole(role)) {
    return { success: false, message: "Choose a valid role." };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash: hashPassword(input.password),
      },
    });

    revalidatePath("/users");
    return { success: true, message: `${name} was added as ${role.toLowerCase()}.` };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, message: "That email is already in use." };
    }

    console.error("Create user failed:", error);
    return { success: false, message: "Could not create the user. Please try again." };
  }
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<UserActionResult> {
  const auth = await authorize("users:update");
  if (!auth.user) return { success: false, message: auth.error };

  if (userId === auth.user.id) {
    return { success: false, message: "You cannot change your own role." };
  }

  if (!validRole(role)) {
    return { success: false, message: "Choose a valid role." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/users");
    return { success: true, message: `Role updated to ${role.toLowerCase()}.` };
  } catch {
    return { success: false, message: "Could not update the role." };
  }
}

export async function setUserActive(
  userId: string,
  active: boolean
): Promise<UserActionResult> {
  const auth = await authorize("users:update");
  if (!auth.user) return { success: false, message: auth.error };

  if (userId === auth.user.id) {
    return { success: false, message: "You cannot deactivate your own account." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { active },
    });

    revalidatePath("/users");
    return {
      success: true,
      message: active ? "Account activated." : "Account deactivated.",
    };
  } catch {
    return { success: false, message: "Could not update the account." };
  }
}

export async function resetUserPassword(
  userId: string,
  password: string
): Promise<UserActionResult> {
  const auth = await authorize("users:update");
  if (!auth.user) return { success: false, message: auth.error };

  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(password) },
    });

    return { success: true, message: "Password reset." };
  } catch {
    return { success: false, message: "Could not reset the password." };
  }
}

export async function deleteUser(userId: string): Promise<UserActionResult> {
  const auth = await authorize("users:delete");
  if (!auth.user) return { success: false, message: auth.error };

  if (userId === auth.user.id) {
    return { success: false, message: "You cannot delete your own account." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/users");
    return { success: true, message: "User deleted." };
  } catch {
    return { success: false, message: "Could not delete the user." };
  }
}
