import { db } from "@/db";
import {
  experienceImagesTable,
  experienceTable,
  user,
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function getExperiencesForSauna(saunaId: number) {
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
    .where(eq(experienceTable.saunaId, saunaId))
    .orderBy(desc(experienceTable.createdAt));

  return rows;
}
