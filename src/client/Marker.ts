import {
    BackSide,
    Mesh, MeshBasicMaterial, OctahedronGeometry, Scene,
    Vector3
} from "/build/three.module.js";

export type MarkerData = {
    "title": string,
    "mapNormalizedPositionX": number,
    "mapNormalizedPositionY": number
}

export class Marker {
    private readonly _data: MarkerData;
    public get data() { return this._data };

    public get colliderMesh() { return this._colliderMesh };
    private readonly _colliderMesh: Mesh;
    public get wireframeMesh() { return this._wireframeMesh };
    private readonly _wireframeMesh: Mesh;
    public get coloredMesh() { return this._coloredMesh };
    private readonly _coloredMesh: Mesh;

    constructor(markerData: MarkerData) {
        this._data = markerData;
        this._colliderMesh = new Mesh(
            new OctahedronGeometry(0.075),
            new MeshBasicMaterial({ visible: false} ));
        this._colliderMesh.scale.setComponent(2, 1.5);
        this._colliderMesh.userData = { marker: this };

        this._wireframeMesh = new Mesh(
            new OctahedronGeometry(0.025),
            new MeshBasicMaterial( { wireframe: true } ));

        this._coloredMesh = new Mesh(
            new OctahedronGeometry(0.035),
            new MeshBasicMaterial( { wireframe: false, color: 0x000000, side: BackSide } ));
    }

    public initOnMap = (mapWidth: number, mapHeight: number, scene: Scene): void => {
        this._colliderMesh.position.copy(new Vector3(
            mapWidth * (this._data.mapNormalizedPositionX - 0.5),
            mapHeight * (this._data.mapNormalizedPositionY - 0.5),
            0.05));
        scene.add(this._colliderMesh);

        scene.add(this._wireframeMesh);
        this._wireframeMesh.parent = this._colliderMesh;

        scene.add(this._coloredMesh);
        this._coloredMesh.parent = this._colliderMesh;
    }
}