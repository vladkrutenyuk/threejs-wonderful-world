import {
    Mesh, PlaneGeometry, TextureLoader,
    Scene, MeshPhongMaterial, Group, MathUtils,
    BufferGeometry, Float32BufferAttribute, PointsMaterial,
    Points, Vector3, Object3D, Clock,
} from "three";
import { Marker, MarkerData } from "./Marker";
import TWEEN, {Tween} from "@tweenjs/tween.js";

export class Map {
    public readonly zoomedScale = 10;
    public readonly zoomDuration = 2500;
    private readonly zoomCenterOffsetY = 0.025;

    private _mesh: Mesh;
    public get mesh() { return this._mesh };
    private _geometry: PlaneGeometry;
    public get width() { return this._geometry.parameters.width };
    public get height() { return this._geometry.parameters.height };
    private _material: MeshPhongMaterial;

    private readonly _scene: Scene;

    private _markersGroup: Group = new Group();
    public get markersGroup() { return this._markersGroup };

    private _selectedMarker: Object3D
    private _clock: Clock;
    private _time = {
        value: 0.0
    }

    constructor(scene: Scene) {
        this._scene = scene;
        this.init();
    }

    private init = (): void => {
        this._clock = new Clock();
        const textureLoader = new TextureLoader();
        this._geometry = new PlaneGeometry(3.6, 1.8, 140 * 1.3, 70 * 1.3);
        this._material = new MeshPhongMaterial({
            map: textureLoader.load("img/world_color.jpg"),
            specularMap: textureLoader.load("img/world_specular.jpg"),
            displacementMap: textureLoader.load("img/world_height.jpg"),
            displacementBias: -0.25,
            displacementScale: 0.45,
            wireframe: true,
            transparent: true,
            opacity: 0.6,
            depthWrite: true
        })

        this._material.onBeforeCompile = shader => {
            shader.uniforms.time = this._time;

            shader.vertexShader = noise + pars_vertex + shader.vertexShader
                .replace('#include <begin_vertex>', vertex);
            shader.fragmentShader = pars_frag + shader.fragmentShader
                .replace('#include <alphamap_fragment>', alpha_edges_frag);

            this._material.userData.shader = shader;
        }

        this._material.map.center.set(0.5, 0.5);
        this._mesh = new Mesh(this._geometry, this._material);
        this._scene.add(this._mesh);

        this._scene.add(this._markersGroup);

        this.initStars();
    }

