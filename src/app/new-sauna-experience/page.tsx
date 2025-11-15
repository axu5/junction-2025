import { db } from "@/db";
import {
  saunaOwnersTable,
  saunaTable,
  userFriendsTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { and, inArray, eq, or } from "drizzle-orm";
import NewSaunaExperienceClient from "./client";

type NewSaunaExperiencesProps = {
  searchParams: Promise<{
    sauna_id: string | undefined;
  }>;
};

export default async function NewSaunaExperiences({
  searchParams,
}: NewSaunaExperiencesProps) {
  const { sauna_id: saunaIdParam } = await searchParams;

  const session = await getSession();

  if (!session) {
    redirect("/"); // must be logged in to create an experience
  }

  const currentUserId = session.user.id;

  const preselectedSaunaId = saunaIdParam
    ? Number(saunaIdParam)
    : undefined;

  // 1) Public saunas
  const publicSaunas = await db
    .select({
      id: saunaTable.id,
      name: saunaTable.name,
      imageUrl: saunaTable.imageUrl,
      visibility: saunaTable.visibility,
    })
    .from(saunaTable)
    .where(eq(saunaTable.visibility, "public"));

  // 2) Friends of current user
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
    } else if (row.friendId === currentUserId) {
      friendIds.add(row.userId);
    }
  }

  const friendIdsArray = Array.from(friendIds);

  // 3) Saunas owned by current user or friends
  const ownerIdsForQuery: string[] = [
    currentUserId,
    ...friendIdsArray,
  ];

  const ownedAndFriendsSaunas =
    ownerIdsForQuery.length === 0
      ? []
      : await db
          .select({
            id: saunaTable.id,
            name: saunaTable.name,
            imageUrl: saunaTable.imageUrl,
            visibility: saunaTable.visibility,
            ownerId: saunaOwnersTable.userId,
          })
          .from(saunaOwnersTable)
          .innerJoin(
            saunaTable,
            eq(saunaTable.id, saunaOwnersTable.saunaId)
          )
          .where(inArray(saunaOwnersTable.userId, ownerIdsForQuery));

  // 4) Merge into a map to dedupe and mark ownership/friendship
  type SaunaOption = {
    id: number;
    name: string | null;
    imageUrl: string | null;
    visibility: "public" | "unlisted";
    ownedByCurrentUser: boolean;
    ownedByFriend: boolean;
  };

  const saunasById = new Map<number, SaunaOption>();

  // public saunas first
  for (const s of publicSaunas) {
    saunasById.set(Number(s.id), {
      id: Number(s.id),
      name: s.name,
      imageUrl: s.imageUrl ?? null,
      visibility: s.visibility as "public" | "unlisted",
      ownedByCurrentUser: false,
      ownedByFriend: false,
    });
  }

  // overlay owner/friend info
  for (const row of ownedAndFriendsSaunas) {
    const id = Number(row.id);
    const existing = saunasById.get(id);
    const base: SaunaOption = existing ?? {
      id,
      name: row.name,
      imageUrl: row.imageUrl ?? null,
      visibility: row.visibility as "public" | "unlisted",
      ownedByCurrentUser: false,
      ownedByFriend: false,
    };

    const isOwner = row.ownerId === currentUserId;
    const isFriendOwner =
      row.ownerId !== currentUserId && friendIds.has(row.ownerId);

    saunasById.set(id, {
      ...base,
      ownedByCurrentUser: base.ownedByCurrentUser || isOwner,
      ownedByFriend: base.ownedByFriend || isFriendOwner,
    });
  }

  const saunaOptions = Array.from(saunasById.values()).sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );

  return (
    <NewSaunaExperienceClient
      preselectedSaunaId={preselectedSaunaId}
      saunas={saunaOptions}
    />
  );
}
