import * as auth from "@/../auth-schema";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { defaults } from "./common";
import { saunaTable } from "./saunas";

export const experienceTable = sqliteTable(
  "experiences",
  {
    id: integer("id").primaryKey(),

    saunaId: integer("sauna_id")
      .notNull()
      .references(() => saunaTable.id, { onDelete: "cascade" }),

    // author of the experience
    authorId: text("author_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),

    // content where mentions are stored as @<user_id>
    content: text("content").notNull(),

    // numeric rating (e.g. 1–5)
    rating: integer("rating").notNull(),

    ...defaults,
  },
  table => [
    index("experiences_sauna_author_idx").on(
      table.saunaId,
      table.authorId
    ),
    index("experiences_sauna_idx").on(table.saunaId),
    index("experiences_author_idx").on(table.authorId),
  ]
);

export type InsertExperience = typeof experienceTable.$inferInsert;
export type SelectExperience = typeof experienceTable.$inferSelect;

// 🧑‍🤝‍🧑 Users ↔ Experiences (tagged users)
export const experienceTagsTable = sqliteTable(
  "experience_tags",
  {
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experienceTable.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),

    ...defaults,
  },
  table => [
    primaryKey({ columns: [table.experienceId, table.userId] }),
    index("experience_tags_experience_idx").on(table.experienceId),
    index("experience_tags_user_idx").on(table.userId),
  ]
);

export type InsertExperienceTag =
  typeof experienceTagsTable.$inferInsert;
export type SelectExperienceTag =
  typeof experienceTagsTable.$inferSelect;

// 🖼 Images ↔ Experiences (carousel)
export const experienceImagesTable = sqliteTable(
  "experience_images",
  {
    id: integer("id").primaryKey(),

    experienceId: integer("experience_id")
      .notNull()
      .references(() => experienceTable.id, { onDelete: "cascade" }),

    url: text("url").notNull(), // uploadthing URL
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),

    visibility: text("visibility")
      .$type<"public" | "unlisted">()
      .notNull()
      .default("public"),

    ...defaults,
  },
  table => [
    index("experience_images_experience_idx").on(table.experienceId),
  ]
);

export type InsertExperienceImage =
  typeof experienceImagesTable.$inferInsert;
export type SelectExperienceImage =
  typeof experienceImagesTable.$inferSelect;
