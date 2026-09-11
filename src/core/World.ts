import * as THREE from "three/webgpu";
import { addComponent, ThreeStart } from "three-start";
import { LegacyPointLight, registerLegacyLights } from "../helpers/legacy-lights";
import { Map } from "./components/Map";
import { Stars } from "./components/Stars";
import { CameraController } from "./modules/CameraController";
import { Tweens } from "./modules/Tweens";

// The scene was made with three r150: color management was off and the renderer output colors
// as they are (LinearEncoding). Since r152 both default to sRGB, which shifts every color and
// texture, so opt out to keep the r150 look. Must run before any THREE.Color is created.
THREE.ColorManagement.enabled = false;

export type WorldModules = {
	cameraController: CameraController;
	tweens: Tweens;
};

declare module "three-start" {
	interface ThreeStartRegister {
		modules: WorldModules;
	}
}

export class World extends ThreeStart {
	readonly map: Map;

	constructor() {
		const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: false });
		super({ renderer, camera: new THREE.PerspectiveCamera(55, 1, 0.1, 150) });

		renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
		registerLegacyLights(renderer);
		renderer.setPixelRatio(1.2);

		// r150 used LinearToneMapping, which with the default exposure only clamps colors to [0, 1],
		// as the 8-bit canvas does anyway. In WebGPURenderer any tone mapping renders the scene into
		// a half-float buffer first, where transparent layers blend unclamped, so keep it off.
		renderer.toneMapping = THREE.NoToneMapping;

		// Since r152 transparent objects are sorted by their bounding sphere center instead of the
		// object origin, which flips the draw order of the map and a wonder at some camera angles.
		// Keep r150's back-to-front sort by origin (ties by id).
		const origin = new THREE.Vector3();
		const projScreenMatrix = new THREE.Matrix4();
		const depth = (object: THREE.Object3D) =>
			origin.setFromMatrixPosition(object.matrixWorld).applyMatrix4(projScreenMatrix).z;
		renderer.setTransparentSort((a, b) => {
			if (a.groupOrder !== b.groupOrder) return a.groupOrder! - b.groupOrder!;
			if (a.renderOrder !== b.renderOrder) return a.renderOrder! - b.renderOrder!;
			const { camera } = this.ctx;
			projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
			const za = depth(a.object!);
			const zb = depth(b.object!);
			return za !== zb ? zb - za : a.id! - b.id!;
		});

		// The default render goes through a render pipeline, which also draws the scene into a
		// half-float buffer (see the tone mapping above), so render straight to the canvas instead.
		this.ctx.overrideRender(() => renderer.initialized && renderer.render(this.ctx.scene, this.ctx.camera));

		this.addModules({
			cameraController: new CameraController(),
			tweens: new Tweens(),
		});

		const scene = this.ctx.scene;
		scene.background = new THREE.Color(0x101010);

		const light = new LegacyPointLight(0xffffff, 1.5);
		light.position.set(0, 5, 10);
		scene.add(light);

		const mapObject = new THREE.Group();
		this.map = addComponent(mapObject, Map);
		scene.add(mapObject);

		const starsObject = new THREE.Group();
		addComponent(starsObject, Stars);
		scene.add(starsObject);

		this.start();
	}
}
