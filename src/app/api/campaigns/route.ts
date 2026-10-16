import { db } from "@/lib/db";
import { failure } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await db.campaign.findMany({ include: { product: true, drafts: true }, orderBy: { createdAt: "desc" } })); } catch (e) { return failure(e); }
}
// Generation also persists a campaign and its drafts atomically.
export { POST } from "./generate/route";
