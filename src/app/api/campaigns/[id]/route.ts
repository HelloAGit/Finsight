import { db } from "@/lib/db";
import { failure, HttpError, readBody } from "@/lib/http";
import { draftPatchSchema, validateChannel, variantSchema } from "@/lib/schemas";
import { approvalUpdate } from "@/lib/drafts";
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { draftId, status, ...edits } = draftPatchSchema.parse(await readBody(req));
    const id = (await params).id;
    const updated = await db.$transaction(async tx => {
      const draft = await tx.draft.findFirst({ where: { id: draftId, campaignId: id }, include: { campaign: true } });
      if (!draft) throw new HttpError(404, "Draft not found");
      const changed = Object.keys(edits).length > 0;
      const variant = variantSchema.parse({ headline: draft.headline, body: draft.body, cta: draft.cta, hashtags: JSON.parse(draft.hashtags), positioning: draft.positioning, ...edits });
      try { validateChannel(variant, draft.campaign.channel); } catch (e) { throw new HttpError(400, (e as Error).message); }
      let approval;
      try { approval = approvalUpdate(changed, status); } catch (e) { throw new HttpError(400, (e as Error).message); }
      return tx.draft.update({ where: { id: draftId }, data: { ...variant, hashtags: JSON.stringify(variant.hashtags), ...approval } });
    });
    return Response.json(updated);
  } catch (e) { return failure(e); }
}