    private initStars = (): void => {
        const vertices = [];
        const range = 50;
        for (let i = 0; i < 10000; i++) {
            const x = MathUtils.randFloatSpread(range);
            const y = MathUtils.randFloatSpread(range);
            const z = MathUtils.randFloatSpread(range);

            if (Math.sqrt(x*x + y*y + z*z) > 5) vertices.push(x, y, z);
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        const material = new PointsMaterial( { color: 0x505050, size: 0.08 } );
        this._scene.add(new Points(geometry, material));
    }

    public animateWater = (): void => {
        this._time.value = this._clock.getElapsedTime();
    }

    public initMarkers = async (jsonDataUrl: string): Promise<void> => {
        const jsonDataResponse = await fetch(jsonDataUrl);
        const jsonDataText = await jsonDataResponse.text();

        const markersData: MarkerData[] = JSON.parse(jsonDataText);

        try {
            await markersData.forEach((markerData) => {
                console.log("Marker <<" + markerData.title + ">> was inited");
                let marker = new Marker(markerData);
                marker.initOnMap(
                    this._scene,
                    this.width, this.height,
                    this._material.displacementScale,
                    this._material.displacementBias);
                this._markersGroup.add(marker.colliderMesh);
            })
        } catch (e) {
            console.log(e);
        }
    }

    public goToMarker = (markerObj: Object3D): void => {
        this.setMapZoom(markerObj.userData.marker.data.mapNormalizedPosition.x,
                        markerObj.userData.marker.data.mapNormalizedPosition.y,
                        this.zoomedScale);

        this._selectedMarker = markerObj;
    }

    public backFromMarker = (): void => {
        this.setMapZoom(0.5, 0.5, 1);
    }

    private setMapZoom = (x: number, y: number, scale: number): void => {
        new Tween(this._material)
            .to({
                    map: {
                        offset: { x: x - 0.5, y: y - 0.5 + this.zoomCenterOffsetY},
                        repeat: { x: 1 / scale, y: 1 / scale }},
                    displacementScale: MathUtils.lerp(
                        0.45,
                        0.45 * scale / 3,
                        (scale - 1) / (this.zoomedScale - 1)),
                    displacementBias: MathUtils.lerp(
                        -0.25,
                        -0.25 * scale / 3,
                        (scale - 1) / (this.zoomedScale - 1))
                },
                this.zoomDuration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start()
            .onUpdate(() => {
                this._material.map.offset.clampScalar(-this.getOffsetLimit(), this.getOffsetLimit())
                this.zoomMarkersAccordCurrentScale();
            });
    }

    private zoomMarkersAccordCurrentScale = (): void => {
        this._markersGroup.scale.setScalar(this.getCurrentScale());

        this._markersGroup.position.x =
            -this._material.map.offset.x * this._geometry.parameters.width * this.getCurrentScale();
        this._markersGroup.position.y =
            -this._material.map.offset.y * this._geometry.parameters.height * this.getCurrentScale();

        this._markersGroup.children.forEach((markerObj) => {
            const unselectedMlt = markerObj != this._selectedMarker
                ? Math.pow(1 - (this.getCurrentScale() - 1) / (this.zoomedScale - 1), 15)
                : 1;

            markerObj.scale.copy(new Vector3(
                1 / this.getCurrentScale(),
                1 / this.getCurrentScale(),
                1 / this.getCurrentScale() * Marker.multiplierScaleZ)
                .multiplyScalar(unselectedMlt)
            );
            markerObj.position.setZ(
                (markerObj.userData.marker.data.mapNormalizedPosition.z
                    * this._material.displacementScale
                    + this._material.displacementBias
                    + Marker.additionalOffsetZ)
                * this.getCurrentInverseScale()
            )
        });
    }

    private getCurrentInverseScale = (): number => {
        return this._material.map.repeat.x;
    }

    private getCurrentScale = (): number => {
        return 1 / this._material.map.repeat.x;
    }

    private getOffsetLimit = (): number => {
        return (this.getCurrentScale() * 0.5 - 0.5) / this.getCurrentScale();
    }
}

const glsl = x => x;

const noise: string = glsl`
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

const pars_vertex: string = glsl`
    uniform float time;
    varying vec2 vUv3;
`;

const vertex: string = glsl`
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
    transformed.z -= waterMask * noiseResult * strength;

    //  Edges
    float margin = 0.0;
    float scaleX = 0.2;
    float scaleY = 0.2;
    float maskX = smoothstep(0.0 + margin, scaleX, vUv3.x) * (1.0 - smoothstep(1.0 - scaleX, 1.0 - margin, vUv3.x));
    float maskY = smoothstep(0.0 + margin, scaleY, vUv3.y) * (1.0 - smoothstep(1.0 - scaleY, 1.0 - margin, vUv3.y));
    float mask = 1.0 - maskX * maskY;

    transformed.z -= mask * 0.2;
`;

const pars_frag: string = glsl`
    varying vec2 vUv3;
`;

const alpha_edges_frag: string = glsl`
    float margin = 0.05;
    float scaleX = 0.25;
    float scaleY = 0.25;

    float maskX = smoothstep(0.0 + margin, scaleX, vUv3.x) * (1.0 - smoothstep(1.0 - scaleX, 1.0 - margin, vUv3.x));
    float maskY = smoothstep(0.0 + margin, scaleY, vUv3.y) * (1.0 - smoothstep(1.0 - scaleY, 1.0 - margin, vUv3.y));
    float mask = maskX * maskY;

    diffuseColor.a *= mask;
`;