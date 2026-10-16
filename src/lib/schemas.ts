import { z } from "zod";

export const channels = ["LinkedIn", "X", "Email", "Landing page"] as const;
export type Channel = (typeof channels)[number];
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine(
    (v) => ["http:", "https:"].includes(new URL(v).protocol),
    "Use an http or https URL",
  );
export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().min(10).max(1500),
    targetAudience: z.string().trim().min(2).max(300),
    keyBenefits: z.string().trim().min(2).max(800),
    category: z.string().trim().min(2).max(80),
    price: z.string().trim().max(80).optional().default(""),
    landingUrl: httpUrl,
    brandVoice: z.string().trim().min(2).max(200),
  })
  .strict();
export const generateSchema = z
  .object({
    productId: z.string().min(1),
    channel: z.enum(channels),
    goal: z.string().trim().min(2).max(300),
    targetAudience: z.string().trim().min(2).max(300),
    tone: z.string().trim().min(2).max(100),
    provider: z.enum(["anthropic", "coreweave", "demo"]).default("anthropic"),
  })
  .strict();
export const variantSchema = z
  .object({
    headline: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(2400),
    cta: z.string().trim().min(1).max(100),
    hashtags: z
      .array(
        z
          .string()
          .regex(/^#[\p{L}\p{N}_]+$/u)
          .max(40),
      )
      .max(5),
    positioning: z.string().trim().min(1).max(400),
  })
  .strict();
export const generationSchema = z
  .object({ variants: z.array(variantSchema).length(3) })
  .strict();
export type Variant = z.infer<typeof variantSchema>;
export type GenerationInput = z.infer<typeof generateSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export function copyText(
  v: Pick<Variant, "headline" | "body" | "cta" | "hashtags">,
) {
  return [v.headline, v.body, v.cta, v.hashtags.join(" ")]
    .filter(Boolean)
    .join("\n\n");
}
export function validateChannel(variant: Variant, channel: string) {
  const length = Array.from(copyText(variant)).length;
  if (channel === "X" && length > 280)
    throw new Error(
      "X copy exceeds 280 characters including headline, CTA and hashtags",
    );
  if (channel === "LinkedIn" && length > 3000)
    throw new Error("LinkedIn copy exceeds 3,000 characters");
  if (
    channel === "Email" &&
    (variant.headline.length > 70 || variant.body.length > 1800)
  )
    throw new Error("Email subject or body is too long");
  if (["Email", "Landing page"].includes(channel) && variant.hashtags.length)
    throw new Error("Hashtags are only allowed for social channels");
}
export function validateGeneration(value: unknown, channel: Channel) {
  const result = generationSchema.parse(value);
  result.variants.forEach((v) => validateChannel(v, channel));
  if (new Set(result.variants.map((v) => copyText(v).toLowerCase())).size !== 3)
    throw new Error("Expected three distinct variants");
  return result;
}
export const draftPatchSchema = z
  .object({
    draftId: z.string().min(1),
    headline: variantSchema.shape.headline.optional(),
    body: variantSchema.shape.body.optional(),
    cta: variantSchema.shape.cta.optional(),
    hashtags: variantSchema.shape.hashtags.optional(),
    positioning: variantSchema.shape.positioning.optional(),
    status: z.enum(["draft", "approved", "rejected"]).optional(),
  })
  .strict();
export const analyticsSchema = z
  .object({
    campaignId: z.string().min(1),
    impressions: z.number().int().min(0).max(1e9),
    clicks: z.number().int().min(0).max(1e9),
    leads: z.number().int().min(0).max(1e9),
    conversions: z.number().int().min(0).max(1e9),
    isSynthetic: z.boolean().default(false),
  })
  .strict()
  .refine(
    (v) =>
      v.clicks <= v.impressions &&
      v.leads <= v.clicks &&
      v.conversions <= v.leads,
    "Counts must follow impressions ≥ clicks ≥ leads ≥ conversions",
  );
