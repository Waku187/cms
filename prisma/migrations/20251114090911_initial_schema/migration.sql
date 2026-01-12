-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "CattleStatus" AS ENUM ('ACTIVE', 'SOLD', 'DECEASED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "CattleCategory" AS ENUM ('BULL', 'COW', 'HEIFER', 'CALF', 'STEER');

-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('VACCINATION', 'DEWORMING', 'CHECKUP', 'TREATMENT', 'SURGERY');

-- CreateEnum
CREATE TYPE "VaccinationType" AS ENUM ('FMD', 'BRUCELLOSIS', 'ANTHRAX', 'BLACKLEG', 'RABIES', 'OTHER');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilkSession" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "MilkQuality" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('HAY', 'CONCENTRATE', 'SILAGE', 'MINERAL_SUPPLEMENT', 'GRAIN', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'WORKER', 'VETERINARIAN');

-- CreateTable
CREATE TABLE "Cattle" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "gender" "Gender" NOT NULL,
    "breed" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION,
    "status" "CattleStatus" NOT NULL DEFAULT 'ACTIVE',
    "category" "CattleCategory" NOT NULL,
    "motherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "cattleId" TEXT NOT NULL,
    "recordType" "HealthRecordType" NOT NULL,
    "vaccinationType" "VaccinationType",
    "description" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'PENDING',
    "veterinarian" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkRecord" (
    "id" TEXT NOT NULL,
    "cattleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "session" "MilkSession" NOT NULL,
    "quality" "MilkQuality" NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilkRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedInventory" (
    "id" TEXT NOT NULL,
    "feedType" "FeedType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "minThreshold" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "supplier" TEXT,
    "lastRestocked" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedRecord" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCattle" INTEGER NOT NULL,
    "maleCount" INTEGER NOT NULL,
    "femaleCount" INTEGER NOT NULL,
    "calfCount" INTEGER NOT NULL,
    "totalMilkLiters" DOUBLE PRECISION NOT NULL,
    "avgMilkPerCow" DOUBLE PRECISION NOT NULL,
    "feedHayUsed" DOUBLE PRECISION NOT NULL,
    "feedConcentrateUsed" DOUBLE PRECISION NOT NULL,
    "feedSilageUsed" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cattle_tagNumber_key" ON "Cattle"("tagNumber");

-- CreateIndex
CREATE INDEX "Cattle_status_idx" ON "Cattle"("status");

-- CreateIndex
CREATE INDEX "Cattle_category_idx" ON "Cattle"("category");

-- CreateIndex
CREATE INDEX "Cattle_gender_idx" ON "Cattle"("gender");

-- CreateIndex
CREATE INDEX "HealthRecord_cattleId_idx" ON "HealthRecord"("cattleId");

-- CreateIndex
CREATE INDEX "HealthRecord_scheduledDate_idx" ON "HealthRecord"("scheduledDate");

-- CreateIndex
CREATE INDEX "HealthRecord_status_idx" ON "HealthRecord"("status");

-- CreateIndex
CREATE INDEX "MilkRecord_date_idx" ON "MilkRecord"("date");

-- CreateIndex
CREATE INDEX "MilkRecord_cattleId_idx" ON "MilkRecord"("cattleId");

-- CreateIndex
CREATE INDEX "FeedInventory_feedType_idx" ON "FeedInventory"("feedType");

-- CreateIndex
CREATE INDEX "FeedRecord_inventoryId_idx" ON "FeedRecord"("inventoryId");

-- CreateIndex
CREATE INDEX "FeedRecord_date_idx" ON "FeedRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_date_key" ON "DailySummary"("date");

-- CreateIndex
CREATE INDEX "DailySummary_date_idx" ON "DailySummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkRecord" ADD CONSTRAINT "MilkRecord_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedRecord" ADD CONSTRAINT "FeedRecord_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "FeedInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
