"use client";

import { useCallback, useState } from "react";
import Map, {
  MapMouseEvent,
  Marker,
  MarkerDragEvent,
} from "react-map-gl/mapbox";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;

type MapPickerProps = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [viewState, setViewState] = useState({
    latitude: lat ?? 60.1699, // Helsinki default :)
    longitude: lng ?? 24.9384,
    zoom: 5,
  });

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      onChange(lat, lng);
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        zoom: Math.max(prev.zoom, 8),
      }));
    },
    [onChange]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className='text-xs text-red-500'>
        Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
      </div>
    );
  }

  const handleMarkerDragEnd = useCallback(
    (e: MarkerDragEvent) => {
      const { lng, lat } = e.lngLat;
      onChange(lat, lng);
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    },
    [onChange]
  );

  return (
    <div className='w-full overflow-hidden rounded-xl border'>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAPBOX_STYLE}
        style={{ width: "100%", height: 320 }}
        {...viewState}
        onMove={(evt: {
          viewState: {
            latitude: number;
            longitude: number;
            zoom: number;
          };
        }) => setViewState(evt.viewState)}
        onClick={handleMapClick}>
        {lat != null && lng != null && (
          <Marker
            longitude={lng}
            latitude={lat}
            anchor='center'
            draggable
            onDragEnd={handleMarkerDragEnd}>
            <div className='h-6 w-6 -translate-y-2 rounded-full bg-accent border-2 border-white shadow' />
          </Marker>
        )}
      </Map>
    </div>
  );
}
