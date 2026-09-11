import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LegacyPointLight, registerLegacyLights } from "../helpers/legacy-lights";

// The scene was made with three r150: color management was off and the renderer output colors
// as they are (LinearEncoding). Since r152 both default to sRGB, which shifts every color and
// texture, so opt out to keep the r150 look. Must run before any THREE.Color is created.
THREE.ColorManagement.enabled = false;

export class World {
	private readonly _canvasRootElement: HTMLElement;
	private readonly _resizeObserver: ResizeObserver;
	readonly renderer: THREE.WebGPURenderer;
	readonly scene: THREE.Scene;
	readonly camera: THREE.PerspectiveCamera;
	readonly light: THREE.PointLight;

	controls: OrbitControls;

	constructor() {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x101010);

		this.camera = new THREE.PerspectiveCamera(
			55,
			window.innerWidth / window.innerHeight,
			0.1,
			150
		);

		this.renderer = new THREE.WebGPURenderer({ antialias: true, alpha: false });
		this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
		registerLegacyLights(this.renderer);
		this.renderer.setPixelRatio(1.2);
		// this.renderer.setPixelRatio(0.7)
		this._canvasRootElement = document.getElementById(
			"three-canvas-root"
		) as HTMLElement;
		if (!this._canvasRootElement) {
			throw 'Canvas roor element was not found (id="three-canvas-root")';
		}
		this._canvasRootElement.append(this.renderer.domElement);
		let timeout: number;
		this._resizeObserver = new ResizeObserver(() => {
			clearInterval(timeout);
			timeout = setTimeout(() => this.resize(), 30);
		});
		this._resizeObserver.observe(this._canvasRootElement);
		this.resize();

		this.light = new LegacyPointLight(0xffffff, 1.5);
		this.light.position.set(0, 5, 10);
		this.scene.add(this.light);

		// r150 used LinearToneMapping, which with the default exposure only clamps colors to [0, 1],
		// as the 8-bit canvas does anyway. In WebGPURenderer any tone mapping renders the scene into
		// a half-float buffer first, where transparent layers blend unclamped, so keep it off.
		this.renderer.toneMapping = THREE.NoToneMapping;

		// Since r152 transparent objects are sorted by their bounding sphere center instead of the
		// object origin, which flips the draw order of the map and a wonder at some camera angles.
		// Keep r150's back-to-front sort by origin (ties by id).
		const origin = new THREE.Vector3();
		const projScreenMatrix = new THREE.Matrix4();
		const depth = (object: THREE.Object3D) =>
			origin.setFromMatrixPosition(object.matrixWorld).applyMatrix4(projScreenMatrix).z;
		this.renderer.setTransparentSort((a, b) => {
			if (a.groupOrder !== b.groupOrder) return a.groupOrder! - b.groupOrder!;
			if (a.renderOrder !== b.renderOrder) return a.renderOrder! - b.renderOrder!;
			projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
			const za = depth(a.object!);
			const zb = depth(b.object!);
			return za !== zb ? zb - za : a.id! - b.id!;
		});

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.maxDistance = 1.5;
		this.controls.minDistance = 1;
		this.controls.minAzimuthAngle = -Math.PI / 4;
		this.controls.maxAzimuthAngle = Math.PI / 4;

		this.controls.minPolarAngle = -Math.PI / 3 + Math.PI / 2;
		this.controls.maxPolarAngle = Math.PI / 3 + Math.PI / 2;

		this.controls.enablePan = false;

		this.camera.position.set(0.01224, -0.70044, 1.07851);
		this.camera.rotation.set(0.57599, 0.00951, -0.00618);
		this.controls.update();
	}

	public update() {
		this.renderer.render(this.scene, this.camera);
	}

	private resize() {
		this.camera.aspect =
			this._canvasRootElement.offsetWidth / this._canvasRootElement.offsetHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(
			this._canvasRootElement.offsetWidth,
			this._canvasRootElement.offsetHeight
		);
	}
}
