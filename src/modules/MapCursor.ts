import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three/webgpu";
import { LegacyPointLight } from "../helpers/legacy-lights";
import { Map } from "./Map";
import { Marker } from "./Marker";

export type CursorLines = {
	horizontalLeft: THREE.Line;
	horizontalRight: THREE.Line;
	verticalTop: THREE.Line;
	verticalBottom: THREE.Line;
};
export type RingData = {
	innerRadius: number;
	outerRadius: number;
	thetaSegments: number;
};
const RING_INIT_DATA: RingData = {
	innerRadius: 0.035,
	outerRadius: 0.0425,
	thetaSegments: 16,
};
export class MapCursor {
	readonly pointLight: THREE.PointLight;
	cursorGroup!: THREE.Group;
	private ringMesh!: THREE.Mesh;
	private ringMaterial!: THREE.MeshBasicMaterial;
	private ringData: RingData = {
		innerRadius: RING_INIT_DATA.innerRadius,
		outerRadius: RING_INIT_DATA.outerRadius,
		thetaSegments: RING_INIT_DATA.thetaSegments,
	};
	private _lines!: CursorLines;
	private quadCorners!: THREE.Group;
	private readonly _cursorMargin = 0.02;

	private scene: THREE.Scene;
	private readonly camera: THREE.Camera;
	private map: Map;
	private _mapHalfWidth: number;
	private _mapHalfHeight: number;
	private _markersGroup: THREE.Group;

	private hoveredMarker: THREE.Object3D | null = null;
	private _lastOveredMarkerPosition = new THREE.Vector3();

	private _enterExitTweenGroup = new TWEEN.Group();

	private _raycaster = new THREE.Raycaster();
	private _onMapPosition = new THREE.Vector3();
	private _magnetizationToMarker = {
		value: 0,
		duration: 500,
	};
	private _mouseScreenPosition = new THREE.Vector2();

	private _isBlocked: boolean = false;

	constructor(scene: THREE.Scene, camera: THREE.Camera, map: Map) {
		this.scene = scene;
		this.camera = camera;
		this.map = map;
		this._mapHalfWidth = map.geometry.parameters.width / 2;
		this._mapHalfHeight = map.geometry.parameters.height / 2;
		this._markersGroup = map.markersGroup;

		this.pointLight = new LegacyPointLight(0xffffff, 3, 0.5);
		this.pointLight.position.z = 0.15;
		this.scene.add(this.pointLight);

		this.initLines();
		this.initCursor();
		this.subscribeOnMouseEvents();
	}

