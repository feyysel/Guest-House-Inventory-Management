-- CreateTable
CREATE TABLE "GuestHouseSettings" (
    "id" TEXT NOT NULL,
    "guesthouseName" TEXT NOT NULL DEFAULT 'HavenStay Guest House',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "checkInTime" TEXT NOT NULL DEFAULT '12:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestHouseSettings_pkey" PRIMARY KEY ("id")
);
