export type Product = {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  keyBenefits: string;
  category: string;
  price: string | null;
  landingUrl: string;
  brandVoice: string;
  isDemo: boolean;
};
export type Draft = {
  id: string;
  campaignId: string;
  headline: string;
  body: string;
  cta: string;
  hashtags: string;
  positioning: string;
  status: string;
  approvedAt: string | null;
};
export type Campaign = {
  id: string;
  productId: string;
  product: Product;
  channel: string;
  goal: string;
  targetAudience: string;
  tone: string;
  provider: string;
  isDemo: boolean;
  createdAt: string;
  drafts: Draft[];
};
export type Metric = {
  id: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  isSynthetic: boolean;
  createdAt: string;
  campaign: Campaign;
};
export type Settings = {
  anthropic: { configured: boolean; model: string };
  coreweave: { configured: boolean; model: string };
};
