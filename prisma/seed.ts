import { PrismaClient } from "@prisma/client";
import { demoProducts, demoGeneration } from "../src/lib/demo";
const db = new PrismaClient();
async function main() {
  for (const [index, product] of demoProducts.entries()) {
    const id = `demo-product-${index + 1}`;
    await db.product.upsert({ where: { id }, update: {}, create: { ...product, id, isDemo: true } });
    if (index === 0) {
      const campaignId = "demo-campaign-1";
      await db.campaign.upsert({ where: { id: campaignId }, update: {}, create: {
        id: campaignId, productId: id, channel: "LinkedIn", goal: "Introduce the product", targetAudience: product.targetAudience, tone: "Helpful", provider: "demo", isDemo: true,
        drafts: { create: demoGeneration(product, "LinkedIn").variants.map(v => ({ ...v, hashtags: JSON.stringify(v.hashtags) })) },
        analytics: { create: { impressions: 2400, clicks: 132, leads: 24, conversions: 8, isSynthetic: true } },
      } });
    }
  }
}
main().catch(() => { console.error("Seed failed. Check DATABASE_URL and run migrations first."); process.exitCode = 1; }).finally(() => db.$disconnect());
