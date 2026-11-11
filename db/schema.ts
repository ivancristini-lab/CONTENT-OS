// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
export {};
import { sql } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const moments = sqliteTable("moments", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), rawText: text("raw_text").notNull(),
  project: text("project").notNull().default("sod"), status: text("status").notNull().default("captured"),
  scheduledAt: text("scheduled_at"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("moments_user_created_idx").on(table.userId, table.createdAt), index("moments_user_status_idx").on(table.userId, table.status)]);

export const variants = sqliteTable("variants", {
  id: text("id").primaryKey(), momentId: text("moment_id").notNull().references(() => moments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), platform: text("platform").notNull(), content: text("content").notNull(),
  status: text("status").notNull().default("draft"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("variants_moment_platform_idx").on(table.momentId, table.platform), index("variants_user_idx").on(table.userId)]);
