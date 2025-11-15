"use client";

import { SelectSauna } from "@/db/schema";
import { CameraOff, ChevronRight, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SaunaRendererProps = {
  sauna: SelectSauna;
};

export function SaunaRenderer({ sauna }: SaunaRendererProps) {
  const router = useRouter();

  const deleteSauna = async (saunaId: number) => {
    const res = await fetch("/api/saunas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saunaId }),
    });

    if (res.ok) {
      toast.success(`Deleted ${sauna.name}`);
      router.refresh();
    } else {
      toast.error("Something went wrong");
    }
  };

  return (
    <Card>
      <CardHeader>
        <Link
          href={`/saunas/${sauna.id}`}
          className='flex flex-row justify-between items-center'>
          <span className='flex flex-row items-center gap-x-2 text-2xl'>
            {sauna.name}
          </span>
          <Button
            className='flex flex-row items-center h-8 w-6 bg-neutral-300 shadow-none'
            onClick={() => deleteSauna(sauna.id)}>
            <Trash className='stroke-black' />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {sauna.imageUrl !== null ? (
          <div className='bg-neutral-200 w-full gap-x-2 aspect-video flex items-center justify-center rounded-lg'>
            <Image
              className='object-cover w-full max-h-full rounded-lg'
              src={sauna.imageUrl}
              alt={`Picture of ${sauna.name} sauna`}
              width={1920}
              height={1920}
            />
          </div>
        ) : (
          <div className='bg-neutral-200 w-full gap-x-2 aspect-video flex items-center justify-center rounded-lg'>
            <CameraOff className='w-4 h-4' /> No image
          </div>
        )}
      </CardContent>
    </Card>
  );
}
