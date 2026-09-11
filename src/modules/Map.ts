import TWEEN, { Tween } from "@tweenjs/tween.js";
import * as THREE from "three/webgpu";
import {
	Fn,
	dot,
	float,
	floor,
	fract,
	instancedBufferAttribute,
	materialOpacity,
	materialReference,
	mix,
	normalLocal,
	positionLocal,
	sin,
	smoothstep,
	step,
	texture,
	uniform,
	uv,
	vec2,
	vec3,
} from "three/tsl";
import { MARKERS, type MarkerData } from "../constants/markers";
import { $selectedMarkerId } from "../stores";
import { Marker } from "./Marker";

export class Map {
	public readonly zoomScale = 10;
	public static readonly zoomBackDelay = 550;
	public static readonly zoomDuration = 2500;
	private readonly zoomCenterOffsetY = 0.025;

	readonly mesh: THREE.Mesh;
	readonly geometry: THREE.PlaneGeometry;

	public get width() {
		return this.geometry.parameters.width;
	}
	public get height() {
		return this.geometry.parameters.height;
	}
	private _material: THREE.MeshPhongNodeMaterial;

	private readonly _scene: THREE.Scene;

	private _markersGroup: THREE.Group = new THREE.Group();
	public get markersGroup() {
		return this._markersGroup;
	}

	private selectedMarker: THREE.Object3D | null = null;
	private timer = new THREE.Timer();
	private time = uniform(0);

	stars = new THREE.Group();
	markers: Marker[] = [];

	constructor(scene: THREE.Scene) {
		this._scene = scene;

		const textureLoader = new THREE.TextureLoader();
		const map = textureLoader.load("/img/world_color.jpg");
		const specularMap = textureLoader.load("/img/world_specular.jpg");
		const displacementMap = textureLoader.load("/img/world_height.jpg");

		// Since r151 every texture has its own uv transform, while in r150 the transform of `map`
		// was applied to all maps. The zoom tweens map.offset/repeat, so the specular and
		// displacement maps share the same vectors to keep following it.
		map.center.set(0.5, 0.5);
		for (const other of [specularMap, displacementMap]) {
			other.offset = map.offset;
			other.repeat = map.repeat;
			other.center = map.center;
		}

		this.geometry = new THREE.PlaneGeometry(3.6, 1.8, 140 * 1.3, 70 * 1.3);
		this._material = new THREE.MeshPhongNodeMaterial({
			map,
			specularMap,
			displacementBias: -0.25,
			displacementScale: 0.45,
			wireframe: true,
			transparent: true,
			opacity: 0.6,
			depthWrite: true,
			color: "white",
			// MeshPhongNodeMaterial copies its defaults from a MeshPhongMaterial that three creates when
			// the module loads, before color management is disabled, so the default specular (0x111111)
			// would arrive converted to linear. Set it here to keep r150's value.
			specular: 0x111111,
		});
		// the displacement map is applied in positionNode, after the water and the edges
		this._material.positionNode = mapPosition(displacementMap, this.time);
		this._material.opacityNode = edgesMask(uv(), 0.05, 0.25).mul(asFloat(materialOpacity));

		this.mesh = new THREE.Mesh(this.geometry, this._material);
		this._scene.add(this.mesh);

		this._scene.add(this._markersGroup);

		this.initStars();

		$selectedMarkerId.listen((id) => (id ? this.goToMarker(id) : this.backFromMarker()));
	}

	private initStars = (): void => {
		const vertices = [];
		const range = 50;
		for (let i = 0; i < 10000; i++) {
			const x = THREE.MathUtils.randFloatSpread(range);
			const y = THREE.MathUtils.randFloatSpread(range);
			const z = THREE.MathUtils.randFloatSpread(range);

			if (Math.sqrt(x * x + y * y + z * z) > 5) vertices.push(x, y, z);
		}

		// WebGPU draws Points 1px wide whatever the size, so the stars are instanced sprites,
		// which PointsNodeMaterial sizes the same way as PointsMaterial.
		const positions = new THREE.InstancedBufferAttribute(new Float32Array(vertices), 3);
		const material = new THREE.PointsNodeMaterial({ color: 0x505050, size: 0.08 });
		material.positionNode = instancedBufferAttribute(positions);
		const points = new THREE.Sprite(material);
		points.count = positions.count;
		points.frustumCulled = false;
		this.stars.add(points);
		this._scene.add(this.stars);
	};

