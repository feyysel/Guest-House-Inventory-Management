import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

export const CACHE_KEYS = {
  dashboard: "havenstay:dashboard",
  paymentReservations: "havenstay:payments:reservations",
  settings: "havenstay:settings",
} as const;

let client: RedisClient | null = null;
let connection: Promise<RedisClient | null> | null = null;
let unavailable = false;
let warningShown = false;

function reportUnavailable(): void {
  if (warningShown) return;
  warningShown = true;
  console.warn(
    "Redis is unavailable; caching is disabled and data will be read directly from the database. " +
      "Start it with `npm run redis:up` (Docker required) or point REDIS_URL at a reachable server."
  );
}

async function getRedis(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;

  if (!url || unavailable) return null;
  if (client?.isOpen) return client;
  if (connection) return connection;

  const instance = createClient({
    url,
    socket: { reconnectStrategy: false },
  }) as RedisClient;

  instance.on("error", () => reportUnavailable());

  connection = instance
    .connect()
    .then(() => {
      client = instance;
      return instance;
    })
    .catch(() => {
      unavailable = true;
      reportUnavailable();
      return null;
    })
    .finally(() => {
      connection = null;
    });

  return connection;
}

export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const redis = await getRedis();

  if (!redis) return loader();

  try {
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error("Redis cache read failed:", error);
  }

  const value = await loader();

  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    console.error("Redis cache write failed:", error);
  }

  return value;
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const redis = await getRedis();

  if (!redis) return;

  try {
    await redis.del(keys);
  } catch (error) {
    console.error("Redis cache invalidation failed:", error);
  }
}
