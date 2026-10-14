import { PrismaClient } from "@prisma/client";
import { resetDemoData } from "../src/lib/demoReset";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Attest database seed (Rescaled x10)...");
  await resetDemoData(prisma);
  console.log("✅ Seed completed successfully with rescaled x10 figures!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
