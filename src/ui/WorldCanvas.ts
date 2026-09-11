import van from "vanjs-core";
import { $world } from "../stores";

const { div } = van.tags;

export const WorldCanvas = () => {
	const container = div({ class: "canvas" });
	// the world is set once the container is in the DOM (three-start sizes the canvas from it)
	$world.subscribe((world) => world?.mount(container));
	return container;
};