	private animateWater() {
		this.timer.update();
		this.time.value = this.timer.getElapsed();
	}

	public update() {
		this.animateWater();
	}

	public initMarkersAsync = async () => {
		try {
			await MARKERS.forEach((markerData) => {
				console.log("Marker <<" + markerData.title + ">> was inited");
				const marker = new Marker(markerData);
				this.markers.push(marker);
				marker.spawnOnMap(
					this._scene,
					this.width,
					this.height,
					this._material.displacementScale,
					this._material.displacementBias
				);
				this._markersGroup.add(marker.markerMesh);
			});
		} catch (e) {
			console.log(e);
		}
	};

	private goToMarker = (id: MarkerData["id"]): void => {
		const marker = this.markers.find((marker) => marker.data.id === id);
		if (!marker) return;

		const { x, y } = marker.data.mapNormalizedPosition;
		this.setMapZoom(x, y, this.zoomScale);
		this.selectedMarker = marker.markerMesh;
	};

	private backFromMarker = (): void => {
		this.setMapZoom(0.5, 0.5, 1);
	};

	private setMapZoom = (x: number, y: number, scale: number): void => {
		const isGoingBack = scale < this.zoomScale;
		new Tween(this._material)
			.to(
				{
					map: {
						offset: { x: x - 0.5, y: y - 0.5 + this.zoomCenterOffsetY },
						repeat: { x: 1 / scale, y: 1 / scale },
					},
					displacementScale: THREE.MathUtils.lerp(
						0.45,
						(0.45 * scale) / 3,
						(scale - 1) / (this.zoomScale - 1)
					),
					displacementBias: THREE.MathUtils.lerp(
						-0.25,
						(-0.25 * scale) / 3,
						(scale - 1) / (this.zoomScale - 1)
					),
				},
				Map.zoomDuration
			)
			.easing(isGoingBack ? TWEEN.Easing.Cubic.InOut : TWEEN.Easing.Quadratic.InOut)
			.delay(isGoingBack ? Map.zoomBackDelay : 0)
			.start()
			.onUpdate(() => {
				this._material.map?.offset.clampScalar(
					-this.getOffsetLimit(),
					this.getOffsetLimit()
				);
				this.zoomMarkersAccordCurrentScale();
			});
	};

	private zoomMarkersAccordCurrentScale = (): void => {
		if (!this._material.map) throw "Map texture is null";

		this._markersGroup.scale.setScalar(this.getCurrentScale());

		this._markersGroup.position.x =
			-this._material.map.offset.x *
			this.geometry.parameters.width *
			this.getCurrentScale();
		this._markersGroup.position.y =
			-this._material.map.offset.y *
			this.geometry.parameters.height *
			this.getCurrentScale();

		this._markersGroup.children.forEach((markerObj) => {
			const unselectedMlt =
				markerObj != this.selectedMarker
					? Math.pow(
							1 - (this.getCurrentScale() - 1) / (this.zoomScale - 1),
							15
					  )
					: 1;

			markerObj.scale.copy(
				new THREE.Vector3(
					1 / this.getCurrentScale(),
					1 / this.getCurrentScale(),
					(1 / this.getCurrentScale()) * Marker.multiplierScaleZ
				).multiplyScalar(unselectedMlt)
			);
			markerObj.position.setZ(
				(markerObj.userData.marker.data.mapNormalizedPosition.z *
					this._material.displacementScale +
					this._material.displacementBias +
					Marker.additionalOffsetZ) *
					this.getCurrentInverseScale()
			);
		});
	};

