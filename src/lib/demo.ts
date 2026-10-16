import { ProductInput, Channel, validateGeneration } from "./schemas";
export const demoProducts: ProductInput[] = [
  {
    name: "FocusKit",
    description:
      "A Notion workspace for planning projects, organizing tasks, and keeping weekly notes in one place.",
    targetAudience: "Independent creators and small teams",
    keyBenefits: "Project templates; weekly planning board; shared task lists",
    category: "Productivity",
    price: "$29 one-time",
    landingUrl: "https://example.com/focuskit",
    brandVoice: "Clear, encouraging, practical",
  },
  {
    name: "Frame Library",
    description:
      "A collection of editable Figma layouts for designers building digital product interfaces.",
    targetAudience: "Freelance designers and product teams",
    keyBenefits:
      "Editable components; responsive layouts; organized Figma files",
    category: "Design resources",
    price: "$49 one-time",
    landingUrl: "https://example.com/frame",
    brandVoice: "Thoughtful, confident, concise",
  },
  {
    name: "Launch Notes",
    description:
      "A digital workbook with prompts and checklists for planning a first digital product launch.",
    targetAudience: "First-time digital product creators",
    keyBenefits:
      "Launch checklist; audience worksheet; campaign planning prompts",
    category: "Education",
    price: "$19 one-time",
    landingUrl: "https://example.com/launch-notes",
    brandVoice: "Friendly, grounded, helpful",
  },
];
export function demoGeneration(product: ProductInput, channel: Channel) {
  const name = product.name.slice(0, 35);
  const benefit = product.keyBenefits.split(/[;\n]/)[0].trim().slice(0, 65);
  const variants = [
    {
      headline: `Meet ${name}`,
      body: benefit,
      cta: "Explore the details",
      hashtags: [],
      positioning: "Product introduction grounded in the first listed benefit.",
    },
    {
      headline: `A closer look at ${name}`,
      body: benefit,
      cta: "See what's included",
      hashtags: [],
      positioning:
        "Feature-led angle inviting the reader to inspect the product.",
    },
    {
      headline: `${name}, at a glance`,
      body: benefit,
      cta: "Learn more",
      hashtags: [],
      positioning:
        "A concise overview that keeps the focus on the supplied facts.",
    },
  ];
  return validateGeneration({ variants }, channel);
}
