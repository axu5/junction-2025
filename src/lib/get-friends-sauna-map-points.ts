import { db } from "@/db";
import {
  experienceTable,
  saunaTable,
  user,
  userFriendsTable,
} from "@/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";

export type FriendSaunaPoint = {
  saunaId: number;
  saunaName: string | null;
  latitude: number;
  longitude: number;
  authorId: string | number;
  authorName: string | null;
  authorImage: string | null;
};

/**
 * One point per (friend, sauna) combo.
 * Only includes:
 * - friends of current user
 * - experiences with visibility = "public" or "friends"
 */
export async function getFriendsSaunaMapPoints(
  currentUserId: string
): Promise<FriendSaunaPoint[]> {
  // 1) Find accepted friends
  const friendRows = await db
    .select()
    .from(userFriendsTable)
    .where(
      and(
        eq(userFriendsTable.status, "accepted"),
        or(
          eq(userFriendsTable.userId, currentUserId),
          eq(userFriendsTable.friendId, currentUserId)
        )
      )
    );

  const friendIds = new Set<string>();
  for (const row of friendRows) {
    if (row.userId === currentUserId) {
      friendIds.add(row.friendId);
    } else {
      friendIds.add(row.userId);
    }
  }

  if (friendIds.size === 0) return [];

  const friendIdsArray = Array.from(friendIds);

  // 2) Unique (authorId, saunaId) combos with sauna location + author info
  const rows = await db
    .select({
      saunaId: saunaTable.id,
      saunaName: saunaTable.name,
      latitude: saunaTable.latitude,
      longitude: saunaTable.longitude,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(experienceTable)
    .innerJoin(saunaTable, eq(saunaTable.id, experienceTable.saunaId))
    .innerJoin(user, eq(user.id, experienceTable.authorId))
    .where(
      and(
        inArray(experienceTable.authorId, friendIdsArray),
        or(
          eq(experienceTable.visibility, "public"),
          eq(experienceTable.visibility, "unlisted")
        )
      )
    )
    .groupBy(
      experienceTable.authorId,
      experienceTable.saunaId,
      saunaTable.id,
      saunaTable.latitude,
      saunaTable.longitude,
      saunaTable.name,
      user.id,
      user.name,
      user.image
    );

  // filter out saunas with missing coords just in case
  return rows
    .filter(
      r =>
        typeof r.latitude === "number" &&
        typeof r.longitude === "number"
    )
    .map(r => ({
      saunaId: Number(r.saunaId),
      saunaName: r.saunaName,
      latitude: r.latitude,
      longitude: r.longitude,
      authorId: r.authorId,
      authorName: r.authorName,
      authorImage: r.authorImage,
    }));
}
