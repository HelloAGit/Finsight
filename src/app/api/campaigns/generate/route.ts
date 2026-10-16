import { db } from "@/lib/db";
import { failure, HttpError, readBody } from "@/lib/http";
import { generateSchema, productSchema } from "@/lib/schemas";
import { generateMarketing } from "@/lib/providers";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const input = generateSchema.parse(await readBody(req));
    const product = await db.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new HttpError(404, "Product not found");
    const facts = productSchema.parse({ name: product.name, description: product.description, targetAudience: product.targetAudience, keyBenefits: product.keyBenefits, category: product.category, price: product.price || "", landingUrl: product.landingUrl, brandVoice: product.brandVoice });
    const output = await generateMarketing(facts, input);
    const campaign = await db.campaign.create({ data: {
      ...input, provider: output.provider, isDemo: output.isDemo,
      drafts: { create: output.variants.map(v => ({ ...v, hashtags: JSON.stringify(v.hashtags) })) },
    }, include: { product: true, drafts: true } });
    return Response.json(campaign, { status: 201 });
  } catch (e) { return failure(e); }
}
