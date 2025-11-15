import { db } from "@/db";
import {
  experienceImagesTable,
  experienceTable,
  user,
  userFriendsTable,
} from "@/db/schema";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getSession } from "./auth";

/**
 * Fetch experiences for a sauna, respecting visibility:
 * - Logged out: only public experiences
 * - Logged in: public + friends-only (if author is a friend)
 */
export async function getExperiencesForSauna(saunaId: number) {
  const session = await getSession();
  const currentUserId = session?.user.id ?? null;

  // If no logged-in user → only public experiences
  if (!currentUserId) {
    const rows = await db
      .select({
        id: experienceTable.id,
        saunaId: experienceTable.saunaId,
        rating: experienceTable.rating,
        content: experienceTable.content,
        createdAt: experienceTable.createdAt,
        // author
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
        // FIRST image (ordered by sortOrder ascending)
        imageUrl: sql<string | null>`
          (
            SELECT url
            FROM ${experienceImagesTable}
            WHERE ${experienceImagesTable.experienceId} = ${experienceTable.id}
            ORDER BY ${experienceImagesTable.sortOrder} ASC
            LIMIT 1
          )
        `,
      })
      .from(experienceTable)
      .innerJoin(user, eq(experienceTable.authorId, user.id))
      .where(
        and(
          eq(experienceTable.saunaId, saunaId),
          eq(experienceTable.visibility, "public")
        )
      )
      .orderBy(desc(experienceTable.createdAt));

    return rows;
  }

  // Logged in: get friend IDs once (cheap query on userFriendsTable)
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

  friendIds.add(currentUserId);

  const friendIdsArray = Array.from(friendIds);

  const rows = await db
    .select({
      id: experienceTable.id,
      saunaId: experienceTable.saunaId,
      rating: experienceTable.rating,
      content: experienceTable.content,
      createdAt: experienceTable.createdAt,
      // author
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      // FIRST image (ordered by sortOrder ascending)
      imageUrl: sql<string | null>`
        (
          SELECT url
          FROM ${experienceImagesTable}
          WHERE ${experienceImagesTable.experienceId} = ${experienceTable.id}
          ORDER BY ${experienceImagesTable.sortOrder} ASC
          LIMIT 1
        )
      `,
    })
    .from(experienceTable)
    .innerJoin(user, eq(experienceTable.authorId, user.id))
    .where(
      and(
        eq(experienceTable.saunaId, saunaId),
        // visibility:
        //  - public
        //  - OR friends-only where author is in friendIds
        or(
          eq(experienceTable.visibility, "public"),
          friendIdsArray.length > 0
            ? and(
                eq(experienceTable.visibility, "unlisted"),
                inArray(experienceTable.authorId, friendIdsArray)
              )
            : // if no friends, this branch becomes false
              eq(sql`1`, 0)
        )
      )
    )
    .orderBy(desc(experienceTable.createdAt));

  return rows;
}
