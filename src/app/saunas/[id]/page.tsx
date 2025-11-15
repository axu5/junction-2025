import { ExperienceRenderer } from "@/components/experience-renderer";
import { SoEmpty } from "@/components/so-empty";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import {
  saunaOwnersTable,
  saunaTable,
  user,
  userFriendsTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getExperiencesForSauna } from "@/lib/get-experiences-for-sauna";
import { cn } from "@/lib/utils";
import { and, eq, inArray, or } from "drizzle-orm";
import {
  CameraOff,
  NotepadText,
  Star,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SaunaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: saunaId } = await params;
  const id = parseInt(saunaId);

  if (Number.isNaN(id)) {
    redirect("/");
  }

  const session = await getSession();

  const saunaInfo = await db
    .select()
    .from(saunaTable)
    .where(eq(saunaTable.id, id))
    .get();

  const ownersInfo = await db
    .select()
    .from(saunaOwnersTable)
    .where(eq(saunaOwnersTable.saunaId, id));

  const owner = ownersInfo.find(o => o.role === "owner");

  if (!saunaInfo || ownersInfo.length === 0 || !owner) {
    redirect("/");
  }

  const ownerUserObj = await db
    .select({
      name: user.name,
      id: user.id,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, owner.userId))
    .get();

  if (!ownerUserObj) {
    redirect("/");
  }

  if (saunaInfo.visibility !== "public") {
    if (!session) {
      redirect("/");
    }

    const currentUserId = session.user.id;

    const ownerIds = Array.from(
      new Set(ownersInfo.map(o => o.userId))
    );

    const currentUserIdNum = currentUserId;

    // Get all accepted friendships where *any* owner/admin is involved
    const ownerFriendRows = await db
      .select()
      .from(userFriendsTable)
      .where(
        and(
          eq(userFriendsTable.status, "accepted"),
          or(
            inArray(userFriendsTable.userId, ownerIds),
            inArray(userFriendsTable.friendId, ownerIds)
          )
        )
      );

    // Build a set of unique friend IDs of all owners/admins
    const friendIds = new Set<string>();

    for (const row of ownerFriendRows) {
      const userId = row.userId;
      const friendId = row.friendId;

      if (ownerIds.includes(userId)) {
        friendIds.add(friendId);
      }
      if (ownerIds.includes(friendId)) {
        friendIds.add(userId);
      }
    }

    const isFriendOfAnyOwner = friendIds.has(currentUserIdNum);
    const isOwner = ownerIds.includes(currentUserId);

    if (!isFriendOfAnyOwner && !isOwner) {
      redirect("/");
    }
  }

  const experiences = await getExperiencesForSauna(id);

  return (
    <div className='flex flex-col gap-y-5'>
      <div>
        {saunaInfo.imageUrl !== null ? (
          <div className='bg-neutral-200 w-full gap-x-2 aspect-video flex items-center justify-center rounded-lg'>
            <Image
              className='object-cover w-full max-h-full rounded-lg'
              src={saunaInfo.imageUrl}
              alt={`Picture of ${saunaInfo.name} sauna`}
              width={1920}
              height={1920}
            />
          </div>
        ) : (
          <div className='bg-neutral-200 w-full gap-x-2 aspect-video flex items-center justify-center rounded-lg'>
            <CameraOff className='w-4 h-4' /> No image
          </div>
        )}
      </div>

      <div className='flex flex-col gap-y-2'>
        <h1 className='font-semibold text-2xl'>{saunaInfo.name}</h1>
        <div className='flex flex-row items-center gap-x-2'>
          <div className='flex flex-row items-center'>
            {new Array(5).fill(null).map((_, i) => (
              <Star
                key={`star-rating-${i}`}
                className={cn("w-4 h-4 stroke-0 fill-neutral-400", {
                  "fill-yellow-500":
                    Math.round(saunaInfo.averageRating) > i,
                })}
              />
            ))}
          </div>
          <span className='text-sm'>
            {saunaInfo.averageRating.toFixed(1)} (
            {saunaInfo.ratingCount} review
            {saunaInfo.ratingCount !== 1 && "s"})
          </span>
        </div>
        <div className='flex flex-row items-center gap-x-4'>
          {ownerUserObj.image ? (
            <div className='w-6 h-6'>
              <Image
                className='aspect-square rounded-full object-cover'
                src={ownerUserObj.image}
                alt={`${ownerUserObj.name} profile picture`}
                width={32}
                height={32}
              />
            </div>
          ) : (
            <UserRound className='w-6 h-6' />
          )}
          <span className='text-sm'>{ownerUserObj.name}</span>
        </div>
      </div>

      {experiences.length === 0 && (
        <SoEmpty
          cta={
            <>
              <Star className='w-4 h-4' /> Be the first to leave a
              public review
            </>
          }
          info={`No public reviews for ${saunaInfo.name}`}
          ctaHref={`/new-sauna-experience?sauna_id=${saunaInfo.id}`}
        />
      )}

      {experiences.length > 0 && (
        <>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={`/new-sauna-experience?sauna_id=${saunaInfo.id}`}>
            <NotepadText className='w-4 h-4' /> Leave a review
          </Link>

          <div className='flex flex-col gap-y-3'>
            {experiences.map(exp => (
              <ExperienceRenderer key={exp.id} experience={exp} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