	private initCursor() {
		this.ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.ringMesh = new THREE.Mesh(
			new THREE.RingGeometry(
				RING_INIT_DATA.innerRadius,
				RING_INIT_DATA.outerRadius,
				RING_INIT_DATA.thetaSegments
			),
			this.ringMaterial
		);

		const quadCornerStep = RING_INIT_DATA.outerRadius + this._cursorMargin;
		const quadCornerSize = this._cursorMargin;
		const quadCornerGeometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(quadCornerStep - quadCornerSize, quadCornerStep, 0),
			new THREE.Vector3(quadCornerStep, quadCornerStep, 0),
			new THREE.Vector3(quadCornerStep, quadCornerStep - quadCornerSize, 0),
		]);

		const quadCornerRT = new THREE.Line(
			quadCornerGeometry,
			new THREE.LineBasicMaterial({ color: 0xffffff })
		);

		const quadCornerLT = new THREE.Line().copy(quadCornerRT);
		quadCornerLT.scale.setX(-1);

		const quadCornerRB = new THREE.Line().copy(quadCornerRT);
		quadCornerRB.scale.setY(-1);

		const quadCornerLB = new THREE.Line().copy(quadCornerRT);
		quadCornerLB.scale.setY(-1).setX(-1);

		this.quadCorners = new THREE.Group().add(
			quadCornerRT,
			quadCornerLT,
			quadCornerRB,
			quadCornerLB
		);
		this.cursorGroup = new THREE.Group().add(this.ringMesh, this.quadCorners);
		this.scene.add(this.cursorGroup);
	}

	private initLines() {
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0xe0e0e0 });

		const verticalUpGeometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, this._mapHalfHeight, 0),
			new THREE.Vector3(0, RING_INIT_DATA.outerRadius + this._cursorMargin, 0),
		]);

		const verticalDownGeometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, -(RING_INIT_DATA.outerRadius + this._cursorMargin), 0),
			new THREE.Vector3(0, -this._mapHalfHeight, 0),
		]);

		const horizontalLeftGeometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(-this._mapHalfWidth, 0, 0),
			new THREE.Vector3(-(RING_INIT_DATA.outerRadius + this._cursorMargin), 0, 0),
		]);

		const horizontalRightGeometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(this._mapHalfWidth, 0, 0),
			new THREE.Vector3(RING_INIT_DATA.outerRadius + this._cursorMargin, 0, 0),
		]);

		const cursorLines: CursorLines = {
			horizontalLeft: new THREE.Line(horizontalLeftGeometry, lineMaterial),
			horizontalRight: new THREE.Line(horizontalRightGeometry, lineMaterial),
			verticalTop: new THREE.Line(verticalUpGeometry, lineMaterial),
			verticalBottom: new THREE.Line(verticalDownGeometry, lineMaterial),
		};
		for (const key in cursorLines) {
			this.scene.add((cursorLines as any)[key]);
		}
		this._lines = cursorLines;
	}

	private subscribeOnMouseEvents() {
		document.addEventListener("mousemove", this.onMouseMove, false);
		document.addEventListener("click", this.onMouseClick, false);
	}

	public onMouseMove = (event: MouseEvent) => {
		const mousePosX = event.clientX;
		const mousePosY = event.clientY;
		this._mouseScreenPosition.set(mousePosX, mousePosY);
		_vt.set(
			(mousePosX / window.innerWidth) * 2 - 1,
			-(mousePosY / window.innerHeight) * 2 + 1
		);

		this._raycaster.setFromCamera(_vt, this.camera);

		const mapIntersection = this._raycaster.intersectObject(this.map.mesh)[0];

		mapIntersection != null && this._onMapPosition.copy(mapIntersection.point);

		const markerIntersection = this._raycaster.intersectObjects(
			this._markersGroup.children
		)[0];

		if (markerIntersection == null) {
			this.hoveredMarker != null && this.onMouseExitMarker(this.hoveredMarker);
		} else {
			if (this.hoveredMarker == null) {
				this.onMouseEnterMarker(markerIntersection.object);
			} else {
				if (this.hoveredMarker != markerIntersection.object) {
					this.onMouseExitMarker(this.hoveredMarker);
					this.onMouseEnterMarker(markerIntersection.object);
				}
			}
		}
	};

	public onMouseClick = () => {
		if (this.hoveredMarker == null) return;

		const markerObj = this.hoveredMarker;
		const marker = <Marker>markerObj.userData.marker;
		marker.visualGroup.scale.multiplyScalar(0.5);

		if (marker.isSelected) {
			marker.setSelection(false);
			this.map.backFromMarker();

			console.log("Back from " + marker.data.title);
		} else {
			marker.setSelection(true);
			this.map.goToMarker(markerObj);

			console.log("Go to " + marker.data.title);
		}

		this.onMouseExitMarker(markerObj);

		document.body.style.cursor = "default";
		this._isBlocked = true;
		setTimeout(() => {
			this._isBlocked = false;
		}, Map.zoomDuration);
	};

	public update() {
		this._enterExitTweenGroup.update();
		this.setCursorPositionMagically();
	}

	private setCursorPositionMagically = () => {
		let markerWorldPositionForLerp = new THREE.Vector3();

		if (this.hoveredMarker != null) {
			this.hoveredMarker.getWorldPosition(markerWorldPositionForLerp);
		} else {
			markerWorldPositionForLerp.copy(this._lastOveredMarkerPosition);
		}

		const position = new THREE.Vector3().lerpVectors(
			this._onMapPosition,
			markerWorldPositionForLerp,
			this._magnetizationToMarker.value
		);

		const alpha = 0.15;
		this.cursorGroup.position.lerpVectors(this.cursorGroup.position, position, alpha);

		this._lines.horizontalLeft.position.y = THREE.MathUtils.lerp(
			this._lines.horizontalLeft.position.y,
			position.y,
			alpha
		);
		this._lines.horizontalRight.position.y = this._lines.horizontalLeft.position.y;

		this._lines.verticalTop.position.x = THREE.MathUtils.lerp(
			this._lines.verticalTop.position.x,
			position.x,
			alpha
		);
		this._lines.verticalBottom.position.x = this._lines.verticalTop.position.x;

		// setFromPoints() updates the existing position buffer in place (r170+)
		this._lines.horizontalRight.geometry.setFromPoints([
			new THREE.Vector3(this._mapHalfWidth, 0, 0),
			new THREE.Vector3(
				this._lines.verticalTop.position.x +
					RING_INIT_DATA.outerRadius +
					this._cursorMargin,
				0,
				0
			),
		]);
		this._lines.horizontalLeft.geometry.setFromPoints([
			new THREE.Vector3(-this._mapHalfWidth, 0, 0),
			new THREE.Vector3(
				this._lines.verticalTop.position.x -
					RING_INIT_DATA.outerRadius -
					this._cursorMargin,
				0,
				0
			),
		]);

		this._lines.verticalTop.geometry.setFromPoints([
			new THREE.Vector3(0, this._mapHalfHeight, 0),
			new THREE.Vector3(
				0,
				this._lines.horizontalLeft.position.y +
					RING_INIT_DATA.outerRadius +
					this._cursorMargin,
				0
			),
		]);
		this._lines.verticalBottom.geometry.setFromPoints([
			new THREE.Vector3(0, -this._mapHalfHeight, 0),
			new THREE.Vector3(
				0,
				this._lines.horizontalLeft.position.y -
					RING_INIT_DATA.outerRadius -
					this._cursorMargin,
				0
			),
		]);

		this.pointLight.position.x = this._onMapPosition.x;
		this.pointLight.position.y = this._onMapPosition.y;
	};

	private onMouseEnterMarker = (markerObject: THREE.Object3D): void => {
		if (this._isBlocked) return;

		this.hoveredMarker = markerObject;
		document.body.style.cursor = "pointer";

		const marker = <Marker>markerObject.userData.marker;
		marker.setMouseOveringStyle(true, this._mouseScreenPosition);

		this._enterExitTweenGroup.removeAll();
		this._enterExitTweenGroup = new TWEEN.Group();

		new TWEEN.Tween(this._magnetizationToMarker, this._enterExitTweenGroup)
			.to({ value: 0.9 }, this._magnetizationToMarker.duration)
			.start();

		let tempColor = { hex: this.ringMaterial.color.getHex() };
		new TWEEN.Tween(tempColor, this._enterExitTweenGroup)
			.to(
				{
					hex: new THREE.Color(0x000000).getHex(),
				},
				this._magnetizationToMarker.duration / 2
			)
			.start()
			.onUpdate(() => this.ringMaterial.color.setHex(tempColor.hex));

		this.tweenRingGeometry(0.001, 0.065, 4, this._magnetizationToMarker.duration / 2);
	};

	private onMouseExitMarker = (markerObject: THREE.Object3D): void => {
		if (!this.hoveredMarker) throw "onMarkerExit: hoveredMarker is null";
		this.hoveredMarker.getWorldPosition(this._lastOveredMarkerPosition);
		this.hoveredMarker = null;
		document.body.style.cursor = "default";

		const marker = <Marker>markerObject.userData.marker;
		marker.setMouseOveringStyle(false, this._mouseScreenPosition);

		this._enterExitTweenGroup.removeAll();

		new TWEEN.Tween(this._magnetizationToMarker, this._enterExitTweenGroup)
			.to({ value: 0 }, this._magnetizationToMarker.duration)
			.start();

		let tempColor = { hex: this.ringMaterial.color.getHex() };
		new TWEEN.Tween(tempColor, this._enterExitTweenGroup)
			.to(
				{
					hex: new THREE.Color(0xffffff).getHex(),
				},
				this._magnetizationToMarker.duration / 2
			)
			.start()
			.onUpdate(() => this.ringMaterial.color.setHex(tempColor.hex));

		this.tweenRingGeometry(0.035, 0.0425, 16, this._magnetizationToMarker.duration);
	};

	private tweenRingGeometry = (
		innerRadius: number,
		outerRadius: number,
		thetaSegments: number,
		duration: number
	): void => {
		new TWEEN.Tween(this.ringData, this._enterExitTweenGroup)
			.to({ innerRadius, outerRadius, thetaSegments }, duration)
			.start()
			.onUpdate(() => {
				this.ringMesh.geometry.dispose();
				this.ringMesh.geometry = new THREE.RingGeometry(
					this.ringData.innerRadius,
					this.ringData.outerRadius,
					Math.round(this.ringData.thetaSegments)
				);
			});
	};
}

const _vt = new THREE.Vector2();
