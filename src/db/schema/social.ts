import * as auth from "@/../auth-schema";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { defaults } from "./common";

export const userFriendsTable = sqliteTable(
  "user_friends",
  {
    userId: text("user_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),

    friendId: text("friend_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),

    status: text("status")
      .$type<"pending" | "accepted" | "blocked">()
      .notNull()
      .default("pending"),

    ...defaults,
  },
  table => [
    primaryKey({ columns: [table.userId, table.friendId] }),
    index("user_friends_user_idx").on(table.userId),
    index("user_friends_friend_idx").on(table.friendId),
  ]
);

export type InsertUserFriend = typeof userFriendsTable.$inferInsert;
export type SelectUserFriend = typeof userFriendsTable.$inferSelect;

export const friendInvitesTable = sqliteTable(
  "friend_invites",
  {
    inviterId: text("inviter_id")
      .notNull()
      .references(() => auth.user.id, { onDelete: "cascade" }),

    inviteeEmail: text("invitee_email").notNull(), // normalized lower-case
    inviteeUserId: text("invitee_user_id").references(
      () => auth.user.id,
      {
        onDelete: "set null",
      }
    ),

    sentAt: integer("sent_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),

    ...defaults,
  },
  table => [
    // only one invite per inviter+email
    primaryKey({ columns: [table.inviterId, table.inviteeEmail] }),
  ]
);
