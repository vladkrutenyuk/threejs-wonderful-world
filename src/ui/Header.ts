import van from "vanjs-core";
import { getMarkerData } from "../constants/markers";
import { $selectedMarkerId } from "../stores";
import { scramble, stopScramble } from "./scramble";

const { header, div, a } = van.tags;

export const Header = () => {
	const marker = van.state(getMarkerData($selectedMarkerId.get()));
	const wonderTitle = van.state("");

	$selectedMarkerId.listen((id) => {
		marker.val = getMarkerData(id);
		wonderTitle.val = "";
		if (marker.val) scramble(wonderTitle, marker.val.title, 1000);
		else stopScramble(wonderTitle);
	});

	return header(
		{ class: "header" },
		div(
			{ class: () => (marker.val ? "title small" : "title big") },
			() => (marker.val ? "Wonder of the world" : "Wonders of the world")
		),
		a(
			{
				class: "wonder-title hover-glow",
				href: () => marker.val?.url ?? "",
				target: "_blank",
				hidden: () => !marker.val,
			},
			wonderTitle
		)
	);
};
