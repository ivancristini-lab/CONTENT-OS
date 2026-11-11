import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { moments, variants } from "../../../db/schema";
import { generateVariant, PLATFORMS, type Platform } from "../../../lib/content";

const userId = (request: Request) => request.headers.get("oai-authenticated-user-id") || "local-owner";

export async function GET(request: Request) {
  const db = getDb(); const owner = userId(request);
  const rows = await db.select().from(moments).where(eq(moments.userId, owner)).orderBy(desc(moments.createdAt));
  const allVariants = await db.select().from(variants).where(eq(variants.userId, owner));
  return Response.json({ moments: rows.map((moment) => ({ ...moment, variants: allVariants.filter((item) => item.momentId === moment.id) })) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { rawText?: string; project?: string; platforms?: Platform[] };
  const rawText = body.rawText?.trim() || "";
  if (!rawText) return Response.json({ error: "Contame qué pasó." }, { status: 400 });
  if (rawText.length > 12000) return Response.json({ error: "La captura es demasiado larga." }, { status: 400 });
  const owner = userId(request); const project = ["sod", "orbita", "kadmontech", "personal"].includes(body.project || "") ? body.project! : "sod";
  const selected = [...new Set((body.platforms || []).filter((item): item is Platform => PLATFORMS.includes(item as Platform)))];
  if (!selected.length) return Response.json({ error: "Elegí al menos una red." }, { status: 400 });
  const db = getDb(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await db.insert(moments).values({ id, userId: owner, rawText, project, status: "review", createdAt: now, updatedAt: now });
  await db.insert(variants).values(selected.map((platform) => ({ id: crypto.randomUUID(), momentId: id, userId: owner, platform, content: generateVariant(platform, rawText, project), status: "draft", createdAt: now, updatedAt: now })));
  const [moment] = await db.select().from(moments).where(eq(moments.id, id));
  const createdVariants = await db.select().from(variants).where(eq(variants.momentId, id));
  return Response.json({ moment: { ...moment, variants: createdVariants } }, { status: 201 });
}
