import "server-only";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function readBody(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  // Next's internal URL may use localhost even when the browser uses 127.0.0.1.
  // Host is the destination authority sent by the browser, not a forwarded host.
  const expectedOrigin = `${requestUrl.protocol}//${request.headers.get("host") || requestUrl.host}`;
  if (origin && origin !== expectedOrigin) throw new HttpError(403, "Cross-origin writes are not allowed");
  if (Number(request.headers.get("content-length")) > 20000) throw new HttpError(413, "Request is too large");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 20000) throw new HttpError(413, "Request is too large");
  try { return JSON.parse(text); } catch { throw new HttpError(400, "Send a valid JSON request"); }
}
export function failure(error: unknown) {
  if (error instanceof ZodError) return Response.json({ error: error.issues.map(i => `${i.path.join(".") || "Input"}: ${i.message}`).join("; ") }, { status: 400 });
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "Record not found" }, { status: 404 });
  // Provider exceptions may contain request details. Never return or log their raw payload.
  return Response.json({ error: "Unable to complete the request. Check the database setup or provider configuration and try again. No fallback provider was charged." }, { status: 502 });
}
