import {Mesh, PlaneGeometry, TextureLoader, Scene, MeshPhongMaterial, Material} from "/build/three.module.js";
import * as THREE from "/build/three.module.js";

export class Map {
    private _mesh: Mesh;
    public get mesh() { return this._mesh };
    private _geometry: PlaneGeometry;
    private _material: MeshPhongMaterial;

    private _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;
        this.init();
    }

    private init = (): void => {
        this._geometry = new PlaneGeometry(3.6, 1.8, 140, 70);
        this._material = new MeshPhongMaterial({
            map: new TextureLoader().load("img/world_color.jpg"),
            specularMap: new TextureLoader().load("img/world_specular.jpg"),
            displacementMap: new TextureLoader().load("img/world_height.jpg"),
            displacementBias: -0.25,
            displacementScale: 0.75,
            wireframe: true,
            transparent: true,
            opacity: 0.6})
        this._material.map.center.set(0.5, 0.5);

        this._mesh = new Mesh(this._geometry, this._material);
        this._scene.add(this._mesh);
    }
}