import * as auth from "@/../auth-schema";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { defaults } from "./common";

export const saunaTable = sqliteTable("saunas", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),

  imageUrl: text("image_url"), // main sauna image (uploadthing url)

  // cached rating
  averageRating: real("average_rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),

  // "public" or "unlisted" (only friends of owner(s))
  visibility: text("visibility")
    .$type<"public" | "unlisted">()
    .notNull()
    .default("unlisted"),

  latitude: real("lat").notNull(),
  longitude: real("lng").notNull(),

  ...defaults,
});

export type InsertSauna = typeof saunaTable.$inferInsert;
export type SelectSauna = typeof saunaTable.$inferSelect;

// many-to-many: users ↔ saunas (owners/admins)
export const saunaOwnersTable = sqliteTable(
  "sauna_owners",
  {
    saunaId: integer("sauna_id")
      .notNull()
      .references(() => saunaTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),
    role: text("role")
      .$type<"owner" | "admin">()
      .notNull()
      .default("owner"),

    ...defaults,
  },
  table => [primaryKey({ columns: [table.saunaId, table.userId] })]
);

export type InsertSaunaOwner = typeof saunaOwnersTable.$inferInsert;
export type SelectSaunaOwner = typeof saunaOwnersTable.$inferSelect;
