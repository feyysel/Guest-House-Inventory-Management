
"use server";

import { revalidatePath } from "next/cache";
import { Prisma, RoomStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { CACHE_KEYS, invalidateCache } from "@/lib/redis-cache";
import { authorize } from "@/lib/session";

export type RoomInput = {
  roomNumber: string;
  name: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  description: string;
  status: string;
};

function normalizeRoomType(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function validateRoom(input: RoomInput) {
  const roomNumber = input.roomNumber.trim();
  const roomType = normalizeRoomType(input.type);

  if (!roomNumber) return "Room number is required.";

  if (!roomType) return "Room type is required.";

  if (roomType.length > 50) {
    return "Room type must be 50 characters or fewer.";
  }

  if (
    !Object.values(RoomStatus).includes(input.status as RoomStatus)
  ) {
    return "Choose a valid room status.";
  }

  if (!Number.isInteger(input.capacity) ||
      input.capacity < 1 ||
      input.capacity > 50) {
    return "Capacity must be between 1 and 50.";
  }

  if (!Number.isFinite(input.pricePerNight) ||
      input.pricePerNight < 0 ||
      input.pricePerNight > 100000000) {
    return "Enter a valid nightly price.";
  }

  return null;
}

export async function createRoom(input: RoomInput) {
  const auth = await authorize("rooms:create");
  if (auth.error) return { success: false, error: auth.error };

  const error = validateRoom(input);
  if (error) return { success: false, error };

  try {
    await prisma.room.create({
      data: {
        roomNumber: input.roomNumber.trim(),
        name: input.name.trim() || null,
        type: normalizeRoomType(input.type),
        status: input.status as RoomStatus,
        capacity: input.capacity,
        pricePerNight: new Prisma.Decimal(input.pricePerNight),
        description: input.description.trim() || null,
      },
    });

    revalidatePath("/rooms");
    revalidatePath("/");
    await invalidateCache(CACHE_KEYS.dashboard);

    return { success: true };
  } catch (error) {
    console.error("Create room failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "That room number already exists.",
      };
    }

    return {
      success: false,
      error: "Could not create room. Please try again.",
    };
  }
}

export async function updateRoom(id: string, input: RoomInput) {
  const auth = await authorize("rooms:update");
  if (auth.error) return { success: false, error: auth.error };

  if (!id) return { success: false, error: "Room ID is required." };

  const error = validateRoom(input);
  if (error) return { success: false, error };

  try {
    await prisma.room.update({
      where: { id },
      data: {
        roomNumber: input.roomNumber.trim(),
        name: input.name.trim() || null,
        type: normalizeRoomType(input.type),
        status: input.status as RoomStatus,
        capacity: input.capacity,
        pricePerNight: new Prisma.Decimal(input.pricePerNight),
        description: input.description.trim() || null,
      },
    });

    revalidatePath("/rooms");
    revalidatePath("/");
    await invalidateCache(CACHE_KEYS.dashboard);

    return { success: true };
  } catch (error) {
    console.error("Update room failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "That room number is already in use.",
      };
    }

    return {
      success: false,
      error: "Could not update room. Please try again.",
    };
  }
}

export async function deleteRoom(id: string) {
  const auth = await authorize("rooms:delete");
  if (auth.error) return { success: false, error: auth.error };

  if (!id) return { success: false, error: "Room ID is required." };

  try {
    await prisma.room.delete({ where: { id } });

    revalidatePath("/rooms");
    revalidatePath("/");
    await invalidateCache(CACHE_KEYS.dashboard);

    return { success: true };
  } catch (error) {
    console.error("Delete room failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error: "This room has reservations and cannot be deleted.",
      };
    }

    return {
      success: false,
      error: "Could not delete room. It may no longer exist.",
    };
  }
}
