import { atom } from "nanostores";
import type { MarkerData } from "./constants/markers";

// Id of the wonder the map is zoomed into, null while the whole map is shown
export const $selectedMarkerId = atom<MarkerData["id"] | null>(null);

// The marker under the pointer, with the pointer position where it was entered
export const $hoveredMarker = atom<{ id: MarkerData["id"]; x: number; y: number } | null>(null);
