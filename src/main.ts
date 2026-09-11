import TWEEN from "@tweenjs/tween.js";
import { Map } from "./modules/Map";
import { MapCursor } from "./modules/MapCursor";
import Tooltip from "./modules/Tooltip";
import { World } from "./modules/World";
// import * as THREE from 'three'

function init() {

	const tooltip = new Tooltip();
	tooltip.setElement(document.getElementById("tooltip")!);
	const world = new World();
	const map = new Map(world.scene);
	const mapCursor = new MapCursor(world.scene, world.camera, map);

	map.initMarkersAsync(tooltip).then(() => console.log("Markers initing was finished!"));

	const mainUpdate = () => {
		tooltip.update();
		TWEEN.update();
		mapCursor.update();
		map.update();
		world.update();
	};

	// WebGPURenderer initializes asynchronously, the loop starts once it's ready
	world.renderer.setAnimationLoop(mainUpdate);

	//! for behance
	// world.scene.background = new THREE.Color(0x000000)
	// world.light.visible = false
	// map.stars.visible = false
	// map.mesh.visible = false
	// mapCursor.cursorGroup.visible = false
	// mapCursor.pointLight.visible = false
	// mapCursor.lines.forEach(line => line.visible = false)
	// map.markers.forEach(m => {
	// 	m.visualGroup.children.forEach(c => c.visible = false)
	// 	m.visualGroup.add(new THREE.AxesHelper(0.03))
	// })
	// document.querySelectorAll('.ui').forEach(ui => (ui as HTMLElement).style.display = 'none')
}

init();

//! for behance
// import './modules/ForBehance/sandbox'
