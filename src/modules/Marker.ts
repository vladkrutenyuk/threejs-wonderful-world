import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MarkerData } from "../constants/markers";
import Header, { HeaderStyle } from "./Header";
import { Map } from "./Map";
import Tooltip from "./Tooltip";

export class Marker {
	public static readonly additionalOffsetZ = 0.07;
	public static readonly multiplierScaleZ = 1.5;
	public static readonly octahedronRadius = 0.025;

	public get data(): MarkerData {
		return this._data;
	}
	private readonly _data: MarkerData;

	public get markerMesh(): THREE.Mesh {
		return this._markerMesh;
	}
	private readonly _markerMesh: THREE.Mesh;
	private readonly _wireframeMesh: THREE.Mesh;
	private readonly _shapeMesh: THREE.Mesh;
	private readonly _ringMesh: THREE.Mesh;

	public get visualGroup(): THREE.Group {
		return this._visualGroup;
	}
	private _visualGroup: THREE.Group = new THREE.Group();

	public get isSelected(): boolean {
		return this._isSelected;
	}
	private _isSelected: boolean = false;

	private _contentMesh!: THREE.Mesh;
	private _contentMaterial: THREE.ShaderMaterial;
	private tooltip: Tooltip;

	private _uniforms = {
		matcap: { value: new THREE.TextureLoader().load("/img/matcap_1.png") },
		gridColor: { value: new THREE.Color(0xffffff) },
		gridThickness: { value: 0.05 },
		gridDensity: { value: 25.0 },
		transition: { value: 0.0 },
		scale: { value: 1.0 },
	};

	constructor(data: MarkerData, tooltip: Tooltip) {
		this.tooltip = tooltip;
		this._data = data;

		const thickness = 0.0035;
		const radius = 0.01;
		this._ringMesh = new THREE.Mesh(
			new THREE.RingGeometry(radius, radius + thickness, 16),
			new THREE.MeshBasicMaterial({ color: 0xffffff })
		);

		this._markerMesh = new THREE.Mesh(
			new THREE.OctahedronGeometry(0.05 + Marker.octahedronRadius),
			new THREE.MeshBasicMaterial({ visible: false })
		);
		this._markerMesh.scale.setComponent(2, Marker.multiplierScaleZ);
		this._markerMesh.userData.marker = this;

		this._wireframeMesh = new THREE.Mesh(
			new THREE.OctahedronGeometry(Marker.octahedronRadius),
			new THREE.MeshBasicMaterial({ wireframe: true })
		);

		this._shapeMesh = new THREE.Mesh(
			new THREE.OctahedronGeometry(0.01 + Marker.octahedronRadius),
			new THREE.MeshBasicMaterial({
				wireframe: false,
				color: 0x000000,
				side: THREE.BackSide,
			})
		);

		this._contentMaterial = new THREE.ShaderMaterial({
			vertexShader: String(vertex),
			fragmentShader: String(frag),
			uniforms: this._uniforms,
			transparent: true,
			depthTest: true,
		});
	}

	public spawnOnMap = (
		scene: THREE.Scene,
		mapWidth: number,
		mapHeight: number,
		displacementScale: number,
		displacementBias: number
	): void => {
		this._markerMesh.position.copy(
			new THREE.Vector3(
				mapWidth * (this._data.mapNormalizedPosition.x - 0.5),
				mapHeight * (this._data.mapNormalizedPosition.y - 0.5),
				this._data.mapNormalizedPosition.z * displacementScale +
					displacementBias +
					Marker.additionalOffsetZ
			)
		);
		scene.add(this._markerMesh);
		scene.add(this._visualGroup);
		scene.add(this._wireframeMesh);
		scene.add(this._ringMesh);
		this._ringMesh.position.setZ(-Marker.octahedronRadius - 0.01);

		this._visualGroup.add(this._shapeMesh, this._wireframeMesh, this._ringMesh);
		this._visualGroup.parent = this._markerMesh;

		this.loadModel(scene);
	};

	private loadModel = (scene: THREE.Scene) => {
		this._uniforms.scale.value = this._data.contentScale;

		const loader = new GLTFLoader();
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath("/draco/");
		dracoLoader.preload();
		loader.setDRACOLoader(dracoLoader);

		loader.load(
			this._data.contentUrl,
			(gltf) => {
				gltf.scene.traverse((child) => {
					if ((child as THREE.Mesh).isMesh) {
						this._contentMesh = child as THREE.Mesh;
						this._contentMesh.material = this._contentMaterial;
						this._contentMesh.scale.setScalar(this.data.contentScale);

						scene.add(this._contentMesh);

						this._contentMesh.visible = false;
					}
				});
			},
			(xhr) => {
				console.log(
					"Loading... " +
						((xhr.loaded / xhr.total) * 100).toPrecision(3) +
						"% of " +
						this.data.title
				);
			},
			(error) => {
				console.log(`Error while loading ${this.data.title}`, { error });
				console.log(error);
			}
		);
	};

	public setMouseOveringStyle = (
		isEntering: boolean,
		mouseScreenPosition: THREE.Vector2
	): void => {
		new TWEEN.Tween(this._visualGroup.scale)
			.to(new THREE.Vector3().setScalar(isEntering ? 1.3 : 1), 250)
			.start();

		if (isEntering) {
			this.tooltip.set({
				text: this._isSelected ? "< back" : "> " + this._data.title,
				x: mouseScreenPosition.x,
				y: mouseScreenPosition.y,
			});
		} else {
			this.tooltip.reset();
		}
	};

