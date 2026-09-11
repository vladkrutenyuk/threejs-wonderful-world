import "./styles/reset.css";
import "./styles/main.css";
import TWEEN from "@tweenjs/tween.js";
import van from "vanjs-core";
import { Map } from "./modules/Map";
import { MapCursor } from "./modules/MapCursor";
import { World } from "./modules/World";
import { Footer } from "./ui/Footer";
import { Header } from "./ui/Header";
import { MobileBlocker } from "./ui/MobileBlocker";
import { Tooltip } from "./ui/Tooltip";

function init() {
	van.add(document.body, Header(), Footer(), Tooltip(), MobileBlocker());

	const world = new World();
	const map = new Map(world.scene);
	const mapCursor = new MapCursor(world.scene, world.camera, map);

	map.initMarkersAsync().then(() => console.log("Markers initing was finished!"));

	const mainUpdate = () => {
		TWEEN.update();
		mapCursor.update();
		map.update();
		world.update();
	};

	// WebGPURenderer initializes asynchronously, the loop starts once it's ready
	world.renderer.setAnimationLoop(mainUpdate);
}

init();
