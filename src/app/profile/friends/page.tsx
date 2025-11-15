import { SoEmpty } from "@/components/so-empty";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { db } from "@/db";
import { user, userFriendsTable } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { and, eq, or, sql } from "drizzle-orm";
import { ChevronLeft, Plus, UserRound } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

async function acceptFriend(formData: FormData) {
  "use server";

  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const currentUserId = session.user.id;
  const inviterId = formData.get("inviterId");

  if (!inviterId || typeof inviterId !== "string") {
    return;
  }

  // Only allow accepting if current user is the "friendId" (receiver)
  await db
    .update(userFriendsTable)
    .set({ status: "accepted" })
    .where(
      and(
        eq(userFriendsTable.userId, inviterId),
        eq(userFriendsTable.friendId, currentUserId),
        eq(userFriendsTable.status, "pending")
      )
    );

  // Revalidate this page so UI updates
  revalidatePath("/profile/friends");
}

export default async function FriendsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const currentUserId = session.user.id;

  // --- Accepted friends ---
  const myFriends = await db
    .select({
      relation: userFriendsTable,
      otherUser: user,
    })
    .from(userFriendsTable)
    .innerJoin(
      user,
      or(
        and(
          eq(userFriendsTable.userId, currentUserId),
          eq(user.id, userFriendsTable.friendId)
        ),
        and(
          eq(userFriendsTable.friendId, currentUserId),
          eq(user.id, userFriendsTable.userId)
        )
      )
    )
    .where(eq(userFriendsTable.status, "accepted"));

  // --- Pending incoming (they invited me) ---
  const incomingPending = await db
    .select({
      relation: userFriendsTable,
      otherUser: user,
    })
    .from(userFriendsTable)
    .innerJoin(
      user,
      and(
        eq(userFriendsTable.userId, user.id), // inviter
        eq(userFriendsTable.friendId, currentUserId)
      )
    )
    .where(eq(userFriendsTable.status, "pending"));

  // --- Pending outgoing (I invited them) ---
  const outgoingPending = await db
    .select({
      relation: userFriendsTable,
      otherUser: user,
    })
    .from(userFriendsTable)
    .innerJoin(
      user,
      and(
        eq(userFriendsTable.friendId, user.id), // invitee
        eq(userFriendsTable.userId, currentUserId)
      )
    )
    .where(eq(userFriendsTable.status, "pending"));

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-between gap-y-2'>
        <Link
          href='/profile'
          className='flex flex-row items-center gap-x-2'>
          <ChevronLeft />
        </Link>
        <h1 className='font-semibold text-2xl'>
          My Friends ({myFriends.length})
        </h1>
        <div />
      </div>

      {myFriends.length === 0 &&
        incomingPending.length === 0 &&
        outgoingPending.length === 0 && (
          <SoEmpty
            info='You have no friends added'
            ctaHref='/profile/friends/add'
            cta={
              <>
                <Plus className='w-4 h-4' /> Add a friend
              </>
            }
          />
        )}

      <Link
        href='/profile/friends/add'
        className={cn(
          buttonVariants({ variant: "outline" }),
          "flex flex-row items-center gap-x-2 justify-start bg-accent"
        )}>
        <Plus className='w-4 h-4' /> Add a friend
      </Link>
      {(myFriends.length > 0 ||
        incomingPending.length > 0 ||
        outgoingPending.length > 0) && (
        <Tabs defaultValue='friends'>
          <TabsList className='w-full'>
            <TabsTrigger value='friends' className='flex-1'>
              Friends
            </TabsTrigger>
            <TabsTrigger value='pending' className='flex-1'>
              Pending
            </TabsTrigger>
          </TabsList>

          {/* FRIENDS TAB */}
          <TabsContent value='friends' className='mt-4'>
            <div className='flex flex-col gap-y-3'>
              {myFriends.length === 0 && (
                <p className='text-sm text-muted-foreground mt-2'>
                  No accepted friends yet.
                </p>
              )}

              {myFriends.length > 0 && (
                <ul className='flex flex-col gap-y-2 mt-2'>
                  {myFriends.map(({ relation, otherUser }) => (
                    <li
                      key={`${relation.userId}-${relation.friendId}`}
                      className='flex items-center justify-between rounded-lg border px-3 py-2'>
                      <div className='flex items-center gap-2'>
                        {otherUser.image ? (
                          // You can swap to next/image if you like
                          <img
                            src={otherUser.image}
                            alt={otherUser.name ?? "Friend"}
                            className='w-8 h-8 rounded-full object-cover'
                          />
                        ) : (
                          <UserRound className='w-8 h-8 text-neutral-500' />
                        )}
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium'>
                            {otherUser.name ?? "Unknown user"}
                          </span>
                          {otherUser.email && (
                            <span className='text-xs text-neutral-500'>
                              {otherUser.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* PENDING TAB */}
          <TabsContent value='pending' className='mt-4'>
            <div className='flex flex-col gap-y-4'>
              {/* Incoming */}
              <div>
                <h2 className='text-sm font-semibold mb-2'>
                  Incoming requests
                </h2>

                {incomingPending.length === 0 && (
                  <p className='text-sm text-muted-foreground'>
                    No incoming requests.
                  </p>
                )}

                {incomingPending.length > 0 && (
                  <ul className='flex flex-col gap-y-2'>
                    {incomingPending.map(
                      ({ relation, otherUser }) => (
                        <li
                          key={`${relation.userId}-${relation.friendId}`}
                          className='flex items-center justify-between rounded-lg border px-3 py-2'>
                          <div className='flex items-center gap-2'>
                            {otherUser.image ? (
                              <img
                                src={otherUser.image}
                                alt={otherUser.name ?? "User"}
                                className='w-8 h-8 rounded-full object-cover'
                              />
                            ) : (
                              <UserRound className='w-8 h-8 text-neutral-500' />
                            )}
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>
                                {otherUser.name ?? "Unknown user"}
                              </span>
                              {otherUser.email && (
                                <span className='text-xs text-neutral-500'>
                                  {otherUser.email}
                                </span>
                              )}
                            </div>
                          </div>

                          <form action={acceptFriend}>
                            <input
                              type='hidden'
                              name='inviterId'
                              value={relation.userId}
                            />
                            <Button type='submit' size='sm'>
                              Accept
                            </Button>
                          </form>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>

              {/* Outgoing */}
              <div>
                <h2 className='text-sm font-semibold mb-2'>
                  Requests you&apos;ve sent
                </h2>

                {outgoingPending.length === 0 && (
                  <p className='text-sm text-muted-foreground'>
                    No pending requests sent.
                  </p>
                )}

                {outgoingPending.length > 0 && (
                  <ul className='flex flex-col gap-y-2'>
                    {outgoingPending.map(
                      ({ relation, otherUser }) => (
                        <li
                          key={`${relation.userId}-${relation.friendId}`}
                          className='flex items-center justify-between rounded-lg border px-3 py-2'>
                          <div className='flex items-center gap-2'>
                            {otherUser.image ? (
                              <img
                                src={otherUser.image}
                                alt={otherUser.name ?? "User"}
                                className='w-8 h-8 rounded-full object-cover'
                              />
                            ) : (
                              <UserRound className='w-8 h-8 text-neutral-500' />
                            )}
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>
                                {otherUser.name ?? "Unknown user"}
                              </span>
                              {otherUser.email && (
                                <span className='text-xs text-neutral-500'>
                                  {otherUser.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className='text-xs text-neutral-500'>
                            Pending
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
