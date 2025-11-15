import * as auth from "@/../auth-schema";
import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const defaults = {
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date()
  ),
};

export type InsertUser = typeof auth.user.$inferInsert;
export type SelectUser = typeof auth.user.$inferSelect;
