import { LoginRequiredDrawer } from "@/components/login-required-drawer";
import { getSession } from "@/lib/auth";
import {
  Flame,
  Gamepad2,
  LogIn,
  Medal,
  Plus,
  UserRoundPen,
} from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saunapoint",
  description: "Saunapoint - your sauna experience tracking app",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className='flex flex-row items-center justify-center w-screen py-6'>
          <Link
            href='/'
            className='flex flex-row gap-x-2 items-center font-semibold text-2xl'>
            <div>
              <Image
                className='object-cover'
                src='/saunapoint.png'
                alt='Saunapoint logo'
                width={32}
                height={32}
              />
            </div>
            Saunapoint
          </Link>
        </div>

        <main className='px-10 mb-24'>{children}</main>

        <Navbar />
        <Toaster position='top-center' />
      </body>
    </html>
  );
}

async function Navbar() {
  const session = await getSession();
  const isLoggedIn = !!session;

  return (
    <nav className='fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full backdrop-blur-xl bg-white/20 shadow-lg border border-white/10'>
      <div className='max-w-md px-4'>
        <ul className='flex justify-evenly flex-row items-center gap-x-5'>
          <li className='py-2'>
            <Link href='/games' className=''>
              <Gamepad2 className='w-5 h-5 m-2' />
            </Link>
          </li>
          <li className='py-2'>
            <Link href='/leaderboard' className=''>
              <Medal className='w-5 h-5 m-2' />
            </Link>
          </li>
          <li className='py-2'>
            {isLoggedIn ? (
              <Link
                href='/new-sauna-experience'
                className='border-neutral-700/25 block rounded-full border-2'>
                <Plus className='w-6 h-6 mx-4 my-2' />
              </Link>
            ) : (
              <LoginRequiredDrawer>
                <div className='border-neutral-700/25 block rounded-full border-2'>
                  <Plus className='w-6 h-6 mx-4 my-2' />
                </div>
              </LoginRequiredDrawer>
            )}
          </li>
          <li className='py-2'>
            <Link href='/sauna-experiences' className=''>
              <Flame className='w-5 h-5 m-2' />
            </Link>
          </li>
          {session ? (
            <li className='py-2'>
              <Link href='/profile' className=''>
                {session.user.image ? (
                  <div className='w-5 h-5 m-2 rounded-full flex items-center justify-center'>
                    <Image
                      className='object-cover rounded-full w-full h-full'
                      src={session.user.image}
                      alt='Your profile picture'
                      width={16}
                      height={16}
                    />
                  </div>
                ) : (
                  <UserRoundPen className='w-5 h-5 m-2' />
                )}
              </Link>
            </li>
          ) : (
            <LoginRequiredDrawer>
              <LogIn className='w-5 h-5 m-2' />
            </LoginRequiredDrawer>
          )}
        </ul>
      </div>
    </nav>
  );
}
