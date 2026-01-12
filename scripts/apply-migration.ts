import { db } from "../lib/db";

async function applyMigration() {
  try {
    console.log("Applying migration: Add imageUrl to Cattle table...");
    
    // Apply the migration SQL
    await db.$executeRawUnsafe(`
      ALTER TABLE "Cattle" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
    `);
    
    console.log("Migration applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error applying migration:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

applyMigration();

