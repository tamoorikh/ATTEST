import { PrismaClient } from "@prisma/client";
import { resetDemoData } from "../src/lib/demoReset";

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_DEMO_DATA !== "true") {
    console.error("================================================================================");
    console.error("🛑 [SAFETY GUARD ACTIVATED]: Refusing to seed database!");
    console.error("================================================================================");
    console.error("The seed script injects fictional demonstration data (Meridian Textiles Pvt Ltd).");
    console.error("Seeding a production database with fictional data will compromise audit integrity.");
    console.error("");
    console.error("To seed staging, demo, or local development environments, you MUST explicitly set:");
    console.error("  SEED_DEMO_DATA=true");
    console.error("");
    console.error("Execution aborted. Zero records were written to the database.");
    console.error("================================================================================");
    process.exit(1);
  }

  console.warn("================================================================================");
  console.warn("⚠️  [NOTICE]: SEED_DEMO_DATA=true confirmed. Writing fictional demonstration data...");
  console.warn("   Target: Meridian Textiles (Pvt) Ltd (April 2026 Rescaled x10 Dataset)");
  console.warn("================================================================================");

  console.log("🌱 Starting Attest database seed (Rescaled x10)...");
  await resetDemoData(prisma);
  console.log("✅ Staging/Demo seed completed successfully with rescaled x10 figures!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
