
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  RoomType,
  RoomStatus,
  UserRole,
} from "../src/generated/prisma/client.ts";
import { hashPassword } from "../src/lib/password.ts";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured. Set it in .env.local or .env");
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  const rooms = [
    {
      roomNumber: "101",
      name: "Standard Single",
      type: RoomType.SINGLE,
      capacity: 1,
      pricePerNight: 1200,
      description: "Comfortable room for one guest.",
    },
    {
      roomNumber: "102",
      name: "Standard Double",
      type: RoomType.DOUBLE,
      capacity: 2,
      pricePerNight: 1800,
      description: "Comfortable room for two guests.",
    },
    {
      roomNumber: "103",
      name: "Twin Room",
      type: RoomType.TWIN,
      capacity: 2,
      pricePerNight: 2000,
      description: "Room with twin sleeping arrangements.",
    },
    {
      roomNumber: "201",
      name: "Deluxe Room",
      type: RoomType.DELUXE,
      capacity: 2,
      pricePerNight: 3000,
      description: "Spacious deluxe guest room.",
    },
    {
      roomNumber: "202",
      name: "Family Suite",
      type: RoomType.SUITE,
      capacity: 4,
      pricePerNight: 4500,
      description: "Spacious suite for families.",
    },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: {
        ...room,
        pricePerNight: room.pricePerNight,
        status: RoomStatus.AVAILABLE,
      },
    });
  }

  const users = [
    {
      name: process.env.SEED_ADMIN_NAME ?? "Alice Admin",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@havenstay.test",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
      role: UserRole.ADMIN,
    },
    {
      name: process.env.SEED_MANAGER_NAME ?? "Marta Manager",
      email: process.env.SEED_MANAGER_EMAIL ?? "manager@havenstay.test",
      password: process.env.SEED_MANAGER_PASSWORD ?? "Manager@123",
      role: UserRole.MANAGER,
    },
    {
      name: process.env.SEED_RECEPTIONIST_NAME ?? "Sam Receptionist",
      email:
        process.env.SEED_RECEPTIONIST_EMAIL ?? "receptionist@havenstay.test",
      password: process.env.SEED_RECEPTIONIST_PASSWORD ?? "Staff@123",
      role: UserRole.RECEPTIONIST,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, active: true },
      create: {
        name: user.name,
        email: user.email,
        passwordHash: hashPassword(user.password),
        role: user.role,
      },
    });
  }

  console.log(
    `Seed complete. Checked ${rooms.length} sample rooms and ${users.length} staff accounts.`
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
