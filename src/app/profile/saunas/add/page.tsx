"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InsertSauna } from "@/db/schema";
import { UploadButton } from "@/lib/uploadthing";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AddSaunaForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "unlisted">(
    "unlisted"
  );

  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

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
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
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
      return;
    }

    const { saunaId } = await res.json();

    redirect(`/saunas/${saunaId}`);
  };

  return (
    <div className='flex flex-col gap-y-5'>
      <div className='flex w-full flex-col items-center justify-center'>
        <h1 className='font-semibold text-2xl'>Add a sauna</h1>
        <span className='text-sm'>
          Fields marked with * are required
        </span>
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
            <UploadButton
              endpoint='saunaImage'
              onClientUploadComplete={res => {
                if (!res?.[0]) return;
                setImageUrl(res[0].url);
              }}
              onUploadError={err => {
                console.error("UploadThing Error:", err);
              }}
            />
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
          <div className='flex items-center justify-between p-3 border rounded-xl bg-bg-surface'>
            <span className='text-sm'>
              Public (visible to everyone)
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

          <div className='flex gap-3'>
            <Input
              name='lat'
              type='number'
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder='Latitude'
              required
            />

            <Input
              name='lng'
              type='number'
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder='Longitude'
              required
            />
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={getLocation}
            disabled={isGettingLocation}
            className='mt-2'>
            {isGettingLocation
              ? "Getting location..."
              : "Use current location"}
          </Button>

          {locationError && (
            <p className='text-sm text-red-500'>{locationError}</p>
          )}
        </div>

        {/* SUBMIT */}
        <Button
          type='submit'
          className='
            bg-accent
            hover:bg-accent-soft
            text-text
            rounded-xl py-2.5
            shadow-sm
          '>
          Add sauna
        </Button>
      </form>
    </div>
  );
}
