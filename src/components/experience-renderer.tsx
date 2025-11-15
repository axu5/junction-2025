"use client";

import Image from "next/image";
import { Card, CardFooter } from "./ui/card";
import { Star, Trash, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TASA_Orbiter } from "next/font/google";

type ExperienceRendererProps = {
  experience: {
    id: number;
    saunaId: number;
    rating: number;
    content: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    authorImage: string | null;
    imageUrl: string | null;
  };
};

export function ExperienceRenderer({
  experience: exp,
}: ExperienceRendererProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    authClient.getSession().then(session => {
      setUserId(session.data?.user.id ?? null);
    });
  }, []);

  const deleteExperience = async () => {
    const res = await fetch("/api/experiences", {
      method: "DELETE",
      body: JSON.stringify({ experienceId: exp.id }),
    });

    if (res.ok) {
      toast.success("Deleted review");
      router.refresh();
    } else {
      toast.error("Something went wrong");
    }
  };

  return (
    <Card key={exp.id} className='p-4 flex flex-col gap-y-3'>
      {/* header: avatar, name, date, rating */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          {exp.authorImage ? (
            <Image
              src={exp.authorImage}
              alt={`${exp.authorName ?? "User"} profile picture`}
              width={32}
              height={32}
              className='w-8 h-8 rounded-full object-cover'
            />
          ) : (
            <UserRound className='w-8 h-8' />
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
        </div>
      </div>

      <div className='flex flex-row items-center'>
        {new Array(5).fill(null).map((_, i) => (
          <Star
            key={`exp-${exp.id}-star-${i}`}
            className={cn("w-3 h-3 stroke-0 fill-neutral-300", {
              "fill-yellow-500": exp.rating > i,
            })}
          />
        ))}
        <span className='ml-2 text-xs text-neutral-600'>
          {exp.rating.toFixed(0)}/5
        </span>
      </div>

      {/* content */}
      <p className='text-sm leading-relaxed whitespace-pre-wrap'>
        {exp.content}
      </p>

      {/* image (1 per review for now) */}
      {exp.imageUrl && (
        <div className='mt-1'>
          <Image
            src={exp.imageUrl}
            alt={`Experience of ${exp.authorName ?? "user"}`}
            width={800}
            height={800}
            className='w-full max-h-80 object-cover rounded-lg'
          />
        </div>
      )}

      {exp.authorId === userId && (
        <Button
          className='flex flex-row items-center'
          onClick={deleteExperience}>
          <Trash /> Delete experience
        </Button>
      )}
    </Card>
  );
}
