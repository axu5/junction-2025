"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export default function AddFriendPage() {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequested, setLastRequested] = useState<string | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = identifier.trim();
    if (!trimmed) {
      toast.error("Please enter an email");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error ?? "Failed to send friend request"
        );
      }

      setLastRequested(trimmed);
      setIdentifier("");

      toast.success("Friend request sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-start gap-y-6 mt-6'>
      <div className='text-center space-y-1'>
        <h1 className='font-semibold text-2xl'>Add friends</h1>
        <p className='text-sm text-muted-foreground max-w-md'>
          Send a friend request by typing their email. Once they
          accept, you&apos;ll see each other&apos;s sauna experiences.
        </p>
      </div>

      <Card className='w-full max-w-md p-4 space-y-4'>
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div className='flex flex-col gap-y-2'>
            <Label htmlFor='friend-identifier'>Friend email</Label>
            <Input
              id='friend-identifier'
              type='email'
              placeholder='user@example.com'
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete='off'
            />
          </div>

          <Button
            type='submit'
            className='w-full'
            disabled={
              isLoading ||
              !identifier.trim() ||
              !z.email().safeParse(identifier.trim()).success
            }>
            {isLoading ? "Sending..." : "Send friend request"}
          </Button>
        </form>

        {lastRequested && (
          <p className='text-xs text-muted-foreground'>
            Last request sent to{" "}
            <span className='font-mono'>{lastRequested}</span>.
          </p>
        )}
      </Card>
    </div>
  );
}
