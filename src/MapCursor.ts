import {
    Scene, Camera, Group, PointLight,
    Mesh, MeshBasicMaterial, Line, LineBasicMaterial,
    RingGeometry, PlaneGeometry, BufferGeometry,
    Raycaster, Vector2, Vector3, MathUtils, Object3D, Color
} from "three";
import TWEEN, {Tween} from "@tweenjs/tween.js";
import { Map } from "./Map";
import { Marker } from "./Marker";

export class MapCursor {
    private _cursor: Group = new Group();
    private _ring: Mesh;
    private _ringMaterial: MeshBasicMaterial;
    private _ringSrcData = {
        innerRadius: 0.035,
        outerRadius: 0.0425,
        thetaSegments: 16
    };
    private _ringData = {
        innerRadius: this._ringSrcData.innerRadius,
        outerRadius: this._ringSrcData.outerRadius,
        thetaSegments: this._ringSrcData.thetaSegments
    };
    private _light: PointLight;
    private _horizontalLeftLine: Line;
    private _horizontalRightLine: Line;
    private _verticalUpLine: Line;
    private _verticalDownLine: Line;
    private _quadCorners: Group;
    private readonly _cursorMargin = 0.02;

    private _scene: Scene;
    private readonly _camera: Camera;
    private _map: Map;
    private _mapHalfWidth: number;
    private _mapHalfHeight: number;
    private readonly _mapMesh: Mesh;
    private _markersGroup: Group;

    private _overedMarker: Object3D = null;
    private _lastOveredMarkerPosition: Vector3 = new Vector3();

    private _enterExitTweenGroup = new TWEEN.Group();

    private _raycaster: Raycaster = new Raycaster();
    private _onMapPosition: Vector3 = new Vector3();
    private _magnetizationToMarker = {
        value: 0,
        duration: 500
    };
    private _mouseScreenPosition: Vector2 = new Vector2();

    private _isBlocked: boolean = false;

    constructor(scene: Scene, camera: Camera, map: Map) {
        this._scene = scene;
        this._camera = camera;
        this._map = map;
        this._mapHalfWidth = (<PlaneGeometry>map.mesh.geometry).parameters.width / 2;
        this._mapHalfHeight = (<PlaneGeometry>map.mesh.geometry).parameters.height / 2;
        this._mapMesh = map.mesh;
        this._markersGroup = map.markersGroup;
        this.init();
    } 

    private init = (): void => {
        this._light = new PointLight(0xffffff, 3, 0.5)
        this._light.position.z = 0.15;

        this.initCursor();

        this.initLines();

        this._scene.add(
            this._cursor, this._light,
            this._verticalUpLine, this._verticalDownLine, 
            this._horizontalLeftLine, this._horizontalRightLine
        )
    }

    private initCursor = (): void => {

        this._ringMaterial = new MeshBasicMaterial({ color: 0xffffff });
        this._ring = new Mesh(
            new RingGeometry(
                this._ringSrcData.innerRadius,
                this._ringSrcData.outerRadius,
                this._ringSrcData.thetaSegments
            ),
            this._ringMaterial
        );

        const quadCornerStep = this._ringSrcData.outerRadius + this._cursorMargin;
        const quadCornerSize = this._cursorMargin;
        const quadCornerGeometry = new BufferGeometry().setFromPoints([
            new Vector3(quadCornerStep - quadCornerSize, quadCornerStep, 0),
            new Vector3(quadCornerStep, quadCornerStep, 0),
            new Vector3(quadCornerStep, quadCornerStep - quadCornerSize, 0)
        ]);

        const quadCornerRT = new Line(
            quadCornerGeometry, 
            new LineBasicMaterial({ color: 0xffffff })
        );

        const quadCornerLT = new Line().copy(quadCornerRT);
        quadCornerLT.scale.setX(-1);

        const quadCornerRB = new Line().copy(quadCornerRT);
        quadCornerRB.scale.setY(-1);

        const quadCornerLB = new Line().copy(quadCornerRT);
        quadCornerLB.scale.setY(-1).setX(-1);

        this._quadCorners = new Group().add(
            quadCornerRT, quadCornerLT, quadCornerRB, quadCornerLB);

        this._cursor.add(this._ring, this._quadCorners);
    }

