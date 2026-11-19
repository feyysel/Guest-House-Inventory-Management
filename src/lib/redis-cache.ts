import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

export const CACHE_KEYS = {
  dashboard: "havenstay:dashboard",
  paymentReservations: "havenstay:payments:reservations",
  settings: "havenstay:settings",
} as const;

let client: RedisClient | null = null;
let connection: Promise<RedisClient | null> | null = null;

async function getRedis(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;

  if (!url) return null;
  if (client?.isOpen) return client;

  if (!connection) {
    const instance = createClient({ url }) as RedisClient;

    instance.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    connection = instance
      .connect()
      .then(() => {
        client = instance;
        return instance;
      })
      .catch(() => null)
      .finally(() => {
        connection = null;
      });
  }

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

    const value = await loader();
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return value;
  } catch (error) {
    console.error("Redis cache read/write failed:", error);
    return loader();
  }
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
