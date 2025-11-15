import { SoEmpty } from "@/components/so-empty";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import {
  experienceImagesTable,
  experienceTable,
  saunaTable,
  user,
  userFriendsTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import { Flame, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 * Logged-out -> See public saunas, read public experiences.
 * Logged-in ->
 *   Friends’ recent sauna experiences
 *   Saved saunas
 */
export default async function Home() {
  const session = await getSession();
  const currentUserId = session?.user.id ?? null;

  // ---- PUBLIC SAUNAS (everyone sees these) ----
  const publicSaunas = await db
    .select({
      id: saunaTable.id,
      name: saunaTable.name,
      imageUrl: saunaTable.imageUrl,
      averageRating: saunaTable.averageRating,
      ratingCount: saunaTable.ratingCount,
      visibility: saunaTable.visibility,
      latitude: saunaTable.latitude,
      longitude: saunaTable.longitude,
    })
    .from(saunaTable)
    .where(eq(saunaTable.visibility, "public"))
    .orderBy(
      desc(saunaTable.ratingCount),
      desc(saunaTable.averageRating)
    )
    .limit(6);

  // ---- PUBLIC EXPERIENCES (for logged-out users) ----
  const publicExperiences = await db
    .select({
      id: experienceTable.id,
      saunaId: experienceTable.saunaId,
      rating: experienceTable.rating,
      content: experienceTable.content,
      createdAt: experienceTable.createdAt,
      saunaName: saunaTable.name,
      saunaImage: saunaTable.imageUrl,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
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
    .innerJoin(saunaTable, eq(experienceTable.saunaId, saunaTable.id))
    .innerJoin(user, eq(experienceTable.authorId, user.id))
    .where(
      and(
        eq(saunaTable.visibility, "public"),
        eq(experienceTable.visibility, "public")
      )
    )
    .orderBy(desc(experienceTable.createdAt))
    .limit(10);

  // ---- FRIENDS’ EXPERIENCES (only if logged in & has friends) ----
  let friendsExperiences: typeof publicExperiences | [] | undefined =
    undefined;

  if (currentUserId) {
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

    const friendIdsArray = Array.from(friendIds);
    if (friendIdsArray.length > 0) {
      friendsExperiences = await db
        .select({
          id: experienceTable.id,
          saunaId: experienceTable.saunaId,
          rating: experienceTable.rating,
          content: experienceTable.content,
          createdAt: experienceTable.createdAt,
          saunaName: saunaTable.name,
          saunaImage: saunaTable.imageUrl,
          authorId: user.id,
          authorName: user.name,
          authorImage: user.image,
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
        .innerJoin(
          saunaTable,
          eq(experienceTable.saunaId, saunaTable.id)
        )
        .innerJoin(user, eq(experienceTable.authorId, user.id))
        .where(
          and(
            inArray(experienceTable.authorId, friendIdsArray),
            or(
              eq(experienceTable.visibility, "public"),
              eq(experienceTable.visibility, "unlisted")
            )
          )
        )
        .orderBy(desc(experienceTable.createdAt))
        .limit(10);
    } else {
      friendsExperiences = [];
    }
  }

  const isLoggedIn = !!session;

  return (
    <div className='flex min-h-screen flex-col gap-y-8'>
      {/* HERO */}
      <section className='flex flex-col gap-y-2'>
        <h1 className='font-semibold text-2xl'>
          Discover Saunas Around You
        </h1>
        <p className='text-sm text-muted-foreground'>
          {isLoggedIn
            ? "See your friends' latest sauna experiences and explore public saunas."
            : "Browse public saunas and read real experiences from the community."}
        </p>
      </section>

      {/* LOGGED-IN: FRIENDS FEED */}
      {isLoggedIn && (
        <section className='flex flex-col gap-y-3'>
          <div className='flex flex-col gap-y-2 items-center justify-between'>
            <h2 className='text-sm font-semibold flex items-center gap-2'>
              <Flame className='w-4 h-4' /> Friends' recent
              experiences
            </h2>
            <Link
              href='/new-sauna-experience'
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" })
              )}>
              Log an experience
            </Link>
          </div>

          {friendsExperiences && friendsExperiences.length === 0 && (
            <SoEmpty
              info="Your friends haven't logged any experiences yet."
              ctaHref='/new-sauna-experience'
              cta={
                <>
                  <Flame className='w-4 h-4' /> Be the first to log
                  one
                </>
              }
            />
          )}

          {friendsExperiences && friendsExperiences.length > 0 && (
            <div className='flex flex-col gap-y-3'>
              {friendsExperiences.map(exp => (
                <ExperienceCard key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* LOGGED-OUT: PUBLIC EXPERIENCES */}
      {!isLoggedIn && (
        <section className='flex flex-col gap-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold flex items-center gap-2'>
              <Flame className='w-4 h-4' /> Recent public experiences
            </h2>
            <Link
              href='/login'
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" })
              )}>
              Sign in to log yours
            </Link>
          </div>

          {publicExperiences.length === 0 && (
            <SoEmpty
              info='No experiences yet. Check back soon!'
              cta={<></>}
              ctaHref='#'
            />
          )}

          {publicExperiences.length > 0 && (
            <div className='flex flex-col gap-y-3'>
              {publicExperiences.map(exp => (
                <ExperienceCard key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* PUBLIC SAUNAS (both logged-in and logged-out) */}
      <section className='flex flex-col gap-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-sm font-semibold flex items-center gap-2'>
            <MapPin className='w-4 h-4' /> Explore public saunas
          </h2>
          <Link
            href='/saunas'
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" })
            )}>
            View all
          </Link>
        </div>

        {publicSaunas.length === 0 && (
          <SoEmpty
            info='No public saunas yet. Be the first to add one.'
            ctaHref={""}
            cta={undefined}
          />
        )}

        {publicSaunas.length > 0 && (
          <div className='grid grid-cols-1 gap-3'>
            {publicSaunas.map(s => (
              <Link key={s.id} href={`/saunas/${s.id}`}>
                <Card className='flex flex-row gap-3 p-3 items-center'>
                  <div className='w-20 h-20 rounded-lg overflow-hidden bg-neutral-200 flex items-center justify-center'>
                    {s.imageUrl ? (
                      <Image
                        src={s.imageUrl}
                        alt={s.name ?? "Sauna"}
                        width={80}
                        height={80}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <span className='text-xs text-neutral-500'>
                        No image
                      </span>
                    )}
                  </div>
                  <div className='flex flex-col flex-1'>
                    <span className='text-sm font-medium'>
                      {s.name ?? "Unnamed sauna"}
                    </span>
                    <span className='text-xs text-neutral-500 flex items-center gap-1'>
                      <MapPin className='w-3 h-3' />({s.latitude},{" "}
                      {s.longitude})
                    </span>
                    <span className='text-xs text-neutral-500 mt-1'>
                      {s.ratingCount > 0
                        ? `${s.averageRating.toFixed(1)} · ${s.ratingCount} review${
                            s.ratingCount !== 1 ? "s" : ""
                          }`
                        : "No reviews yet"}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Small presentational card for an experience
function ExperienceCard({
  exp,
}: {
  exp: {
    id: number;
    saunaId: number;
    rating: number;
    content: string;
    createdAt: string;
    saunaName: string | null;
    saunaImage: string | null;
    authorId: string | number;
    authorName: string | null;
    authorImage: string | null;
    imageUrl: string | null;
  };
}) {
  return (
    <Link href={`/saunas/${exp.saunaId}`}>
      <Card className='p-3 flex flex-col gap-y-2'>
        <div className='flex items-center gap-2'>
          {exp.authorImage ? (
            <Image
              src={exp.authorImage}
              alt={exp.authorName ?? "User"}
              width={32}
              height={32}
              className='w-8 h-8 rounded-full object-cover'
            />
          ) : (
            <UserRound className='w-8 h-8 text-neutral-500' />
          )}
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>
              {exp.authorName ?? "Unknown user"}
            </span>
            <span className='text-xs text-neutral-500'>
              {new Date(exp.createdAt).toLocaleDateString("fi-FI", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <span className='ml-auto text-xs text-neutral-600'>
            {exp.rating}/5
          </span>
        </div>

        <p className='text-sm text-neutral-800 line-clamp-3'>
          {exp.content}
        </p>

        <div className='flex items-center gap-2 mt-1'>
          {exp.imageUrl && (
            <div className='w-16 h-16 rounded-md overflow-hidden bg-neutral-200'>
              <Image
                src={exp.imageUrl}
                alt={`Experience at ${exp.saunaName ?? "sauna"}`}
                width={64}
                height={64}
                className='w-full h-full object-cover'
              />
            </div>
          )}
          <div className='flex flex-col'>
            <span className='text-xs font-medium'>
              {exp.saunaName ?? "Unnamed sauna"}
            </span>
            <span className='text-[11px] text-neutral-500'>
              Tap to view sauna
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
