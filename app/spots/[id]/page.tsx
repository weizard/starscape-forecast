import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import { spots, spotById } from "@/lib/spots";
import { fetchDailyWeather, townshipOf } from "@/lib/weather";
import SpotDetail from "@/components/SpotDetail";

export function generateStaticParams() {
  return spots.map((s) => ({ id: s.id }));
}

export default async function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = spotById(id);
  if (!spot) notFound();
  // CWA 近 3 天夜間天氣（未設 CWA_API_KEY 時回空，頁面照常）
  const weather = await fetchDailyWeather(townshipOf(spot.region));
  return (
    <div className="space-y-6">
      <BackLink />
      <SpotDetail spot={spot} weather={weather} />
    </div>
  );
}
