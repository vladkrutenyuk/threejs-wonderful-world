import van from "vanjs-core";
import { getMarkerData } from "../constants/markers";
import { $hoveredMarker, $selectedMarkerId } from "../stores";
import { scramble, stopScramble } from "./scramble";

const { div } = van.tags;

const OFFSET_X = 30;
const OFFSET_Y = -45;

const MARGIN_X = 150;
const MARGIN_Y = 30;

const DURATION = 500;
const DELAY_MS = 600;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const Tooltip = () => {
	const text = van.state("");
	const visible = van.state(false);
	const position = van.state({ x: 0, y: 0 });

	$hoveredMarker.listen((hovered) => {
		const marker = getMarkerData(hovered?.id ?? null);
		if (!hovered || !marker) {
			stopScramble(text);
			text.val = "";
			visible.val = false;
			return;
		}

		position.val = {
			x: clamp(hovered.x + OFFSET_X, MARGIN_X, window.innerWidth - MARGIN_X),
			y: clamp(hovered.y + OFFSET_Y, MARGIN_Y, window.innerHeight - MARGIN_Y),
		};
		const label = marker.id === $selectedMarkerId.get() ? "< back" : "> " + marker.title;
		scramble(text, label, DURATION, DELAY_MS, () => (visible.val = true));
	});

	return div(
		{
			class: "tooltip",
			hidden: () => !visible.val,
			style: () => `left: ${position.val.x}px; top: ${position.val.y}px;`,
		},
		text
	);
};
