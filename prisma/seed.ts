
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoomType, RoomStatus } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

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

  console.log(`Seed complete. Checked ${rooms.length} sample rooms.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
