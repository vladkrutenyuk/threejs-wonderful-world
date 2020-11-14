import {
    Mesh, MeshBasicMaterial, OctahedronGeometry,
    Vector3
} from "/build/three.module.js";

export type MarkerData = {
    "title": string,
    "mapNormalizedPositionX": number,
    "mapNormalizedPositionY": number
}

export class Marker {
    private readonly _title: string;
    public get title() { return this._title };

    private readonly _data: MarkerData;
    public get data() { return this._data };

    public get mesh() { return this._mesh };
    private readonly _mesh: Mesh;

    constructor(markerData: MarkerData) {
        this._data = markerData;
        this._mesh = new Mesh(
            new OctahedronGeometry(0.025),
            new MeshBasicMaterial( { wireframe: true } ));

        this._mesh.scale.setComponent(2, 1.5);
        this._mesh.userData = { marker: this };
    }

    public setMapPosition = (mapWidth: number, mapHeight: number): void => {
        this._mesh.position.copy(new Vector3(
            mapWidth * (this._data.mapNormalizedPositionX - 0.5),
            mapHeight * (this._data.mapNormalizedPositionY - 0.5),
            0.07),);
    }
}