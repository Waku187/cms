import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get random element from array
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random float between min and max
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Helper function to get random date in the past
function randomPastDate(daysAgo: number): Date {
  const now = new Date();
  const days = randomInt(0, daysAgo);
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Helper function to get random date in the future
function randomFutureDate(daysAhead: number): Date {
  const now = new Date();
  const days = randomInt(1, daysAhead);
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

// Cattle names
const cattleNames = [
  "Bella", "Daisy", "Molly", "Luna", "Lucy", "Maggie", "Sophie", "Chloe",
  "Max", "Charlie", "Buddy", "Rocky", "Jack", "Toby", "Duke", "Bear",
  "Rosie", "Penny", "Ginger", "Ruby", "Stella", "Lily", "Grace", "Emma"
];

const breeds = [
  "Holstein", "Jersey", "Guernsey", "Ayrshire", "Brown Swiss",
  "Hereford", "Angus", "Charolais", "Simmental", "Limousin"
];

const veterinarians = [
  "Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Rodriguez",
  "Dr. James Wilson", "Dr. Lisa Anderson"
];

const suppliers = [
  "Green Pastures Feed Co.", "Farm Supply Depot", "AgriFeed Solutions",
  "Premium Livestock Nutrition", "Rural Feed & Grain"
];

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.feedRecord.deleteMany();
  await prisma.feedInventory.deleteMany();
  await prisma.milkRecord.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.dailySummary.deleteMany();
  await prisma.cattle.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log("👥 Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@cms.com",
        name: "Admin User",
        role: "ADMIN",
        password: "$2a$10$dummyhash", // In production, use proper hashing
      },
    }),
    prisma.user.create({
      data: {
        email: "manager@cms.com",
        name: "Farm Manager",
        role: "MANAGER",
        password: "$2a$10$dummyhash",
      },
    }),
    prisma.user.create({
      data: {
        email: "vet@cms.com",
        name: "Dr. Sarah Johnson",
        role: "VETERINARIAN",
        password: "$2a$10$dummyhash",
      },
    }),
    prisma.user.create({
      data: {
        email: "worker@cms.com",
        name: "Farm Worker",
        role: "WORKER",
        password: "$2a$10$dummyhash",
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // Create Cattle
  console.log("🐄 Creating cattle...");
  const cattle: any[] = [];
  const tagNumbers = new Set<string>();

  // Generate unique tag numbers
  while (tagNumbers.size < 50) {
    const tag = `TAG-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    tagNumbers.add(tag);
  }

  const tagArray = Array.from(tagNumbers);
  const mothers: string[] = [];

  // Create 50 cattle
  for (let i = 0; i < 50; i++) {
    const gender = randomElement(["MALE", "FEMALE"]);
    const ageYears = randomInt(0, 8);
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - ageYears);
    dateOfBirth.setMonth(randomInt(0, 11));
    dateOfBirth.setDate(randomInt(1, 28));

    let category: string;
    if (ageYears < 1) {
      category = "CALF";
    } else if (gender === "FEMALE") {
      if (ageYears < 2) {
        category = "HEIFER";
      } else {
        category = "COW";
        mothers.push(tagArray[i]); // Track potential mothers
      }
    } else {
      if (randomInt(1, 10) <= 2) {
        category = "STEER";
      } else {
        category = "BULL";
      }
    }

    const weight = category === "CALF"
      ? randomFloat(30, 150)
      : category === "HEIFER"
        ? randomFloat(200, 400)
        : randomFloat(400, 800);

    const status = randomElement(["ACTIVE", "ACTIVE", "ACTIVE", "QUARANTINED", "SOLD"]);

    const cow = await prisma.cattle.create({
      data: {
        tagNumber: tagArray[i],
        name: randomElement(cattleNames),
        gender: gender as any,
        breed: randomElement(breeds),
        dateOfBirth,
        weight: Math.round(weight * 10) / 10,
        status: status as any,
        category: category as any,
        imageUrl: null,
      },
    });

    cattle.push(cow);
  }

  // Create mother-offspring relationships
  console.log("👨‍👩‍👧 Creating family relationships...");
  const calves = cattle.filter(c => c.category === "CALF");
  const cows = cattle.filter(c => c.category === "COW" && c.status === "ACTIVE");

  for (const calf of calves.slice(0, Math.min(calves.length, cows.length))) {
    const mother = randomElement(cows);
    await prisma.cattle.update({
      where: { id: calf.id },
      data: { motherId: mother.id },
    });
  }
  console.log(`✅ Created ${cattle.length} cattle with relationships`);

  // Create Health Records
  console.log("🏥 Creating health records...");
  const healthRecordTypes = ["VACCINATION", "DEWORMING", "CHECKUP", "TREATMENT", "SURGERY"];
  const vaccinationTypes = ["FMD", "BRUCELLOSIS", "ANTHRAX", "BLACKLEG", "RABIES", "OTHER"];
  const recordStatuses = ["PENDING", "COMPLETED", "COMPLETED", "OVERDUE"];

  for (let i = 0; i < 100; i++) {
    const cattleRecord = randomElement(cattle);
    const recordType = randomElement(healthRecordTypes);
    const vaccinationType = recordType === "VACCINATION"
      ? randomElement(vaccinationTypes)
      : null;

    const scheduledDate = randomPastDate(180);
    const isCompleted = Math.random() > 0.3;
    const completedDate = isCompleted
      ? new Date(scheduledDate.getTime() + randomInt(0, 7) * 24 * 60 * 60 * 1000)
      : null;
    const status = isCompleted
      ? "COMPLETED"
      : scheduledDate < new Date()
        ? "OVERDUE"
        : "PENDING";

    await prisma.healthRecord.create({
      data: {
        cattleId: cattleRecord.id,
        recordType: recordType as any,
        vaccinationType: vaccinationType as any,
        description: `${recordType} for ${cattleRecord.name || cattleRecord.tagNumber}`,
        scheduledDate,
        completedDate,
        status: status as any,
        veterinarian: randomElement(veterinarians),
        cost: randomFloat(50, 500),
        notes: randomElement([
          "Routine procedure",
          "Follow-up required",
          "No complications",
          "Monitor for 48 hours",
          null,
        ]),
      },
    });
  }
  console.log("✅ Created 100 health records");

  // Create Milk Records (only for cows)
  console.log("🥛 Creating milk records...");
  const cowsForMilk = cattle.filter(c => c.category === "COW" && c.status === "ACTIVE");
  const milkSessions = ["MORNING", "AFTERNOON", "EVENING"];
  const milkQualities = ["EXCELLENT", "GOOD", "GOOD", "FAIR", "POOR"];

  // Create milk records for the last 150 days
  for (let day = 0; day < 150; day++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - day);

    for (const cow of cowsForMilk.slice(0, randomInt(15, cowsForMilk.length))) {
      const session = randomElement(milkSessions);
      const liters = randomFloat(8, 25);
      const quality = randomElement(milkQualities);

      await prisma.milkRecord.create({
        data: {
          cattleId: cow.id,
          date: recordDate,
          liters: Math.round(liters * 10) / 10,
          session: session as any,
          quality: quality as any,
          notes: randomElement([
            "Normal production",
            "Slightly below average",
            "Above average yield",
            null,
          ]),
        },
      });
    }
  }
  console.log("✅ Created milk records for the last 150 days");

  // Create Feed Inventory
  console.log("🌾 Creating feed inventory...");
  const feedTypes = ["HAY", "CONCENTRATE", "SILAGE", "MINERAL_SUPPLEMENT", "GRAIN"];
  const inventories = [];

  for (const feedType of feedTypes) {
    const quantity = randomFloat(500, 2000);
    const minThreshold = quantity * 0.2;
    const lastRestocked = randomPastDate(30);
    const expiryDate = new Date(lastRestocked);
    expiryDate.setMonth(expiryDate.getMonth() + randomInt(3, 12));

    const inventory = await prisma.feedInventory.create({
      data: {
        feedType: feedType as any,
        quantity: Math.round(quantity * 10) / 10,
        unit: "kg",
        minThreshold: Math.round(minThreshold * 10) / 10,
        cost: randomFloat(1000, 5000),
        supplier: randomElement(suppliers),
        lastRestocked,
        expiryDate,
      },
    });
    inventories.push(inventory);
  }
  console.log(`✅ Created ${inventories.length} feed inventory items`);

  // Create Feed Records
  console.log("📊 Creating feed usage records...");
  for (let day = 0; day < 150; day++) {
    const recordDate = new Date();
    recordDate.setDate(recordDate.getDate() - day);

    for (const inventory of inventories) {
      if (Math.random() > 0.3) { // 70% chance of usage each day
        const quantityUsed = randomFloat(50, 200);

        await prisma.feedRecord.create({
          data: {
            inventoryId: inventory.id,
            date: recordDate,
            quantityUsed: Math.round(quantityUsed * 10) / 10,
            notes: randomElement([
              "Daily feeding",
              "Extra ration for pregnant cows",
              "Regular distribution",
              null,
            ]),
          },
        });

        // Update inventory quantity
        const currentInventory = await prisma.feedInventory.findUnique({
          where: { id: inventory.id },
        });
        if (currentInventory) {
          await prisma.feedInventory.update({
            where: { id: inventory.id },
            data: {
              quantity: Math.max(0, currentInventory.quantity - quantityUsed),
            },
          });
        }
      }
    }
  }
  console.log("✅ Created feed usage records for the last 150 days");

  // Create Daily Summaries
  console.log("📈 Creating daily summaries...");
  for (let day = 0; day < 150; day++) {
    const summaryDate = new Date();
    summaryDate.setDate(summaryDate.getDate() - day);
    summaryDate.setHours(0, 0, 0, 0);

    const activeCattle = cattle.filter(c => c.status === "ACTIVE");
    const males = activeCattle.filter(c => c.gender === "MALE");
    const females = activeCattle.filter(c => c.gender === "FEMALE");
    const calves = activeCattle.filter(c => c.category === "CALF");

    // Get milk records for this date
    const dayMilkRecords = await prisma.milkRecord.findMany({
      where: {
        date: {
          gte: new Date(summaryDate),
          lt: new Date(summaryDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalMilkLiters = dayMilkRecords.reduce((sum, record) => sum + record.liters, 0);
    const milkingCows = new Set(dayMilkRecords.map(r => r.cattleId).filter(Boolean)).size;
    const avgMilkPerCow = milkingCows > 0 ? totalMilkLiters / milkingCows : 0;

    // Get feed records for this date
    const dayFeedRecords = await prisma.feedRecord.findMany({
      where: {
        date: {
          gte: new Date(summaryDate),
          lt: new Date(summaryDate.getTime() + 24 * 60 * 60 * 1000),
        },
        inventory: {
          feedType: {
            in: ["HAY", "CONCENTRATE", "SILAGE"],
          },
        },
      },
      include: {
        inventory: true,
      },
    });

    const feedHayUsed = dayFeedRecords
      .filter(r => r.inventory.feedType === "HAY")
      .reduce((sum, r) => sum + r.quantityUsed, 0);
    const feedConcentrateUsed = dayFeedRecords
      .filter(r => r.inventory.feedType === "CONCENTRATE")
      .reduce((sum, r) => sum + r.quantityUsed, 0);
    const feedSilageUsed = dayFeedRecords
      .filter(r => r.inventory.feedType === "SILAGE")
      .reduce((sum, r) => sum + r.quantityUsed, 0);

    await prisma.dailySummary.create({
      data: {
        date: summaryDate,
        totalCattle: activeCattle.length,
        maleCount: males.length,
        femaleCount: females.length,
        calfCount: calves.length,
        totalMilkLiters: Math.round(totalMilkLiters * 10) / 10,
        avgMilkPerCow: Math.round(avgMilkPerCow * 10) / 10,
        feedHayUsed: Math.round(feedHayUsed * 10) / 10,
        feedConcentrateUsed: Math.round(feedConcentrateUsed * 10) / 10,
        feedSilageUsed: Math.round(feedSilageUsed * 10) / 10,
      },
    });
  }
  console.log("✅ Created daily summaries for the last 150 days");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

