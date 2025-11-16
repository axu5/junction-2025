"use client";

import { MapPicker } from "@/components/map-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InsertSauna } from "@/db/schema";
import { UploadButton } from "@/lib/uploadthing";
import { ChevronLeft, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AddSaunaForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "unlisted">(
    "unlisted"
  );
  const [isCreating, setIsCreating] = useState(false);

  const [lat, setLat] = useState<number>(60.1699);
  const [lng, setLng] = useState<number>(24.9384);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(
    null
  );

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsGettingLocation(false);
      },
      err => {
        setLocationError(
          err.message || "Unable to retrieve your location."
        );
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newSauna = {
      name: formData.get("sauna-name") as string,
      imageUrl: imageUrl,
      visibility: visibility,
      latitude: Number(formData.get("lat")),
      longitude: Number(formData.get("lng")),
    } satisfies InsertSauna;

    console.log("Submitting sauna:", newSauna);

    const res = await fetch("/api/saunas", {
      method: "POST",
      body: JSON.stringify(newSauna),
    });

    if (!res.ok) {
      toast.error("Something went wrong, try again later");
      setIsCreating(false);
      return;
    }

    const { saunaId } = await res.json();
    setIsCreating(false);

    redirect(`/saunas/${saunaId}`);
  };

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-row items-center justify-between gap-y-2'>
        <Link
          href='/profile/saunas'
          className='flex flex-row items-center gap-x-2'>
          <ChevronLeft />
        </Link>
        <h1 className='font-semibold text-2xl'>Add Sauna</h1>
        <div />
      </div>

      <form className='flex flex-col gap-y-6' onSubmit={handleSubmit}>
        {/* SAUNA NAME */}
        <div className='flex flex-col gap-y-2'>
          <Label htmlFor='sauna-name'>Sauna name *</Label>
          <Input
            name='sauna-name'
            className='bg-accent text-sm'
            placeholder='My awesome sauna'
            required
            maxLength={50}
          />
        </div>

        {/* UPLOAD IMAGE */}
        <div className='flex flex-col gap-y-2'>
          <Label>Add an image</Label>

          {!imageUrl && (
            <div className='bg-accent rounded-md shadow-sm py-3 px-2'>
              <UploadButton
                endpoint='saunaImage'
                appearance={{
                  button: {
                    color: "var(--color-accent-foreground)",
                  },
                }}
                onClientUploadComplete={res => {
                  if (!res?.[0]) return;
                  setImageUrl(res[0].url);
                }}
                onUploadError={err => {
                  console.error("UploadThing Error:", err);
                }}
              />
            </div>
          )}

          {imageUrl && (
            <Card className='p-2 w-full max-w-sm mx-auto rounded-xl overflow-hidden relative'>
              <img
                src={imageUrl}
                alt='sauna preview'
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

        {/* VISIBILITY */}
        <div className='flex flex-col gap-y-2'>
          <Label>Visibility</Label>
          <div className='flex items-center justify-between p-3 border rounded-xl bg-bg-surface bg-accent'>
            <span className='text-sm'>
              {visibility === "public"
                ? "Public (visible to everyone)"
                : "Unlisted (visible to friends)"}
            </span>

            <Switch
              checked={visibility === "public"}
              onCheckedChange={checked =>
                setVisibility(checked ? "public" : "unlisted")
              }
            />
          </div>
        </div>

        {/* LOCATION */}
        <div className='flex flex-col gap-y-2'>
          <Label>Location *</Label>

          {/* MAP PICKER */}
          <div className='mt-4'>
            <p className='text-xs text-muted-foreground mb-1'>
              Or tap on the map to set the sauna location.
            </p>
            <MapPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>
        </div>

        <Button
          type='button'
          variant='outline'
          onClick={getLocation}
          disabled={isGettingLocation}
          className='mt-2 bg-accent'>
          {isGettingLocation
            ? "Getting location..."
            : "Use current location"}
        </Button>

        {locationError && (
          <p className='text-sm text-red-500'>{locationError}</p>
        )}

        {/* SUBMIT */}
        <Button
          type='submit'
          disabled={isCreating}
          className='
            bg-accent
            hover:bg-accent-soft
            text-text
            rounded-xl py-2.5
            shadow-sm
          '>
          <Plus className='w-4 h-4' /> Add Sauna
        </Button>
      </form>
    </div>
  );
}
