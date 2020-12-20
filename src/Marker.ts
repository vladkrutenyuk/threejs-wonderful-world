import {
    Scene, BackSide, Group,
    Mesh, MeshBasicMaterial, OctahedronGeometry,
    Vector2, Vector3, MeshMatcapMaterial, TextureLoader
} from "three";
import TWEEN, { Tween } from "@tweenjs/tween.js";
import { UIManager } from "./UIManager";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
    private readonly _wireframeMesh: Mesh;
    private readonly _coloredMesh: Mesh;

    public get visualGroup(): Group { return this._visualGroup }
    private _visualGroup: Group = new Group();

    public get isSelected(): boolean { return this._isSelected };
    private _isSelected: boolean = false;

    private _contentGroup: Group;
    private _contentMesh: Mesh;

    constructor(markerData: MarkerData) {

        this._data = markerData;

        this._colliderMesh = new Mesh(
            new OctahedronGeometry(0.075),
            new MeshBasicMaterial({ visible: false })
        );
        this._colliderMesh.scale.setComponent(2, Marker.multiplierScaleZ);
        this._colliderMesh.userData = { marker: this };

        this._wireframeMesh = new Mesh(
            new OctahedronGeometry(0.025),
            new MeshBasicMaterial( { wireframe: true } )
        );

        this._coloredMesh = new Mesh(
            new OctahedronGeometry(0.035),
            new MeshBasicMaterial( { wireframe: false, color: 0x000000, side: BackSide } )
        );
    }

    public initOnMap = (scene: Scene,
                        mapWidth: number,
                        mapHeight: number,
                        displacementScale: number,
                        displacementBias: number): void => {
                            
        this._colliderMesh.position.copy(new Vector3(
            mapWidth * (this._data.mapNormalizedPosition.x - 0.5),
            mapHeight * (this._data.mapNormalizedPosition.y - 0.5),
            this._data.mapNormalizedPosition.z * displacementScale + displacementBias + Marker.additionalOffsetZ)
        );
        scene.add(this._colliderMesh);
        scene.add(this._visualGroup);
        scene.add(this._wireframeMesh);

        this._visualGroup.add(this._coloredMesh, this._wireframeMesh);
        this._visualGroup.parent = this._colliderMesh;

        this.loadModel(scene);
    }

    private loadModel = (scene: Scene) => {

        const textureLoader = new TextureLoader();
        const loader = new GLTFLoader();
        
        loader.load("models/ChichenItza.glb",
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if ((<Mesh>child).isMesh) {
                        this._contentMesh = <Mesh>child;
                        this._contentMesh.material = new MeshMatcapMaterial({
                            matcap: textureLoader.load("img/matcap_1.png"),
                            depthWrite: true,
                            color: 0xffffff,
                            transparent: true,
                            opacity: 0
                        });
                        this._contentMesh.renderOrder = 2;

                        scene.add(this._contentMesh);

                        this._contentMesh.scale.setScalar(0);
                        this._contentMesh.visible = false;
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

    public setMouseOveringStyle = (isEntering: boolean, 
                                   mouseScreenPosition: Vector2): void => {
        
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

        this._isSelected = isSelected;

        new Tween(this._colliderMesh.rotation)
            .to({
                    z: isSelected ? 6 * -Math.PI / 2 : 0,
                    y: isSelected ? -Math.PI / 2 : 0 },
                2000)
            .easing(TWEEN.Easing.Exponential.In)
            .start()
            .onUpdate(() => {
            });

        UIManager.setTitle(this._isSelected ? "Wonder of the world" : "Wonders of the world", this._isSelected);
        UIManager.setWonderNameTitle(this._isSelected ? this.data.title : "", this.data.url);

        this.showHideContent();
    }

    private showHideContent = (): void => {
        
        if (this._isSelected) {
            this._contentMesh.visible = this._isSelected;
            new Tween(this._contentMesh)
                .to({
                        scale: new Vector3().setScalar(0.17),
                        position: new Vector3(0, 0.25, 0)
                    },
                    1500)
                .delay(1000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start()

            new Tween(<MeshMatcapMaterial>this._contentMesh.material)
                .to( {opacity: 1.0}, 1000)
                .delay(1500)
                .start()
                .easing(TWEEN.Easing.Quadratic.InOut);

        } else {

            new Tween(this._contentMesh)
                .to({
                        scale: new Vector3().setScalar(0),
                        position: new Vector3().copy(this._contentMesh.position)
                    },
                    1500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start().onComplete(() =>
                    this._contentMesh.visible = this._isSelected
                )

            new Tween(<MeshMatcapMaterial>this._contentMesh.material)
                .to( {opacity: 0.0}, 1000)
                .start()
                .easing(TWEEN.Easing.Quadratic.InOut);

        }
    }
}

const glsl = x => x;

const pars_vertex = glsl`

`

const vertex = glsl`

`

const pars_frag = glsl`

`

const frag = glsl`

`