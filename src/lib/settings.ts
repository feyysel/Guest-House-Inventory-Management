import { cache } from "react";
import { DEFAULT_GUESTHOUSE_NAME } from "@/lib/branding";
import { prisma } from "@/lib/db";
import { CACHE_KEYS, cachedJson } from "@/lib/redis-cache";

export type GuesthouseSettings = {
  guesthouseName: string;
  email: string;
  phone: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
};

const defaultSettings: GuesthouseSettings = {
  guesthouseName: DEFAULT_GUESTHOUSE_NAME,
  email: "",
  phone: "",
  address: "",
  checkInTime: "12:00",
  checkOutTime: "11:00",
  currency: "ETB",
};

export const getGuesthouseSettings = cache(
  async (): Promise<GuesthouseSettings> => {
    try {
      return await cachedJson(CACHE_KEYS.settings, 300, async () => {
        const settings = await prisma.guestHouseSettings.findFirst();

        if (!settings) return defaultSettings;

        return {
          guesthouseName:
            settings.guesthouseName || DEFAULT_GUESTHOUSE_NAME,
          email: settings.email ?? "",
          phone: settings.phone ?? "",
          address: settings.address ?? "",
          checkInTime: settings.checkInTime,
          checkOutTime: settings.checkOutTime,
          currency: settings.currency,
        };
      });
    } catch (error) {
      console.error("Failed to load guesthouse settings:", error);
      return defaultSettings;
    }
  },
);
