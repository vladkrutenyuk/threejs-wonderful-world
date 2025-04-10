import TWEEN, { Tween } from "@tweenjs/tween.js";
import * as THREE from "three";
import { MARKERS } from "../constants/markers";
import { Marker } from "./Marker";
import Tooltip from "./Tooltip";

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
	private _material: THREE.MeshPhongMaterial;

	private readonly _scene: THREE.Scene;

	private _markersGroup: THREE.Group = new THREE.Group();
	public get markersGroup() {
		return this._markersGroup;
	}

	private selectedMarker: THREE.Object3D | null = null;
	private clock: THREE.Clock;
	private time = {
		value: 0,
	};

	stars = new THREE.Group();
	markers: Marker[] = [];

	constructor(scene: THREE.Scene) {
		this._scene = scene;

		this.clock = new THREE.Clock();
		const textureLoader = new THREE.TextureLoader();
		this.geometry = new THREE.PlaneGeometry(3.6, 1.8, 140 * 1.3, 70 * 1.3);
		this._material = new THREE.MeshPhongMaterial({
			map: textureLoader.load("/img/world_color.jpg"),
			specularMap: textureLoader.load("/img/world_specular.jpg"),
			displacementMap: textureLoader.load("/img/world_height.jpg"),
			displacementBias: -0.25,
			displacementScale: 0.45,
			wireframe: true,
			transparent: true,
			opacity: 0.6,
			depthWrite: true,
			color: "white"
		});

		this._material.onBeforeCompile = (shader): void => {
			shader.uniforms.time = this.time;

			shader.vertexShader =
				noise +
				pars_vertex +
				shader.vertexShader.replace("#include <begin_vertex>", vertex);
			shader.fragmentShader =
				pars_frag +
				shader.fragmentShader.replace(
					"#include <alphamap_fragment>",
					alpha_edges_frag
				);

			this._material.userData.shader = shader;
		};

		this._material.map?.center.set(0.5, 0.5);
		this.mesh = new THREE.Mesh(this.geometry, this._material);
		this._scene.add(this.mesh);

		this._scene.add(this._markersGroup);

		this.initStars();
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

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		const material = new THREE.PointsMaterial({ color: 0x505050, size: 0.08 });
		this.stars.add(new THREE.Points(geometry, material));
		this._scene.add(this.stars);
	};

	private animateWater() {
		this.time.value = this.clock.getElapsedTime();
	}

	public update() {
		this.animateWater();
	}

	public initMarkersAsync = async (tooltip: Tooltip) => {
		try {
			await MARKERS.forEach((markerData) => {
				console.log("Marker <<" + markerData.title + ">> was inited");
				const marker = new Marker(markerData, tooltip);
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

	public goToMarker = (markerObj: THREE.Object3D): void => {
		this.setMapZoom(
			markerObj.userData.marker.data.mapNormalizedPosition.x,
			markerObj.userData.marker.data.mapNormalizedPosition.y,
			this.zoomScale
		);

		this.selectedMarker = markerObj;
	};

	public backFromMarker = (): void => {
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

const noise: string = /*glsl*/ `
    float random (in vec2 st) 
    {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    float noise (in vec2 st) 
    {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f*f*(3.0-2.0*f);

        return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
    }
`;

const pars_vertex = /*glsl*/ `
    uniform float time;
    varying vec2 vUv3;
`;

const vertex = /*glsl*/ `
    // Begin
    vec3 transformed = vec3(position);
    vUv3 = uv;

    // Water
    float scale = 10.0;
    float timeScale = 0.4;
    float strength = 0.2;

    float normalizedHeight = texture2D(displacementMap, vUv).x;
    float waterMask = 1.0 - step(0.37, normalizedHeight);

    float noise1 = noise(vUv3 * vec2(noise(vUv), 1) * vec2(5.0 * scale, scale) + vec2(-time, time) * timeScale);
    float noise2 = noise(vUv3 * vec2(1, noise(vUv3)) * vec2(scale, scale * 6.0) + vec2(time, -time) * timeScale);
    float noise3 = noise(vUv * vec2(noise(vUv)) * vec2(3.0 * scale) + vec2(time, -time) * timeScale);
    float noise4 = noise(vUv * vec2(noise(vUv3)) * vec2(scale * 3.0) + vec2(-time, time) * timeScale);

    float noiseResult = (noise1 + noise2 + noise3 + noise4) / 4.0;
    transformed.z -= waterMask * (noiseResult * strength - 0.07);

    //  Edges
    float margin = 0.0;
    float scaleX = 0.2;
    float scaleY = 0.2;
    float maskX = smoothstep(0.0 + margin, scaleX, vUv3.x) * (1.0 - smoothstep(1.0 - scaleX, 1.0 - margin, vUv3.x));
    float maskY = smoothstep(0.0 + margin, scaleY, vUv3.y) * (1.0 - smoothstep(1.0 - scaleY, 1.0 - margin, vUv3.y));
    float mask = 1.0 - maskX * maskY;

    transformed.z -= mask * 0.2;
`;

const pars_frag = /*glsl*/ `
    varying vec2 vUv3;
`;

const alpha_edges_frag = /*glsl*/ `
    float margin = 0.05;
    float scaleX = 0.25;
    float scaleY = 0.25;

    float maskX = smoothstep(0.0 + margin, scaleX, vUv3.x) * (1.0 - smoothstep(1.0 - scaleX, 1.0 - margin, vUv3.x));
    float maskY = smoothstep(0.0 + margin, scaleY, vUv3.y) * (1.0 - smoothstep(1.0 - scaleY, 1.0 - margin, vUv3.y));
    float mask = maskX * maskY;

    diffuseColor.a *= mask;
`;
