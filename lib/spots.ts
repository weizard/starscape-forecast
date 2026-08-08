import raw from "./spots-data.json";
import type { Spot } from "./types";

export const spots: Spot[] = (raw as { spots: Spot[] }).spots;

export const spotById = (id: string) => spots.find((s) => s.id === id);

