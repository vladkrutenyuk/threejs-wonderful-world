import {
    BackSide, Group,
    Mesh, MeshBasicMaterial, OctahedronGeometry, Scene,
    Vector3
} from "/build/three.module.js";
import { TWEEN } from "/jsm/libs/tween.module.min";

export type MarkerData = {
    "title": string,
    "mapNormalizedPosition": {
        "x": number,
        "y": number,
        "z": number
    }
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

    private _visualGroup: Group = new Group();

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

    public initOnMap = (scene: Scene,
                        mapWidth: number,
                        mapHeight: number,
                        displacementScale: number,
                        displacementBias: number): void => {
        this._colliderMesh.position.copy(new Vector3(
            mapWidth * (this._data.mapNormalizedPosition.x - 0.5),
            mapHeight * (this._data.mapNormalizedPosition.y - 0.5),
            this._data.mapNormalizedPosition.z * displacementScale + displacementBias + 0.07));
        scene.add(this._colliderMesh);

        scene.add(this._visualGroup);
        scene.add(this._wireframeMesh);
        this._visualGroup.add(this._coloredMesh, this._wireframeMesh);
        this._visualGroup.parent = this._colliderMesh;
    }

    public setMouseEnterStyle = (): void => {
        this._visualGroup.scale.setScalar(1.2);
    }

    public setMouseExitStyle = (): void => {
        this._visualGroup.scale.setScalar(1);
    }
}