	private getCurrentInverseScale = (): number => {
		if (!this._material.map) throw "Map texture is null";
		return this._material.map.repeat.x;
	};

	private getCurrentScale = (): number => {
		if (!this._material.map) throw "Map texture is null";

		return 1 / this._material.map.repeat.x;
	};

	private getOffsetLimit = (): number => {
		return (this.getCurrentScale() * 0.5 - 0.5) / this.getCurrentScale();
	};
}

// material accessor nodes are typed as plain nodes in @types/three
const asFloat = (node: THREE.MaterialNode | THREE.MaterialReferenceNode) => node as unknown as THREE.Node<"float">;

// the layouts make these real shader functions instead of inlining them at every call
const random = Fn(
	([st]: [THREE.Node<"vec2">]) => fract(sin(dot(st, vec2(12.9898, 78.233))).mul(43758.5453123)),
	{ name: "random", type: "float", inputs: [{ name: "st", type: "vec2" }] }
);

const noise = Fn(([st]: [THREE.Node<"vec2">]) => {
	const i = floor(st);
	const f = fract(st);

	const a = random(i);
	const b = random(i.add(vec2(1.0, 0.0)));
	const c = random(i.add(vec2(0.0, 1.0)));
	const d = random(i.add(vec2(1.0, 1.0)));

	const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

	return mix(a, b, u.x).add(c.sub(a).mul(u.y).mul(u.x.oneMinus())).add(d.sub(b).mul(u.x).mul(u.y));
}, { name: "noise", type: "float", inputs: [{ name: "st", type: "vec2" }] });

// 1 in the middle of the uv space, fading to 0 towards its borders
const edgesMask = (st: THREE.Node<"vec2">, margin: number, size: number) => {
	const maskX = smoothstep(margin, size, st.x).mul(smoothstep(1.0 - size, 1.0 - margin, st.x).oneMinus());
	const maskY = smoothstep(margin, size, st.y).mul(smoothstep(1.0 - size, 1.0 - margin, st.y).oneMinus());
	return maskX.mul(maskY);
};

const mapPosition = (displacementMap: THREE.Texture, time: THREE.UniformNode<"float", number>) =>
	Fn(() => {
		const transformed = positionLocal.toVar();
		// uv transformed by map.offset/repeat (vUv before r151), via the matrix the height map samples with
		const mapUv = uniform(displacementMap.matrix).mul(vec3(uv(), 1)).xy;
		const height = texture(displacementMap).x;

		// Water
		const scale = 10.0;
		const timeScale = 0.4;
		const strength = 0.2;

		const waterMask = float(1.0).sub(step(0.37, height));

		const noise1 = noise(uv().mul(vec2(noise(mapUv), 1)).mul(vec2(5.0 * scale, scale)).add(vec2(time.negate(), time).mul(timeScale)));
		const noise2 = noise(uv().mul(vec2(1, noise(uv()))).mul(vec2(scale, scale * 6.0)).add(vec2(time, time.negate()).mul(timeScale)));
		const noise3 = noise(mapUv.mul(vec2(noise(mapUv))).mul(vec2(3.0 * scale)).add(vec2(time, time.negate()).mul(timeScale)));
		const noise4 = noise(mapUv.mul(vec2(noise(uv()))).mul(vec2(scale * 3.0)).add(vec2(time.negate(), time).mul(timeScale)));

		const noiseResult = noise1.add(noise2).add(noise3).add(noise4).div(4.0);
		transformed.z.subAssign(waterMask.mul(noiseResult.mul(strength).sub(0.07)));

		// Edges
		transformed.z.subAssign(edgesMask(uv(), 0.0, 0.2).oneMinus().mul(0.2));

		// Displacement
		const displacementScale = asFloat(materialReference("displacementScale", "float"));
		const displacementBias = asFloat(materialReference("displacementBias", "float"));
		transformed.addAssign(normalLocal.normalize().mul(height.mul(displacementScale).add(displacementBias)));

		return transformed;
	})();
