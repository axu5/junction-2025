"use client";

import * as React from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import Image from "next/image";
import { FriendSaunaPoint } from "@/lib/get-friends-sauna-map-points";
import { UserRound } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;

type Props = {
  points: FriendSaunaPoint[];
};

export function FriendsExperiencesMap({ points }: Props) {
  if (!MAPBOX_TOKEN) {
    return null;
  }

  if (!points.length) {
    return null;
  }

  // Simple center: first point, or default to Helsinki
  const defaultCenter = {
    latitude: points[0]?.latitude ?? 60.1699,
    longitude: points[0]?.longitude ?? 24.9384,
    zoom: 4.5,
  };

  const [viewState, setViewState] = React.useState(defaultCenter);

  return (
    <div className='w-full overflow-hidden rounded-xl border bg-bg-surface'>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAPBOX_STYLE}
        style={{ width: "100%", height: 260 }}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}>
        {points.map(p => (
          <Marker
            key={`${p.saunaId}-${p.authorId}`}
            longitude={p.longitude}
            latitude={p.latitude}
            anchor='center'>
            <div className='flex flex-col items-center gap-1'>
              <div className='h-9 w-9 rounded-full border-2 border-white shadow-md overflow-hidden bg-neutral-200'>
                {p.authorImage ? (
                  <Image
                    src={p.authorImage}
                    alt={p.authorName ?? "Friend"}
                    width={36}
                    height={36}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <UserRound className='w-5 h-5 text-neutral-500' />
                  </div>
                )}
              </div>
              {/* {p.saunaName && (
                <div className='px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-white'>
                  {p.saunaName}
                </div>
              )} */}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
