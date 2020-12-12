import {
    Scene, BackSide, Group, Vector3,
    Mesh, MeshBasicMaterial, OctahedronGeometry, Vector2, MeshPhongMaterial, Color, DoubleSide, FrontSide, Euler
} from "three";

import TWEEN, {Easing, Tween} from "@tweenjs/tween.js";
import { UIManager } from "./UIManager";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {TransformControls} from "three/examples/jsm/controls/TransformControls";

export type MarkerData = {
    "title": string,
    "mapNormalizedPosition": {
        "x": number,
        "y": number,
        "z": number
    },
    "url": string
}

export class Marker {
    public static readonly additionalOffsetZ = 0.07;
    public static readonly multiplierScaleZ = 1.5;
    private readonly _data: MarkerData;
    public get data(): MarkerData { return this._data };

    public get colliderMesh(): Mesh { return this._colliderMesh };
    private readonly _colliderMesh: Mesh;
    public get wireframeMesh(): Mesh { return this._wireframeMesh };
    private readonly _wireframeMesh: Mesh;
    public get coloredMesh(): Mesh { return this._coloredMesh };
    private readonly _coloredMesh: Mesh;

    public get visualGroup(): Group { return this._visualGroup }
    private _visualGroup: Group = new Group();

    public get isSelected(): boolean { return this._isSelected };
    private _isSelected: boolean = false;

    private _contentGroup: Group;
    private _contentWireframe: Mesh;
    private _contentOutline: Mesh;

    constructor(markerData: MarkerData) {
        this._data = markerData;
        this._colliderMesh = new Mesh(
            new OctahedronGeometry(0.075),
            new MeshBasicMaterial({ visible: false} ));
        this._colliderMesh.scale.setComponent(2, Marker.multiplierScaleZ);
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
            this._data.mapNormalizedPosition.z * displacementScale + displacementBias + Marker.additionalOffsetZ));
        scene.add(this._colliderMesh);

        scene.add(this._visualGroup);
        scene.add(this._wireframeMesh);
        this._visualGroup.add(this._coloredMesh, this._wireframeMesh);
        this._visualGroup.parent = this._colliderMesh;

        // if (this.data.title == "Chichen Itza")
        this.loadModel(scene);
    }

    private loadModel = (scene: Scene) => {
        const loader = new GLTFLoader();
        loader.load(
            "models/ChichenItza.glb",
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if ((<Mesh>child).isMesh) {
                        this._contentWireframe = (<Mesh>child);
                        this._contentWireframe.material = new MeshBasicMaterial({
                            depthWrite: false,
                            wireframe: true,
                            color: 0xffffff,
                            side: FrontSide,
                            transparent: true,
                            opacity: 0
                        });
                        this._contentWireframe.renderOrder = 2;

                        this._contentOutline = new Mesh(
                            this._contentWireframe.geometry,
                            new MeshBasicMaterial({
                                    color: 0x000000,
                                    opacity: 0,
                                    side: BackSide,
                                    depthWrite: false,
                                    transparent: true,
                            }));
                        this._contentOutline.renderOrder = 1;
                        this._contentOutline.scale.multiplyScalar(1.05);

                        this._contentGroup = new Group();
                        this._contentGroup.add(this._contentWireframe);
                        this._contentGroup.add(this._contentOutline);

                        this._contentGroup.scale.multiplyScalar(0.17);
                        this._contentGroup.position.copy(this._colliderMesh.position);

                        scene.add(this._contentGroup);

                        this._contentGroup.scale.setScalar(0);
                        this._contentGroup.visible = false;
                    }
                })
            },
            (xhr) => {
                console.log(("Loading... "
                    + (xhr.loaded / xhr.total * 100).toPrecision(3))
                    + "% of " + this.data.title);
            },
            (error) => {
                console.log(error);
            }
        );
    }

    public setMouseOveringStyle = (isEntering: boolean, mouseScreenPosition: Vector2): void => {
        new Tween(this._visualGroup.scale)
            .to(new Vector3().setScalar(isEntering ? 1.3 : 1), 250)
            .start();

        if (isEntering) {
            UIManager.setHint(
                this._isSelected ? "< back" : "> " + this._data.title,
                mouseScreenPosition.x,
                mouseScreenPosition.y,
                true)
        } else {
            UIManager.setHint("");
        }
    }

    public beSelected = (isSelected: boolean): void => {
        new Tween(this._colliderMesh.rotation)
            .to({
                    z: isSelected ? 6 * -Math.PI / 2 : 0,
                    y: isSelected ? -Math.PI / 2 : 0 },
                2000)
            .easing(TWEEN.Easing.Exponential.In)
            .start()
            .onUpdate(() => {

            });

        this._isSelected = isSelected;

        if (this._isSelected) {
            this._contentGroup.visible = this._isSelected;
            new Tween(this._contentGroup)
                .to({
                        scale: new Vector3().setScalar(0.17),
                        position: new Vector3(0, 0.25, 0)
                    },
                    1500)
                .delay(1000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start()

            new Tween(<MeshBasicMaterial>this._contentWireframe.material)
                .to( {opacity: 0.1}, 1000)
                .delay(1500)
                .start()
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => console.log("forward"));

            new Tween(<MeshBasicMaterial>this._contentOutline.material)
                .to( {opacity: 0.9}, 1000)
                .delay(1500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start()
                .onUpdate(() => console.log("forward"));
        } else {

            new Tween(this._contentGroup)
                .to({
                        scale: new Vector3().setScalar(0),
                        position: new Vector3().copy(this._colliderMesh.position)
                    },
                    1500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start().onComplete(() =>
                    this._contentGroup.visible = this._isSelected
                )

            new Tween(<MeshBasicMaterial>this._contentWireframe.material)
                .to( {opacity: 0.0}, 1000)
                .start()
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => console.log("forward"));

            new Tween(<MeshBasicMaterial>this._contentOutline.material)
                .to( {opacity: 0.0}, 1000)
                .start()
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(() => console.log("forward"));
        }

        UIManager.setTitle(this._isSelected ? "Wonder of the world" : "Wonders of the world", this._isSelected);
        UIManager.setWonderNameTitle(this._isSelected ? this.data.title : "", this.data.url);
    }
}