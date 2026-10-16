import { db } from "@/lib/db";
import { failure, readBody } from "@/lib/http";
import { productSchema } from "@/lib/schemas";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await db.product.findMany({ orderBy: { createdAt: "asc" } })); } catch (e) { return failure(e); }
}
export async function POST(req: Request) {
  try { return Response.json(await db.product.create({ data: productSchema.parse(await readBody(req)) }), { status: 201 }); } catch (e) { return failure(e); }
}
