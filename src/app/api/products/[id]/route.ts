import { db } from "@/lib/db";
import { failure, readBody } from "@/lib/http";
import { productSchema } from "@/lib/schemas";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, { params }: Context) {
  try { return Response.json(await db.product.update({ where: { id: (await params).id }, data: { ...productSchema.parse(await readBody(req)), isDemo: false } })); } catch (e) { return failure(e); }
}
export async function DELETE(req: Request, { params }: Context) {
  try { await readBody(req); await db.product.delete({ where: { id: (await params).id } }); return Response.json({ ok: true }); } catch (e) { return failure(e); }
}
