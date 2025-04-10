import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class World {
	private readonly _canvasRootElement: HTMLElement;
	private readonly _resizeObserver: ResizeObserver;
	readonly renderer: THREE.WebGLRenderer;
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

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
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

		this.light = new THREE.PointLight(0xffffff, 1.5);
		this.light.position.set(0, 5, 10);
		this.scene.add(this.light);

		this.renderer.toneMapping = THREE.LinearToneMapping;

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
