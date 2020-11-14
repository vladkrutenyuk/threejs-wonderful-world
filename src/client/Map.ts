import {
    Mesh,
    PlaneGeometry,
    TextureLoader,
    Scene,
    MeshPhongMaterial,
    Group, MathUtils, BufferGeometry, Float32BufferAttribute, PointsMaterial, Points
} from "/build/three.module.js";
import { Marker, MarkerData } from "./Marker.js";

export class Map {
    private _mesh: Mesh;
    public get mesh() { return this._mesh };
    private _geometry: PlaneGeometry;
    public get width() { return this._geometry.parameters.width };
    public get height() { return this._geometry.parameters.height };
    private _material: MeshPhongMaterial;

    private _scene: Scene;

    private _markersGroup: Group = new Group();

    constructor(scene: Scene) {
        this._scene = scene;
        this.init();
    }

    public initMarkers = async (jsonDataUrl: string) => {
        const jsonDataResponse = await fetch(jsonDataUrl);
        const jsonDataText = await jsonDataResponse.text();

        const markersData: MarkerData[] = JSON.parse(jsonDataText);

        try {
            await markersData.forEach((m) => {
                console.log("Marker <<" + m.title + ">> was inited");
                let marker = new Marker(m);
                marker.setMapPosition(this.width, this.height);
                this._scene.add(marker.mesh);
                this._markersGroup.add(marker.mesh);
            })
        } catch (e) {
            console.log(e);
        }
    }

    private init = (): void => {
        this._geometry = new PlaneGeometry(3.6, 1.8, 140, 70);
        this._material = new MeshPhongMaterial({
            map: new TextureLoader().load("img/world_color.jpg"),
            specularMap: new TextureLoader().load("img/world_specular.jpg"),
            displacementMap: new TextureLoader().load("img/world_height.jpg"),
            displacementBias: -0.25,
            displacementScale: 0.55,
            wireframe: true,
            transparent: false,
            opacity: 0.6
        })
        this._material.map.center.set(0.5, 0.5);
        this._mesh = new Mesh(this._geometry, this._material);
        this._scene.add(this._mesh);

        this._scene.add(this._markersGroup);

        this.initPoints();
    }

    private initPoints = (): void => {
        const vertices = [];
        const range = 50;
        for (let i = 0; i < 10000; i++) {
            const x = MathUtils.randFloatSpread(range);
            const y = MathUtils.randFloatSpread(range);
            const z = MathUtils.randFloatSpread(range);
            vertices.push(x, y, z);
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        const material = new PointsMaterial( { color: 0x505050, size: 0.08 } );
        this._scene.add(new Points(geometry, material));
    }
}