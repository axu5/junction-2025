import { db } from "@/db";
import { experienceTable, experienceImagesTable } from "@/db/schema";
import * as auth from "@/../auth-schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getExperiencesForUser(userId: string) {
  const rows = await db
    .select({
      id: experienceTable.id,
      saunaId: experienceTable.saunaId,
      rating: experienceTable.rating,
      content: experienceTable.content,
      createdAt: experienceTable.createdAt,

      // author fields
      authorId: auth.user.id,
      authorName: auth.user.name,
      authorImage: auth.user.image,

      // first image
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
    .innerJoin(auth.user, eq(experienceTable.authorId, auth.user.id))
    .where(eq(experienceTable.authorId, userId))
    .orderBy(desc(experienceTable.createdAt));

  return rows;
}
