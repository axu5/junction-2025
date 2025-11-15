import { SaunaRenderer } from "@/components/sauna-renderer";
import { SoEmpty } from "@/components/so-empty";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { saunaOwnersTable, saunaTable } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MySaunas() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const mySaunas = await db
    .select({
      sauna: saunaTable,
    })
    .from(saunaOwnersTable)
    .innerJoin(
      saunaTable,
      eq(saunaTable.id, saunaOwnersTable.saunaId)
    )
    .where(eq(saunaOwnersTable.userId, session.user.id));

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-between gap-y-2'>
        <Link
          href='/profile'
          className='flex flex-row items-center gap-x-2'>
          <ChevronLeft />
        </Link>
        <h1 className='font-semibold text-2xl'>My Saunas</h1>
        <div />
      </div>

      {mySaunas.length === 0 && (
        <SoEmpty
          info='You have no saunas added'
          ctaHref='/profile/saunas/add'
          cta={
            <>
              <Plus /> Add a sauna
            </>
          }
        />
      )}
      {mySaunas.length > 0 && (
        <div className='flex flex-col gap-y-3'>
          <Link
            href='/profile/saunas/add'
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex flex-row items-center gap-x-2 bg-accent"
            )}>
            <Plus /> Add a sauna
          </Link>

          {mySaunas.map(({ sauna }) => (
            <SaunaRenderer key={sauna.id} sauna={sauna} />
          ))}
        </div>
      )}
    </div>
  );
}
