export function rates(v: {
  impressions: number;
  clicks: number;
  conversions: number;
}) {
  return {
    ctr: v.impressions ? (v.clicks / v.impressions) * 100 : 0,
    conversionRate: v.clicks ? (v.conversions / v.clicks) * 100 : 0,
  };
}
export function utmUrl(
  base: string,
  source: string,
  medium: string,
  campaign: string,
) {
  const url = new URL(base);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Use an http or https URL");
  if (![source, medium, campaign].every((v) => v.trim()))
    throw new Error("Complete all UTM fields");
  url.searchParams.set("utm_source", source.trim());
  url.searchParams.set("utm_medium", medium.trim());
  url.searchParams.set("utm_campaign", campaign.trim());
  return url.toString();
}
export function csv(rows: string[][]) {
  // Neutralize spreadsheet formulas as well as escaping delimiters and quotes.
  return rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${(/^[\s]*[=+@\-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`,
        )
        .join(","),
    )
    .join("\r\n");
}
