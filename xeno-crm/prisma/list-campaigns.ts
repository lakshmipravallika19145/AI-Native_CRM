import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log("Campaigns:", JSON.stringify(campaigns, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
