import { ContextModule } from "three-start";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class CameraController extends ContextModule {
	public get orbitControls() {
		const oc = this._orbitControls;
		if (!oc) {
			throw new Error("trying access orbit controls before its initialization");
		}
		return oc;
	}
	private _orbitControls?: OrbitControls;

	onAwake() {
		const { camera, renderer } = this.ctx;

		const orbitControls = new OrbitControls(camera, renderer.domElement);
		orbitControls.maxDistance = 1.5;
		orbitControls.minDistance = 1;
		orbitControls.minAzimuthAngle = -Math.PI / 4;
		orbitControls.maxAzimuthAngle = Math.PI / 4;

		orbitControls.minPolarAngle = -Math.PI / 3 + Math.PI / 2;
		orbitControls.maxPolarAngle = Math.PI / 3 + Math.PI / 2;

		orbitControls.enablePan = false;

		camera.position.set(0.01224, -0.70044, 1.07851);
		camera.rotation.set(0.57599, 0.00951, -0.00618);
		orbitControls.update();
		this._orbitControls = orbitControls;
	}
}
