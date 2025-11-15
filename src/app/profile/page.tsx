"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  ChevronRight,
  Heater,
  UserRound,
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
    <div className='flex flex-col gap-y-2'>
      <div className='w-full flex flex-row items-center justify-between rounded-md px-3 py-2 backdrop-blur-xl bg-white/20 shadow-sm'>
        <div className='flex flex-row items-center gap-x-2'>
          <UserRound className='w-4 h-4' />
          <span className='text-sm'>Profile</span>
        </div>
        <div>
          <ChevronRight className='w-4 h-4' />
        </div>
      </div>
      <Link
        href='/profile/friends'
        className='w-full flex flex-row items-center justify-between rounded-md px-3 py-2 backdrop-blur-xl bg-white/20 shadow-sm'>
        <div className='flex flex-row items-center gap-x-2'>
          <UsersRound className='w-4 h-4' />
          <span className='text-sm'>Friends</span>
        </div>
        <div className='flex flex-row items-center gap-x-2'>
          <ChevronRight className='w-4 h-4' />
        </div>
      </Link>
      <Link
        href='/profile/saunas'
        className='w-full flex flex-row items-center justify-between rounded-md px-3 py-2 backdrop-blur-xl bg-white/20 shadow-sm'>
        <span className='flex flex-row items-center gap-x-2'>
          <Heater className='w-4 h-4' />
          <span className='text-sm'>My saunas</span>
        </span>
        <div className='flex flex-row items-center gap-x-2'>
          <ChevronRight className='w-4 h-4' />
        </div>
      </Link>
      <Button
        onClick={logOut}
        className='w-full flex flex-row items-center justify-between rounded-md px-3 py-2 backdrop-blur-xl bg-white/20 shadow-sm border border-red-600 mt-8'>
        <span className='text-red-500 font-semibold text-sm mx-auto'>
          Log out
        </span>
      </Button>
    </div>
  );
}
