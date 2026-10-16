import { afterEach, describe, expect, it, vi } from "vitest";
import { demoProducts } from "../src/lib/demo";
import {
  generateMarketing,
  providers,
  providerSettings,
} from "../src/lib/providers";
import type { GenerationInput } from "../src/lib/schemas";
const input: GenerationInput = {
  productId: "p",
  channel: "LinkedIn",
  goal: "Introduce",
  targetAudience: "Creators",
  tone: "Helpful",
  provider: "anthropic",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("provider boundaries", () => {
  it("returns transparent demo data without credentials, without network calls", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await generateMarketing(demoProducts[0], input);
    expect(result.provider).toBe("demo");
    expect(result.isDemo).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("disables an incomplete CoreWeave configuration and never falls back", async () => {
    vi.stubEnv("COREWEAVE_API_KEY", "");
    vi.stubEnv("COREWEAVE_MODEL", "");
    vi.stubEnv("COREWEAVE_BASE_URL", "");
    expect(providerSettings().coreweave.configured).toBe(false);
    await expect(
      generateMarketing(demoProducts[0], { ...input, provider: "coreweave" }),
    ).rejects.toThrow("not configured");
  });
  it("checks CoreWeave catalog before submitting a billable generation", async () => {
    vi.stubEnv("COREWEAVE_API_KEY", "test-placeholder");
    vi.stubEnv("COREWEAVE_MODEL", "unavailable");
    vi.stubEnv("COREWEAVE_BASE_URL", "https://api.inference.wandb.ai/v1");
    const mock = vi
      .fn()
      .mockResolvedValue(Response.json({ data: [{ id: "available" }] }));
    vi.stubGlobal("fetch", mock);
    await expect(
      providers.coreweave.generate(demoProducts[0], {
        ...input,
        provider: "coreweave",
      }),
    ).rejects.toThrow("not available");
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toBe(
      "https://api.inference.wandb.ai/v1/models",
    );
  });
  it("rejects an insecure CoreWeave URL before sending credentials", async () => {
    vi.stubEnv("COREWEAVE_BASE_URL", "http://example.com/v1");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(
      providers.coreweave.generate(demoProducts[0], {
        ...input,
        provider: "coreweave",
      }),
    ).rejects.toThrow("HTTPS");
    expect(mock).not.toHaveBeenCalled();
  });
});