    private initLines = (): void => {

        const lineMaterial = new LineBasicMaterial({ color: 0xe0e0e0 });

        const verticalUpGeometry = new BufferGeometry().setFromPoints([
            new Vector3(0, this._mapHalfHeight, 0),
            new Vector3(0, this._ringSrcData.outerRadius + this._cursorMargin, 0)]);
        this._verticalUpLine = new Line(verticalUpGeometry, lineMaterial);

        const verticalDownGeometry = new BufferGeometry().setFromPoints([
            new Vector3(0, -(this._ringSrcData.outerRadius + this._cursorMargin), 0),
            new Vector3(0, -this._mapHalfHeight, 0)]);
        this._verticalDownLine = new Line(verticalDownGeometry, lineMaterial);

        const horizontalLeftGeometry = new BufferGeometry().setFromPoints([
            new Vector3(-this._mapHalfWidth, 0, 0),
            new Vector3(-(this._ringSrcData.outerRadius + this._cursorMargin), 0, 0)]);
        this._horizontalLeftLine = new Line(horizontalLeftGeometry, lineMaterial);

        const horizontalRightGeometry = new BufferGeometry().setFromPoints([
            new Vector3(this._mapHalfWidth, 0, 0),
            new Vector3(this._ringSrcData.outerRadius + this._cursorMargin, 0, 0)]);
        this._horizontalRightLine = new Line(horizontalRightGeometry, lineMaterial);
    }

    public update = (): void => {

        this._enterExitTweenGroup.update();
        this.setCursorPositionMagically();
    }

    public positioning = (mousePosition: Vector2) => {

        this._mouseScreenPosition = mousePosition;
        const mouseCoords = {
            x: (mousePosition.x / window.innerWidth) * 2 - 1,
            y: -(mousePosition.y / window.innerHeight) * 2 + 1
        };

        this._raycaster.setFromCamera(mouseCoords, this._camera);

        const mapIntersection = this._raycaster.intersectObject(this._mapMesh)[0];

        mapIntersection != null &&
        this._onMapPosition.copy(mapIntersection.point);

        const markerIntersection 
            = this._raycaster.intersectObjects(this._markersGroup.children)[0];

        if (markerIntersection == null){
            this._overedMarker != null &&
            this.onMarkerExit(this._overedMarker);
        } else {
            if (this._overedMarker == null) {
                this.onMarkerEnter(markerIntersection.object);
            } else {
                if (this._overedMarker != markerIntersection.object) {
                    this.onMarkerExit(this._overedMarker);
                    this.onMarkerEnter(markerIntersection.object);
                }
            }
        }
    }

    private setCursorPositionMagically = (): void => {

        let markerWorldPositionForLerp = new Vector3();

        if (this._overedMarker != null) {
            this._overedMarker.getWorldPosition(markerWorldPositionForLerp);
        } else {
            markerWorldPositionForLerp.copy(this._lastOveredMarkerPosition);
        }

        const position = new Vector3().lerpVectors(
            this._onMapPosition, 
            markerWorldPositionForLerp, 
            this._magnetizationToMarker.value
        );

        const alpha = 0.15;
        this._cursor.position.lerpVectors(this._cursor.position, position, alpha);

        this._horizontalLeftLine.position.y 
            = MathUtils.lerp(this._horizontalLeftLine.position.y, position.y, alpha);
        this._horizontalRightLine.position.y 
            = this._horizontalLeftLine.position.y;
            
        this._verticalUpLine.position.x 
            = MathUtils.lerp(this._verticalUpLine.position.x, position.x, alpha);
        this._verticalDownLine.position.x 
            = this._verticalUpLine.position.x;

        this._horizontalRightLine.geometry.dispose();
        this._horizontalRightLine.geometry.setFromPoints([
            new Vector3(this._mapHalfWidth, 0, 0),
            new Vector3(this._verticalUpLine.position.x 
                        + this._ringSrcData.outerRadius 
                        + this._cursorMargin, 
                        0, 0)
        ]);
        this._horizontalLeftLine.geometry.dispose();
        this._horizontalLeftLine.geometry.setFromPoints([
            new Vector3(-this._mapHalfWidth, 0, 0),
            new Vector3(this._verticalUpLine.position.x 
                        - this._ringSrcData.outerRadius 
                        - this._cursorMargin, 
                        0, 0)
        ]);

        this._verticalUpLine.geometry.dispose();
        this._verticalUpLine.geometry.setFromPoints([
            new Vector3(0, this._mapHalfHeight, 0),
            new Vector3(0,
                        this._horizontalLeftLine.position.y 
                        + this._ringSrcData.outerRadius 
                        + this._cursorMargin, 
                        0)
        ]);
        this._verticalDownLine.geometry.dispose();
        this._verticalDownLine.geometry.setFromPoints([
            new Vector3(0, -this._mapHalfHeight, 0),
            new Vector3(0, 
                        this._horizontalLeftLine.position.y
                        - this._ringSrcData.outerRadius 
                        - this._cursorMargin, 
                        0)
        ]);

        this._light.position.x = this._onMapPosition.x;
        this._light.position.y = this._onMapPosition.y;
    }

