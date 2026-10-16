import { providerSettings } from "@/lib/providers";
export const dynamic = "force-dynamic";
export function GET() { return Response.json(providerSettings(), { headers: { "Cache-Control": "no-store" } }); }
