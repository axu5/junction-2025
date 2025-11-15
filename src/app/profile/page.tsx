"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
  ChevronRight,
  Heater,
  LogOut,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const logOut = async () => {
    await authClient.signOut();
    router.refresh();
    redirect("/");
  };

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-center'>
        <h1 className='font-semibold tracking-wide text-2xl'>
          Profile Management
        </h1>
      </div>
      <div className='flex flex-col gap-y-2'>
        <Link href='/profile/friends'>
          <Card className='flex flex-row items-center justify-between py-2 px-5'>
            <div className='flex flex-row items-center gap-x-2'>
              <UsersRound className='w-4 h-4' />
              <span className='text-xl'>My Friends</span>
            </div>
            <ChevronRight className='w-4 h-4' />
          </Card>
        </Link>
        <Link href='/profile/saunas'>
          <Card className='flex flex-row items-center justify-between py-2 px-5'>
            <div className='flex flex-row items-center gap-x-2'>
              <Heater className='w-4 h-4' />
              <span className='text-xl'>My Saunas</span>
            </div>
            <ChevronRight className='w-4 h-4' />
          </Card>
        </Link>
      </div>
      <div className='w-full flex flex-row items-end justify-end'>
        <Button
          onClick={logOut}
          className='w-fit flex flex-row rounded-md items-center px-3 py-2 backdrop-blur-xl bg-white/20 border border-red-600 text-red-500'>
          <LogOut className='w-4 h-4' /> Log out
        </Button>
      </div>
    </div>
  );
}