    public setOveredMarkerSelection = async () => {

        if (this._overedMarker == null) return;

        const markerObj = this._overedMarker;
        const marker = <Marker>markerObj.userData.marker;
        marker.visualGroup.scale.multiplyScalar(0.5);

        if (marker.isSelected) {
            marker.beSelected(false);
            this._map.backFromMarker();

            console.log("Back from " + marker.data.title)
        } else {
            marker.beSelected(true);
            this._map.goToMarker(markerObj);

            console.log("Go to " + marker.data.title)
        }

        this.onMarkerExit(markerObj);

        document.body.style.cursor = 'default';
        this._isBlocked = true;
        await setTimeout(() => {this._isBlocked = false}, Map.zoomDuration);
    }


    private onMarkerEnter = (markerObject: Object3D): void => {

        if (this._isBlocked) return;

        this._overedMarker = markerObject;
        document.body.style.cursor = 'pointer';

        const marker = <Marker>markerObject.userData.marker;
        marker.setMouseOveringStyle(true, this._mouseScreenPosition);

        this._enterExitTweenGroup.removeAll();
        this._enterExitTweenGroup = new TWEEN.Group();

        new Tween(this._magnetizationToMarker, this._enterExitTweenGroup)
            .to({ value: 0.9 }, this._magnetizationToMarker.duration)
            .start();

        let tempColor = { hex: this._ringMaterial.color.getHex() };
        new Tween(tempColor, this._enterExitTweenGroup)
            .to({ 
                    hex: new Color(0x000000).getHex() 
                }, 
                this._magnetizationToMarker.duration / 2)
            .start()
            .onUpdate(() => this._ringMaterial.color.setHex(tempColor.hex));

        this.tweenRingGeometry(
            0.001,
            0.065,
            4,
            this._magnetizationToMarker.duration / 2);
    }

    private onMarkerExit = (markerObject: Object3D): void => {

        this._overedMarker.getWorldPosition(this._lastOveredMarkerPosition);
        this._overedMarker = null;
        document.body.style.cursor = 'default';

        const marker = <Marker>markerObject.userData.marker;
        marker.setMouseOveringStyle(false, this._mouseScreenPosition);

        this._enterExitTweenGroup.removeAll();

        new Tween(this._magnetizationToMarker, this._enterExitTweenGroup)
            .to({ value: 0 }, this._magnetizationToMarker.duration)
            .start();

        let tempColor = { hex: this._ringMaterial.color.getHex() };
        new Tween(tempColor, this._enterExitTweenGroup)
            .to({ 
                    hex: new Color(0xffffff).getHex() 
                }, 
                this._magnetizationToMarker.duration / 2)
            .start()
            .onUpdate(() => this._ringMaterial.color.setHex(tempColor.hex));

        this.tweenRingGeometry(
            0.035,
            0.0425,
            16,
            this._magnetizationToMarker.duration
        );
    }

    private tweenRingGeometry = (innerRadius: number,
                                 outerRadius: number,
                                 thetaSegments: number,
                                 duration: number): void => {

        new Tween(this._ringData, this._enterExitTweenGroup)
            .to({ innerRadius, outerRadius, thetaSegments }, duration)
            .start()
            .onUpdate(() => {
                this._ring.geometry.dispose();
                this._ring.geometry = new RingGeometry(
                    this._ringData.innerRadius,
                    this._ringData.outerRadius,
                    Math.round(this._ringData.thetaSegments)
                )
            })
    }
}