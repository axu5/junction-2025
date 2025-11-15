import { db } from "@/db";
import {
  experienceImagesTable,
  experienceTable,
  saunaTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: {
    saunaId?: number;
    rating?: number;
    content?: string;
    imageUrl?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const saunaId = Number(body.saunaId);
  const rating = Number(body.rating);
  const content = (body.content ?? "").trim();
  const imageUrl = body.imageUrl ?? null;

  if (!Number.isFinite(saunaId)) {
    return NextResponse.json(
      { ok: false, error: "saunaId is required" },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5 ||
    rating !== (rating | 0)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "rating must be an integer between 1 and 5",
      },
      { status: 400 }
    );
  }

  if (!content) {
    return NextResponse.json(
      { ok: false, error: "content is required" },
      { status: 400 }
    );
  }

  const authorId = session.user.id;

  try {
    const result = await db.transaction(async tx => {
      // ensure sauna exists
      const sauna = await tx
        .select({
          id: saunaTable.id,
          averageRating: saunaTable.averageRating,
          ratingCount: saunaTable.ratingCount,
        })
        .from(saunaTable)
        .where(eq(saunaTable.id, saunaId))
        .get();

      if (!sauna) {
        throw new Error("Sauna not found");
      }

      // insert experience
      const inserted = await tx
        .insert(experienceTable)
        .values({
          saunaId,
          authorId,
          rating,
          content,
        })
        .returning({ id: experienceTable.id })
        .get();

      const experienceId = inserted.id;

      // optional image
      if (imageUrl) {
        await tx.insert(experienceImagesTable).values({
          experienceId,
          url: imageUrl,
          sortOrder: 0,
        });
      }

      // update sauna rating
      const newCount = sauna.ratingCount + 1;
      const newAvg =
        (sauna.averageRating * sauna.ratingCount + rating) / newCount;

      await tx
        .update(saunaTable)
        .set({
          averageRating: newAvg,
          ratingCount: newCount,
        })
        .where(eq(saunaTable.id, saunaId));

      return { experienceId, saunaId };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("POST /api/experiences error:", err);
    const msg =
      err?.message === "Sauna not found"
        ? "Sauna not found"
        : "Failed to create experience";
    const status = msg === "Sauna not found" ? 404 : 500;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { experienceId?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const experienceId = Number(body.experienceId);

  if (!Number.isFinite(experienceId)) {
    return NextResponse.json(
      { ok: false, error: "experienceId is required" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  try {
    await db.transaction(async tx => {
      // fetch experience (and saunaId & rating) to validate + recalc
      const exp = await tx
        .select({
          id: experienceTable.id,
          saunaId: experienceTable.saunaId,
          authorId: experienceTable.authorId,
          rating: experienceTable.rating,
        })
        .from(experienceTable)
        .where(eq(experienceTable.id, experienceId))
        .get();

      if (!exp) {
        throw new Error("NotFound");
      }

      if (exp.authorId !== userId) {
        throw new Error("Forbidden");
      }

      const saunaId = exp.saunaId;

      await tx
        .delete(experienceImagesTable)
        .where(eq(experienceImagesTable.experienceId, experienceId));

      await tx
        .delete(experienceTable)
        .where(eq(experienceTable.id, experienceId));

      // recalc sauna rating cache from remaining experiences
      const aggregate = await tx
        .select({
          count: sql<number>`count(*)`,
          avg: sql<number | null>`avg(${experienceTable.rating})`,
        })
        .from(experienceTable)
        .where(eq(experienceTable.saunaId, saunaId))
        .get();

      const newCount = aggregate?.count ?? 0;
      const newAvg = aggregate?.avg ?? 0;

      await tx
        .update(saunaTable)
        .set({
          averageRating: newAvg,
          ratingCount: newCount,
        })
        .where(eq(saunaTable.id, saunaId));
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/experiences error:", err);

    if (err?.message === "NotFound") {
      return NextResponse.json(
        { ok: false, error: "Experience not found" },
        { status: 404 }
      );
    }

    if (err?.message === "Forbidden") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Failed to delete experience" },
      { status: 500 }
    );
  }
}
