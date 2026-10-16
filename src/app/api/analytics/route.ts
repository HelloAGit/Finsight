import { db } from "@/lib/db";
import { failure, HttpError, readBody } from "@/lib/http";
import { analyticsSchema } from "@/lib/schemas";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(
      await db.analytics.findMany({
        include: { campaign: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    const data = analyticsSchema.parse(await readBody(req));
    if (!(await db.campaign.findUnique({ where: { id: data.campaignId } })))
      throw new HttpError(404, "Campaign not found");
    return Response.json(await db.analytics.create({ data }), { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
