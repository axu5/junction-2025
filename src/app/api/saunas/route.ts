import { db } from "@/db";
import {
  InsertSauna,
  saunaOwnersTable,
  saunaTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const newSauna = (await req.json()) as InsertSauna;

  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { ok: false },
      {
        status: 401,
      }
    );
  }

  const saunaId = await db.transaction(async tx => {
    const { id } = await tx
      .insert(saunaTable)
      .values(newSauna)
      .returning()
      .get();
    await tx.insert(saunaOwnersTable).values({
      saunaId: id,
      userId: user.user.id,
      role: "owner",
    });
    return id;
  });

  return NextResponse.json({ saunaId });
}

export async function DELETE(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let saunaId: number;

  try {
    const body = (await req.json()) as { saunaId?: number | string };
    if (!body.saunaId) {
      return NextResponse.json(
        { ok: false, error: "Missing saunaId" },
        { status: 400 }
      );
    }

    saunaId = Number(body.saunaId);
    if (!Number.isFinite(saunaId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid saunaId" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // Check ownership
  const ownerRow = await db
    .select()
    .from(saunaOwnersTable)
    .where(
      and(
        eq(saunaOwnersTable.saunaId, saunaId),
        eq(saunaOwnersTable.userId, userId),
        eq(saunaOwnersTable.role, "owner")
      )
    )
    .get();

  if (!ownerRow) {
    // user is not an owner of this sauna
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // Delete inside a transaction (handles related/cascading deletes)
  await db.transaction(async tx => {
    await tx.delete(saunaTable).where(eq(saunaTable.id, saunaId));
    // saunaOwnersTable rows will be removed automatically
    // if you set `onDelete: "cascade"` on saunaOwnersTable.saunaId
  });

  return NextResponse.json({ ok: true });
}
