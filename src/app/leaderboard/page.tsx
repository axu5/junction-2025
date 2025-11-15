import { SoEmpty } from "@/components/so-empty";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { experienceTable, user, userFriendsTable } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { and, eq, inArray, or } from "drizzle-orm";
import { Plus, Trophy, UserRound } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Leaderboard() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const currentUserId = session.user.id;

  // 1) Get accepted friends
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

  // No friends at all → show existing empty state
  if (friendIds.size === 0) {
    return (
      <div className='flex flex-col gap-y-5'>
        <div className='flex w-full flex-row items-center justify-center'>
          <h1 className='font-semibold text-2xl'>Leaderboard</h1>
        </div>

        <div className='flex flex-col items-center gap-y-3'>
          <SoEmpty
            info="You haven't added any friends on Saunapoint yet"
            ctaHref='/profile/friends/add'
            cta={
              <>
                <Plus className='w-4 h-4' />
                Add your first friend
              </>
            }
          />
        </div>
      </div>
    );
  }

  // 2) Build the set of users to rank: you + friends
  const leaderboardIds = new Set<string>([
    currentUserId,
    ...friendIds,
  ]);
  const leaderboardIdsArray = Array.from(leaderboardIds);

  // 3) Fetch all experiences by these users (we'll filter to last 30 days in JS)
  const allExperiences = await db
    .select({
      authorId: experienceTable.authorId,
      createdAt: experienceTable.createdAt,
    })
    .from(experienceTable)
    .where(inArray(experienceTable.authorId, leaderboardIdsArray));

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const cutoff = now - THIRTY_DAYS;

  // 4) Count experiences per user in the last 30 days
  const counts = new Map<string | number, number>();

  for (const exp of allExperiences) {
    const createdAtMs = new Date(exp.createdAt).getTime();
    if (Number.isNaN(createdAtMs) || createdAtMs < cutoff) continue;

    const key = exp.authorId;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // If nobody has any experiences in the last 30 days:
  const anyActivity = Array.from(counts.values()).some(v => v > 0);

  if (!anyActivity) {
    return (
      <div className='flex flex-col gap-y-5'>
        <div className='flex w-full flex-row items-center justify-center'>
          <h1 className='font-semibold text-2xl'>Leaderboard</h1>
        </div>

        <div className='flex flex-col items-center gap-y-3'>
          <SoEmpty
            info='No sauna experiences logged in the last month between you and your friends.'
            ctaHref='/new-sauna-experience'
            cta={
              <>
                <Trophy className='w-4 h-4' />
                Log your first experience
              </>
            }
          />
        </div>
      </div>
    );
  }

  // 5) Fetch user info for leaderboard participants
  const leaderboardUsers = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
    })
    .from(user)
    .where(inArray(user.id, leaderboardIdsArray));

  const userById = new Map<
    string | number,
    (typeof leaderboardUsers)[number]
  >();
  for (const u of leaderboardUsers) {
    userById.set(u.id, u);
  }

  // 6) Build the leaderboard array
  type LeaderRow = {
    userId: string | number;
    name: string;
    image: string | null;
    count: number;
    isYou: boolean;
  };

  const leaderboard: LeaderRow[] = Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .map(([userId, count]) => {
      const u = userById.get(userId);
      return {
        userId,
        name: u?.name ?? "Unknown sauna enjoyer",
        image: u?.image ?? null,
        count,
        isYou: userId === currentUserId,
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-center'>
        <h1 className='font-semibold tracking-wide text-2xl'>
          Friend Leaderboard
        </h1>
      </div>

      <div className='flex flex-col gap-y-4'>
        <div className='flex flex-col gap-y-2'>
          {leaderboard.map((row, index) => (
            <Card key={row.userId} className='p-3'>
              <div
                className={cn(
                  "flex flex-row items-center justify-between rounded-lg px-5 py-2",
                  row.isYou && "bg-accent/40"
                )}>
                <div className='flex items-center gap-x-2'>
                  <span className='text-sm font-semibold w-6 text-right'>
                    {index + 1}
                  </span>

                  {row.image ? (
                    <Image
                      src={row.image}
                      alt={row.name}
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover'
                    />
                  ) : (
                    <UserRound className='w-8 h-8 text-neutral-500' />
                  )}

                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>
                      {row.name}
                      {row.isYou && (
                        <span className='text-xs text-orange-600 ml-1'>
                          (you)
                        </span>
                      )}
                    </span>
                    <span className='text-xs text-neutral-500'>
                      {row.count} sauna experience
                      {row.count !== 1 && "s"} in the last month
                    </span>
                  </div>
                </div>

                <Trophy
                  className={cn(
                    "w-4 h-4 text-neutral-400",
                    index === 0 && "text-yellow-500",
                    index === 1 && "text-slate-400",
                    index === 2 && "text-amber-700"
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* TODO: Add a shadcn + Recharts line/area chart showing total experiences
            per week over the last month for you + your top friends. */}
      </div>
    </div>
  );
}
