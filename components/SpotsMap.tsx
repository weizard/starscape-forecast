"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/lib/types";
import type { BaseLocation } from "@/lib/base";

const bortleFill = (b: number) =>
  b <= 2 ? "#818cf8" : b === 3 ? "#38bdf8" : b === 4 ? "#fbbf24" : "#fb923c";

export default function SpotsMap({ spots, base }: { spots: Spot[]; base?: BaseLocation | null }) {
  const router = useRouter();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <MapContainer
        center={[23.9, 121.0]}
        zoom={7}
        style={{ height: 420, width: "100%", background: "#0f172a" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {base && (
          <CircleMarker
            center={[base.lat, base.lng]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#ef4444", fillOpacity: 0.9 }}
          >
            <Tooltip permanent direction="top">📍 {base.name}</Tooltip>
          </CircleMarker>
        )}
        {spots.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={7}
            pathOptions={{ color: "#0f172a", weight: 1.5, fillColor: bortleFill(s.bortle), fillOpacity: 0.95 }}
            eventHandlers={{ click: () => router.push(`/spots/${s.id}`) }}
          >
            <Tooltip>{s.name}（Bortle {s.bortle}）</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
