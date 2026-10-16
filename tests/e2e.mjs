import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
const baseURL = process.env.TEST_BASE_URL || "http://localhost:3000";
const artifacts = resolve(process.env.ARTIFACT_DIR || "test-results");
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", async (response) => {
  if (response.url().includes("/api/") && response.status() >= 400)
    console.log(
      "API error:",
      response.status(),
      new URL(response.url()).pathname,
      await response.text(),
    );
});
let productId;
async function request(url, method = "GET", data) {
  const response = await context.request.fetch(baseURL + url, { method, data });
  const json = await response.json();
  assert(response.ok(), `${method} ${url}: ${JSON.stringify(json)}`);
  return json;
}
try {
  const providerStatus = await request("/api/settings");
  assert(
    !providerStatus.anthropic.configured &&
      !providerStatus.coreweave.configured,
    "E2E requires an unconfigured demo server to prevent billable calls",
  );
  await page.goto(baseURL);
  await page
    .getByRole("heading", { name: "Good ideas deserve great campaigns." })
    .waitFor();
  assert(
    await page.getByText("You’re in demo mode.", { exact: true }).isVisible(),
  );
  await page.screenshot({
    path: join(artifacts, "finsight-overview.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Products", exact: true }).click();
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  const name = `QA Product ${Date.now()}`;
  for (const [label, value] of [
    ["Product name", name],
    ["Category", "Productivity"],
    ["Target audience", "Independent creators"],
    ["Brand voice", "Clear and friendly"],
    ["Price (optional)", "$15"],
    ["Landing URL", "https://example.com/qa"],
    [
      "Description",
      "A fictional digital workbook for planning weekly projects.",
    ],
    ["Key benefits", "Weekly planning pages; project checklist"],
  ]) {
    await page
      .getByLabel(label, { exact: label !== "Key benefits" })
      .fill(value);
  }
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page.getByRole("heading", { name, exact: true }).waitFor();
  const products = await request("/api/products");
  productId = products.find((p) => p.name === name).id;

  await page
    .getByRole("link", { name: "Campaign Studio", exact: true })
    .click();
  await page.getByLabel("Product", { exact: true }).selectOption(productId);
  await page.getByRole("button", { name: "X", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate 3 variants", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your three starting points", exact: true })
    .waitFor();
  let campaigns = await request("/api/campaigns");
  const campaign = campaigns.find((c) => c.productId === productId);
  assert.equal(campaign.drafts.length, 3);
  assert.equal(campaign.provider, "demo");
  assert(campaign.isDemo);
  for (const d of campaign.drafts) assert.equal(d.status, "draft");
  await page.screenshot({
    path: join(artifacts, "finsight-studio.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Review & edit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search drafts", exact: true })
    .fill(name);
  const card = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: `Meet ${name}`, exact: true }),
    });
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Body", { exact: true })
    .fill("Weekly planning pages for your next project.");
  await page.getByRole("button", { name: "Save edits", exact: true }).click();
  await card.getByRole("button", { name: "Approve", exact: true }).click();
  await card.getByText("approved", { exact: true }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export visible CSV", exact: true })
    .click();
  const download = await downloadPromise;
  const exported = join(artifacts, "qa-export.csv");
  await download.saveAs(exported);
  const csv = await readFile(exported, "utf8");
  assert(csv.includes("approved"));
  assert(csv.includes("Demo template"));
  assert(csv.includes("Weekly planning pages for your next project."));

  const approved = (await request("/api/campaigns"))
    .find((c) => c.id === campaign.id)
    .drafts.find((d) => d.status === "approved");
  assert(approved.approvedAt);
  await request(`/api/campaigns/${campaign.id}`, "PATCH", {
    draftId: approved.id,
    body: "A revised weekly planning workbook.",
  });
  const revised = (await request("/api/campaigns"))
    .find((c) => c.id === campaign.id)
    .drafts.find((d) => d.id === approved.id);
  assert.equal(revised.status, "draft");
  assert.equal(revised.approvedAt, null);
  const unsafeApproval = await context.request.patch(
    `${baseURL}/api/campaigns/${campaign.id}`,
    {
      data: {
        draftId: approved.id,
        body: "Edited and approved",
        status: "approved",
      },
    },
  );
  assert.equal(unsafeApproval.status(), 400);
  await request(`/api/campaigns/${campaign.id}`, "PATCH", {
    draftId: approved.id,
    status: "rejected",
  });

  // Exercise all channels and missing-Claude-key behavior through real routes.
  for (const channel of ["LinkedIn", "Email", "Landing page"]) {
    const generated = await request("/api/campaigns/generate", "POST", {
      productId,
      channel,
      goal: "Introduce product",
      targetAudience: "Creators",
      tone: "Helpful",
      provider: "anthropic",
    });
    assert(generated.isDemo);
    assert.equal(generated.drafts.length, 3);
  }
  const disabled = await context.request.post(
    `${baseURL}/api/campaigns/generate`,
    {
      data: {
        productId,
        channel: "X",
        goal: "Introduce",
        targetAudience: "Creators",
        tone: "Helpful",
        provider: "coreweave",
      },
    },
  );
  assert.equal(disabled.status(), 503);
  const badCounts = await context.request.post(`${baseURL}/api/analytics`, {
    data: {
      campaignId: campaign.id,
      impressions: 1,
      clicks: 2,
      leads: 0,
      conversions: 0,
    },
  });
  assert.equal(badCounts.status(), 400);
  const crossOrigin = await context.request.post(`${baseURL}/api/products`, {
    headers: { Origin: "https://untrusted.example" },
    data: {},
  });
  assert.equal(crossOrigin.status(), 403);
  await request("/api/analytics", "POST", {
    campaignId: campaign.id,
    impressions: 1000,
    clicks: 100,
    leads: 20,
    conversions: 5,
    isSynthetic: false,
  });
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await page.getByText("10.00%", { exact: true }).first().waitFor();
  assert(await page.getByText("5.00%", { exact: true }).isVisible());
  await page
    .getByRole("button", { name: "Generate UTM link", exact: false })
    .click();
  assert((await page.getByRole("status").count()) >= 1); // UTM output element has status role.
  const output = await page.locator("output").innerText();
  assert(output.includes("utm_source=linkedin"));
  await page
    .getByLabel("Include synthetic sample metrics", { exact: true })
    .check();
  await page.getByText("Synthetic sample", { exact: true }).waitFor();

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("heading", { name: "Anthropic Claude", exact: true })
    .waitFor();
  const safeSettings = await request("/api/settings");
  assert(!("apiKey" in safeSettings.anthropic));
  await request(`/api/products/${productId}`, "PATCH", {
    name,
    description:
      "An edited fictional digital workbook for weekly project planning.",
    targetAudience: "Creators",
    keyBenefits: "Weekly pages",
    category: "Productivity",
    price: "$16",
    landingUrl: "https://example.com/qa",
    brandVoice: "Friendly",
  });
  await request(`/api/products/${productId}`, "DELETE", {});
  productId = null;
  campaigns = await request("/api/campaigns");
  assert(!campaigns.some((c) => c.id === campaign.id));
  assert(
    !(await request("/api/analytics")).some(
      (m) => m.campaignId === campaign.id,
    ),
  );

  await page.goto(baseURL);
  await page
    .getByRole("heading", { name: "Good ideas deserve great campaigns." })
    .waitFor();
  await page.screenshot({
    path: join(artifacts, "finsight-overview.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: join(artifacts, "finsight-mobile.png"),
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
    "No mobile horizontal overflow",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: browser create → generate → edit → approve → CSV export; API channel/demo/approval/cascade/security checks; analytics, UTM, settings; desktop/mobile screenshots; no browser errors.",
  );
} catch (e) {
  await page.screenshot({
    path: join(artifacts, "qa-failure.png"),
    fullPage: true,
  });
  console.error(await page.locator('[role="alert"]').allTextContents());
  throw e;
} finally {
  if (productId)
    await request(`/api/products/${productId}`, "DELETE", {}).catch(() => {});
  await browser.close();
}
