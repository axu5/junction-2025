"use client";

import Mapbox, { Marker } from "react-map-gl/mapbox";
import Image from "next/image";
import { FriendSaunaPoint } from "@/lib/get-friends-sauna-map-points";
import { UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { group } from "console";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;

type Props = {
  points: FriendSaunaPoint[];
};

type SaunaGroup = {
  saunaId: number;
  saunaName: string | null;
  latitude: number;
  longitude: number;
  users: {
    authorId: string | number;
    authorName: string | null;
    authorImage: string | null;
  }[];
};

export function FriendsExperiencesMap({ points }: Props) {
  const groups: SaunaGroup[] = useMemo(() => {
    const saunaMapping = new Map<string, SaunaGroup>();

    for (const p of points) {
      const key = `${p.saunaId}-${p.latitude.toFixed(
        6
      )}-${p.longitude.toFixed(6)}`;

      const existing = saunaMapping.get(key);
      if (!existing) {
        saunaMapping.set(key, {
          saunaId: p.saunaId,
          saunaName: p.saunaName,
          latitude: p.latitude,
          longitude: p.longitude,
          users: [
            {
              authorId: p.authorId,
              authorName: p.authorName,
              authorImage: p.authorImage,
            },
          ],
        });
      } else {
        // avoid duplicate same user+sauna somehow
        if (!existing.users.some(u => u.authorId === p.authorId)) {
          existing.users.push({
            authorId: p.authorId,
            authorName: p.authorName,
            authorImage: p.authorImage,
          });
        }
      }
    }

    return Array.from(saunaMapping.values());
  }, [points]);

  const first = groups[0];
  const [viewState, setViewState] = useState({
    latitude: first.latitude ?? 60.1699,
    longitude: first.longitude ?? 24.9384,
    zoom: 4.5,
  });

  if (!MAPBOX_TOKEN || points.length === 0 || groups.length === 0) {
    return null;
  }

  return (
    <div className='w-full overflow-hidden rounded-xl border bg-bg-surface'>
      <Mapbox
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAPBOX_STYLE}
        style={{ width: "100%", height: "60vh" }}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}>
        {groups.map(group => (
          <Marker
            key={group.saunaId}
            longitude={group.longitude}
            latitude={group.latitude}
            anchor='center'
            className='transition-all flex flex-col gap-y-0.5'>
            <MarkerContent group={group} />
            {group.saunaName && (
              <div
                className={cn(
                  "px-2 py-0.5 text-accent-foreground bg-white/60 bg-blend-soft-light transition-all rounded-md shadow-sm",
                  {
                    "text-transparent bg-transparent":
                      viewState.zoom < 10,
                    hidden: viewState.zoom < 9.95,
                  }
                )}>
                {group.saunaName}
              </div>
            )}
          </Marker>
        ))}
      </Mapbox>
    </div>
  );
}

function MarkerContent({ group }: { group: SaunaGroup }) {
  const users = group.users;
  const visibleUsers = users.slice(0, 3);
  const extraCount = users.length - visibleUsers.length;

  return (
    <div className='flex flex-col items-center gap-1 transition-all'>
      {/* stacked avatars */}
      <div className='flex items-center'>
        {visibleUsers.reverse().map((u, idx) => (
          <div
            key={u.authorId}
            className={cn(
              "h-9 w-9 rounded-full border-2 border-white shadow-md overflow-hidden bg-neutral-200",
              {
                "-ml-14": idx > 0,
              }
            )}>
            {u.authorImage ? (
              <Image
                src={u.authorImage}
                alt={u.authorName ?? "Friend"}
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
        ))}

        {extraCount > 0 && (
          <div className='-ml-3 h-9 w-9 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-black/70 text-[10px] text-white'>
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
}