	public setSelection = (isSelected: boolean): void => {
		this._isSelected = isSelected;

		new TWEEN.Tween(this._markerMesh.rotation)
			.to(
				{
					z: isSelected ? (6 * -Math.PI) / 2 : 0,
					y: isSelected ? -Math.PI / 2 : 0,
				},
				2000
			)
			.easing(TWEEN.Easing.Exponential.In)
			.start()
			.onUpdate(() => {});

		if (this._isSelected) {
			this.showContent();
		} else {
			this.hideContent();
		}
	};

	private showContent = () => {
		Header.setTitleStyle(HeaderStyle.SubtitleForWonder);
		Header.setWonderTitle(this.data.title, this.data.url);

		const duration = 2500;
		this._uniforms.transition.value = 0;
		new TWEEN.Tween(this._uniforms)
			.to({ transition: { value: 1 } }, duration)
			.delay(Map.zoomDuration)
			.start()
			.easing(TWEEN.Easing.Quadratic.In)
			.onStart(() => {
				this._contentMesh.visible = this._isSelected;
				this.blinkMarkerShape(duration);
				this.pulseMarkerWireframe(duration);
			});
	};

	private hideContent = () => {
		Header.setTitleStyle(HeaderStyle.AloneHeader);
		Header.resetWonderTitle();

		const duration = 600;
		new TWEEN.Tween(this._uniforms)
			.to({ transition: { value: 0 } }, duration)
			.start()
			.easing(TWEEN.Easing.Quadratic.In)
			.onStart(() => {
				this.blinkMarkerShape(duration);
				this.pulseMarkerWireframe(duration);
			})
			.onComplete(() => {
				this._contentMesh.visible = this._isSelected;
			});
	};

	private blinkMarkerShape = (duration: number): void => {
		const shapeMaterial = <THREE.MeshBasicMaterial>this._shapeMesh.material;
		const tempColor = { hex: shapeMaterial.color.getHex() };

		const goTo = new TWEEN.Tween(tempColor)
			.to({ hex: new THREE.Color(0xffffff).getHex() }, duration / 2)
			.start()
			.onUpdate(() => {
				shapeMaterial.color.setHex(tempColor.hex);
			});

		const goBack = new TWEEN.Tween(tempColor)
			.to({ hex: new THREE.Color(0x000000).getHex() }, duration / 2)
			.onUpdate(() => {
				shapeMaterial.color.setHex(tempColor.hex);
			});

		goTo.start().onComplete(() => goBack.start());
	};

	private pulseMarkerWireframe = (duration: number) => {
		const first = new TWEEN.Tween(this._wireframeMesh)
			.to({ scale: new THREE.Vector3().setScalar(0.5) }, duration * 0.8)
			.easing(TWEEN.Easing.Quartic.Out);

		const second = new TWEEN.Tween(this._wireframeMesh)
			.to({ scale: new THREE.Vector3().setScalar(1) }, duration * 0.2)
			.easing(TWEEN.Easing.Quartic.Out);

		first.start().onComplete(() => second.start());
	};
}

const vertex = /*glsl*/ `
	uniform float transition;
	uniform float scale;

	varying vec3 vViewPosition;
	varying vec3 vWorldPosition;

	float map(float value, float min1, float max1, float min2, float max2) {
		return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
	}

	void main() {
		vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

		float mixPos = step(transition, vWorldPosition.z / scale);
		vec4 newWorldPos = vec4(mix(vWorldPosition, vec3(0, -0.45, 0), mixPos), 1.0); 

		vec4 mvPosition = viewMatrix * newWorldPos;

		vViewPosition = -mvPosition.xyz;
		gl_Position = projectionMatrix * mvPosition;
	}
`;

const frag = /*glsl*/ `
	uniform sampler2D matcap;

	uniform vec3 gridColor;
	uniform float gridThickness;
	uniform float gridDensity;

	uniform float transition;
	uniform float scale;

	varying vec3 vViewPosition;
	varying vec3 vWorldPosition;

	void main() {
		vec3 fdx = vec3(dFdx(vViewPosition.x), dFdx(vViewPosition.y), dFdx(vViewPosition.z));
		vec3 fdy = vec3(dFdy(vViewPosition.x), dFdy(vViewPosition.y), dFdy(vViewPosition.z));
		vec3 normal = normalize(cross(fdx,fdy));

		vec3 viewDir = normalize(vViewPosition);
		vec3 x = normalize(vec3(viewDir.z, 0.0, - viewDir.x));
		vec3 y = cross(viewDir, x);
		vec2 uv = vec2(dot(x, normal), dot(y,normal)) * 0.495 + 0.5;
		vec4 matcapColor = texture2D(matcap, uv);

		float gridX = step(gridThickness, fract(vWorldPosition.x * gridDensity));
		float gridY = step(gridThickness, fract(vWorldPosition.y * gridDensity + transition));
		float gridZ = step(gridThickness, fract(vWorldPosition.z * gridDensity + transition));
		float grid = 1.0 - gridX * gridY * gridZ;

		float scan = step(transition, vWorldPosition.z / scale);
		vec4 scanColor = mix(vec4(grid), vec4(1.0), scan);
		vec4 resultCol = mix(scanColor, matcapColor, pow(transition, 10.0));
		resultCol.a *= 1.0 - pow(1.0 - transition, 10.0);
		
		gl_FragColor = resultCol;
	}
`;
