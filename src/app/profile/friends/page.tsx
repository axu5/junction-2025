import { SoEmpty } from "@/components/so-empty";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import {
  saunaOwnersTable,
  saunaTable,
  userFriendsTable,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { eq, or } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MySaunas() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const myFriends = await db
    .select()
    .from(userFriendsTable)
    .where(
      or(
        eq(userFriendsTable.userId, session.user.id),
        eq(userFriendsTable.friendId, session.user.id)
      )
    );

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-center'>
        <h1 className='font-semibold text-2xl'>
          My Friends ({myFriends.length})
        </h1>
      </div>

      {myFriends.length === 0 && (
        <SoEmpty
          info='You have no friends added'
          ctaHref='/profile/friends/add'
          cta={
            <>
              <Plus /> Add a friend
            </>
          }
        />
      )}

      {myFriends.length > 0 && (
        <div className='flex flex-col gap-y-3'>
          <Link
            href='/profile/friends/add'
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "flex flex-row items-center gap-x-2"
            )}>
            <Plus /> Add a friend
          </Link>
        </div>
      )}
    </div>
  );
}
