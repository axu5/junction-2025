"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { InsertExperience } from "@/db/schema";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { CameraOff, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SaunaOption = {
  id: number;
  name: string | null;
  imageUrl: string | null;
  visibility: "public" | "unlisted";
  ownedByCurrentUser: boolean;
  ownedByFriend: boolean;
};

type Props = {
  preselectedSaunaId?: number;
  saunas: SaunaOption[];
};

export default function NewSaunaExperienceClient({
  preselectedSaunaId,
  saunas,
}: Props) {
  const router = useRouter();

  const [selectedSaunaId, setSelectedSaunaId] = useState<
    number | null
  >(preselectedSaunaId ?? null);

  const selectedSauna = useMemo(
    () => saunas.find(s => s.id === selectedSaunaId) ?? null,
    [saunas, selectedSaunaId]
  );

  const yourSaunas = saunas.filter(s => s.ownedByCurrentUser);
  const friendsSaunas = saunas.filter(
    s => !s.ownedByCurrentUser && s.ownedByFriend
  );
  const publicSaunas = saunas.filter(
    s =>
      !s.ownedByCurrentUser &&
      !s.ownedByFriend &&
      s.visibility === "public"
  );

  // If we already know the sauna (sauna_id in URL), skip selection UI
  const shouldShowPicker = !selectedSauna;

  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted">(
    "unlisted"
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function submitExperience() {
    if (!selectedSaunaId) return;

    setIsPosting(true);
    setServerError(null);

    const payload = {
      saunaId: selectedSaunaId,
      rating,
      content,
      imageUrl,
      visibility,
    } satisfies Omit<InsertExperience, "authorId"> & {
      imageUrl: string | null;
    };

    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to create experience");
      }

      const json = await res.json();

      router.push(`/saunas/${json.saunaId}`);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className='flex flex-col gap-y-6'>
      <div className='flex w-full flex-col items-center justify-center'>
        <h1 className='font-semibold text-2xl'>
          New sauna experience
        </h1>
        <span className='text-sm text-muted-foreground'>
          Share your latest heat session with friends.
        </span>
      </div>

      {shouldShowPicker ? (
        <Card className='p-4'>
          <h2 className='mb-2 text-sm font-medium'>
            Choose a sauna to log an experience
          </h2>
          <Command className='rounded-lg border'>
            <CommandInput placeholder='Search saunas...' />
            <CommandList>
              <CommandEmpty>No saunas found.</CommandEmpty>

              {yourSaunas.length > 0 && (
                <CommandGroup heading='Your saunas'>
                  {yourSaunas.map(s => (
                    <CommandItem
                      key={s.id}
                      onSelect={() => setSelectedSaunaId(s.id)}>
                      {s.name ?? "Unnamed sauna"}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {friendsSaunas.length > 0 && (
                <CommandGroup heading="Friends' saunas">
                  {friendsSaunas.map(s => (
                    <CommandItem
                      key={s.id}
                      onSelect={() => setSelectedSaunaId(s.id)}>
                      {s.name ?? "Unnamed sauna"}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {publicSaunas.length > 0 && (
                <CommandGroup heading='Public saunas'>
                  {publicSaunas.map(s => (
                    <CommandItem
                      key={s.id}
                      onSelect={() => setSelectedSaunaId(s.id)}>
                      {s.name ?? "Unnamed sauna"}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>

          <Link
            href='/profile/saunas/add'
            className={buttonVariants({
              variant: "outline",
              className: "w-full my-2",
            })}>
            Don&apos;t see your sauna? Add it
          </Link>
        </Card>
      ) : null}

      {/* EXPERIENCE FORM */}
      {selectedSauna && (
        <Card className='p-4 space-y-4'>
          <div className='flex flex-col items-center gap-3'>
            {selectedSauna.imageUrl ? (
              <Image
                src={selectedSauna.imageUrl}
                alt={selectedSauna.name ?? "Sauna"}
                width={1920}
                height={1920}
                className='rounded-lg object-cover'
              />
            ) : (
              <div className='rounded-lg w-full aspect-video flex flex-row items-center justify-center gap-x-2'>
                <CameraOff />
                No photo for {selectedSauna.name}{" "}
              </div>
            )}
            <div className='flex flex-col justify-center items-center'>
              <span className='text-sm text-muted-foreground text-center'>
                Logging experience for
              </span>
              <h2 className='text-lg font-semibold text-center'>
                {selectedSauna.name ?? "Unnamed sauna"}
              </h2>
            </div>
            {!preselectedSaunaId && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSelectedSaunaId(null)}>
                Change sauna
              </Button>
            )}
          </div>

          <div className='flex flex-col gap-y-2'>
            <Label className='text-sm font-medium'>Add a photo</Label>

            {!imageUrl && (
              <UploadButton
                endpoint='experienceImage'
                onClientUploadComplete={res => {
                  if (!res?.[0]) return;
                  setImageUrl(res[0].ufsUrl);
                }}
                onUploadError={err => {
                  console.error("UploadThing Error:", err);
                  toast.error("Image upload failed");
                }}
              />
            )}

            {imageUrl && (
              <Card className='p-2 w-full max-w-sm rounded-xl overflow-hidden relative'>
                <img
                  src={imageUrl}
                  alt='experience preview'
                  className='rounded-lg w-full h-48 object-cover'
                />
                <Button
                  type='button'
                  variant='ghost'
                  className='mt-2 text-red-500'
                  onClick={() => setImageUrl(null)}>
                  Remove image
                </Button>
              </Card>
            )}
          </div>

          {/* --- EXPERIENCE RATING ---- */}
          <div className='flex flex-col gap-y-2'>
            <Label className='text-sm font-medium'>Rating</Label>
            <div className='flex flex-row items-center'>
              {new Array(5).fill(null).map((_, i) => (
                <Star
                  key={`star-rating-${i}`}
                  onClick={() => setRating(i + 1)}
                  className={cn("w-6 h-6 stroke-0 fill-neutral-400", {
                    "fill-yellow-500": rating > i,
                  })}
                />
              ))}
            </div>
          </div>

          {/* VISIBILITY */}
          <div className='flex flex-col gap-y-2'>
            <Label>Visibility</Label>
            <div className='flex items-center justify-between p-3 border rounded-xl bg-bg-surface'>
              <span className='text-sm'>
                Public (visible to everyone)
              </span>

              <Switch
                checked={visibility === "public"}
                onCheckedChange={checked => {
                  setVisibility(
                    checked && selectedSauna.visibility === "public"
                      ? "public"
                      : "unlisted"
                  );

                  if (
                    checked &&
                    selectedSauna.visibility !== "public"
                  ) {
                    toast(
                      "This sauna is not public so you cannot leave a public review"
                    );
                  }
                }}
              />
            </div>
          </div>

          {/* --- EXPERIENCE TEXT ---- */}
          <div className='flex flex-col gap-y-2'>
            <Label className='text-sm font-medium'>
              Experience text
            </Label>
            <Textarea
              placeholder='Describe your sauna experience...'
              value={content}
              onChange={e => setContent(e.target.value)}
              className='min-h-[120px]'
            />
          </div>

          {/* --- SUBMIT BUTTON ---- */}
          <div className='flex flex-col gap-y-2 pt-4 border-t'>
            {serverError && (
              <p className='text-red-500 text-sm'>{serverError}</p>
            )}

            <Button onClick={submitExperience} disabled={isPosting}>
              {isPosting ? "Posting..." : "Post experience"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
