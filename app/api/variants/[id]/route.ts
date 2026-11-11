import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { variants } from "../../../../db/schema";

const userId = (request: Request) => request.headers.get("oai-authenticated-user-id") || "local-owner";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const body = (await request.json()) as { content?: string; status?: string };
  const content = body.content?.trim(); if (!content) return Response.json({ error: "La publicación no puede quedar vacía." }, { status: 400 });
  const status = ["draft", "ready"].includes(body.status || "") ? body.status : "draft";
  const db = getDb();
  await db.update(variants).set({ content, status, updatedAt: new Date().toISOString() }).where(and(eq(variants.id, id), eq(variants.userId, userId(request))));
  return Response.json({ ok: true });
}
