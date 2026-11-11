import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { moments } from "../../../../db/schema";

const userId = (request: Request) => request.headers.get("oai-authenticated-user-id") || "local-owner";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const body = (await request.json()) as { status?: string; scheduledAt?: string | null };
  const status = ["review", "ready", "scheduled", "archived"].includes(body.status || "") ? body.status : undefined;
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null;
  if (body.status === "scheduled" && !scheduledAt) return Response.json({ error: "Elegí fecha y hora." }, { status: 400 });
  const db = getDb();
  await db.update(moments).set({ ...(status ? { status } : {}), ...(body.scheduledAt !== undefined ? { scheduledAt } : {}), updatedAt: new Date().toISOString() }).where(and(eq(moments.id, id), eq(moments.userId, userId(request))));
  return Response.json({ ok: true });
}
