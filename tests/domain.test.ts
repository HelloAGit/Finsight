import { describe, expect, it } from "vitest";
import {
  analyticsSchema,
  channels,
  copyText,
  productSchema,
  validateGeneration,
} from "../src/lib/schemas";
import { demoGeneration, demoProducts } from "../src/lib/demo";
import { approvalUpdate } from "../src/lib/drafts";
import { csv, rates, utmUrl } from "../src/lib/analytics";

describe("generation contract", () => {
  for (const channel of channels)
    it(`validates three distinct demo variants for ${channel}`, () => {
      for (const product of demoProducts) {
        const result = demoGeneration(product, channel);
        expect(result.variants).toHaveLength(3);
        if (channel === "X")
          result.variants.forEach((v) =>
            expect(Array.from(copyText(v)).length).toBeLessThanOrEqual(280),
          );
      }
    });
  it("rejects missing fields, extra variants, and duplicate angles", () => {
    expect(() =>
      validateGeneration(
        { variants: [{ headline: "Incomplete" }] },
        "LinkedIn",
      ),
    ).toThrow();
    const valid = demoGeneration(demoProducts[0], "LinkedIn");
    expect(() =>
      validateGeneration(
        { variants: [...valid.variants, valid.variants[0]] },
        "LinkedIn",
      ),
    ).toThrow();
    expect(() =>
      validateGeneration(
        { variants: [valid.variants[0], valid.variants[0], valid.variants[0]] },
        "LinkedIn",
      ),
    ).toThrow();
  });
  it("rejects combined X copy that exceeds the limit", () => {
    const valid = demoGeneration(demoProducts[0], "X");
    valid.variants[0].body = "x".repeat(270);
    expect(() => validateGeneration(valid, "X")).toThrow("280");
  });
  it("rejects email hashtags and long subject lines", () => {
    const valid = demoGeneration(demoProducts[0], "Email");
    valid.variants[0].hashtags = ["#product"];
    expect(() => validateGeneration(valid, "Email")).toThrow("Hashtags");
    valid.variants[0].hashtags = [];
    valid.variants[0].headline = "x".repeat(71);
    expect(() => validateGeneration(valid, "Email")).toThrow("Email");
  });
  it("rejects executable product URLs and untrusted extra fields", () => {
    expect(
      productSchema.safeParse({
        ...demoProducts[0],
        landingUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({ ...demoProducts[0], isDemo: true }).success,
    ).toBe(false);
  });
});
describe("human approval", () => {
  it("records approval only on a separate approval action", () => {
    expect(approvalUpdate(false, "approved").approvedAt).toBeInstanceOf(Date);
    expect(() => approvalUpdate(true, "approved")).toThrow("Save edits");
  });
  it("clears approval on edits, rejection, or return to draft", () => {
    expect(approvalUpdate(true)).toEqual({ status: "draft", approvedAt: null });
    expect(approvalUpdate(false, "rejected")).toEqual({
      status: "rejected",
      approvedAt: null,
    });
    expect(approvalUpdate(false, "draft")).toEqual({
      status: "draft",
      approvedAt: null,
    });
  });
});
describe("analytics and export", () => {
  it("uses zero-safe CTR and conversion-rate formulas", () => {
    expect(rates({ impressions: 0, clicks: 0, conversions: 0 })).toEqual({
      ctr: 0,
      conversionRate: 0,
    });
    expect(rates({ impressions: 1000, clicks: 100, conversions: 5 })).toEqual({
      ctr: 10,
      conversionRate: 5,
    });
  });
  it("rejects negative and inconsistent counts", () => {
    expect(
      analyticsSchema.safeParse({
        campaignId: "c",
        impressions: 0,
        clicks: 1,
        leads: 0,
        conversions: 0,
      }).success,
    ).toBe(false);
    expect(
      analyticsSchema.safeParse({
        campaignId: "c",
        impressions: -1,
        clicks: 0,
        leads: 0,
        conversions: 0,
      }).success,
    ).toBe(false);
  });
  it("preserves existing URL parameters and safely encodes UTM values", () => {
    const url = new URL(
      utmUrl(
        "https://example.com/?ref=test#pricing",
        "Linked In",
        "social",
        "Launch & learn",
      ),
    );
    expect(url.searchParams.get("ref")).toBe("test");
    expect(url.searchParams.get("utm_campaign")).toBe("Launch & learn");
    expect(url.hash).toBe("#pricing");
    expect(() => utmUrl("javascript:alert(1)", "x", "y", "z")).toThrow();
  });
  it("escapes CSV quotes, newlines, delimiters and spreadsheet formulas", () => {
    expect(csv([['Hello, "you"\nagain', "=1+1"]])).toBe(
      '"Hello, ""you""\nagain","\'=1+1"',
    );
  });
});
