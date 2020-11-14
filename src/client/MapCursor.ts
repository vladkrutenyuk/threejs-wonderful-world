import {
    Scene, Camera, Group, PointLight,
    Mesh, MeshBasicMaterial, Line, LineBasicMaterial,
    RingGeometry, PlaneGeometry, BufferGeometry,
    Raycaster, Vector2, Vector3, MathUtils
} from "/build/three.module.js";
import {TWEEN} from "/jsm/libs/tween.module.min";

export class MapCursor {
    private _cursor: Group = new Group();
    private _ring: Mesh;
    private _light: PointLight;
    private _verticalLine: Line;
    private _horizontalLine: Line;

    private _scene: Scene;
    private _camera: Camera;
    private _mapMesh: Mesh;

    private _raycaster: Raycaster = new Raycaster();
    private _mapPosition: Vector3 = new Vector3();

    constructor(scene: Scene, camera: Camera, mapMesh: Mesh) {
        this._scene = scene;
        this._camera = camera;
        this._mapMesh = mapMesh;
        this.init();
    } 

    private init = (): void => {
        this._light = new PointLight(0xffffff, 3, 0.5)
        this._light.position.z = 0.15;

        this._ring = new Mesh(
            new RingGeometry(0.035,0.0425,16),
            new MeshBasicMaterial({ color: 0xffffff }));

        this._cursor.add(this._ring);
        this._scene.add(this._cursor, this._light);

        const planeGeometry = <PlaneGeometry>this._mapMesh.geometry;
        const lineMaterial = new LineBasicMaterial({ color: 0xd0d0d0 });

        const lineVerticalGeometry = new BufferGeometry().setFromPoints([
            new Vector3(0,  planeGeometry.parameters.height / 2, 0),
            new Vector3(0, -planeGeometry.parameters.height / 2, 0)]);
        this._verticalLine = new Line(lineVerticalGeometry, lineMaterial);

        const lineHorizontalGeometry = new BufferGeometry().setFromPoints([
            new Vector3(planeGeometry.parameters.width / 2, 0, 0),
            new Vector3(-planeGeometry.parameters.width / 2, 0, 0)]);
        this._horizontalLine = new Line(lineHorizontalGeometry, lineMaterial);

        this._scene.add(this._horizontalLine, this._verticalLine);
    }

    public positioning = (mousePosition: Vector2): void => {
        this.setCursorPositionMagically();
        const mouseCoords = {
            x: (mousePosition.x / window.innerWidth) * 2 - 1,
            y: -(mousePosition.y / window.innerHeight) * 2 + 1
        };

        this._raycaster.setFromCamera(mouseCoords, this._camera);

        const mapIntersection = this._raycaster.intersectObject(this._mapMesh)[0];

        if (mapIntersection == null) {
            return;
        } else {
            this._mapPosition.copy(mapIntersection.point);
        }

        // если пересечение с маркером - onMarkerEnter
    }

    private setCursorPositionMagically = (): void => {
        const position = new Vector3().lerpVectors(this._mapPosition, new Vector3(0 ,0 ,0), 0);
        const alpha = 0.15;

        this._cursor.position.lerpVectors(this._cursor.position, position, alpha);
        this._horizontalLine.position.y = MathUtils.lerp(this._horizontalLine.position.y, position.y, alpha);
        this._verticalLine.position.x = MathUtils.lerp(this._verticalLine.position.x, position.x, alpha);

        this._light.position.x = this._mapPosition.x;
        this._light.position.y = this._mapPosition.y;
    }

    // public onMarkerEnter() {
    //
    // }
    //
    // public createMarker() {
    //
    // }

    // const raycaster = new Raycaster()
    // let isMouseOverMarker : boolean = false
    // let lerpToMarker = { value: 0 }
    // let worldPosMarker: Vector3 = new Vector3().setScalar(0)
    //
    // const divInfo = document.getElementById('info');
    // document.addEventListener('mousemove', onMouseMove, false)
    //
    // function onMouseMove(event: MouseEvent)  {
    //     const mousePos = {
    //         x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    //         y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    //     }
    //
    //     raycaster.setFromCamera(mousePos, camera)
    //
    //     const planeIntersect = raycaster.intersectObject(planeMesh);
    //     const markerIntersects = raycaster.intersectObjects(markersGroup.children);
    //
    //     if (planeIntersect.length > 0) {
    //         ringSight.position.copy(planeIntersect[0].point);
    //         lineHorizontal.position.y = ringSight.position.y;
    //         lineVertical.position.x = ringSight.position.x;
    //         sightLight.position.y = ringSight.position.y;
    //         sightLight.position.x = ringSight.position.x;
    //     }
    //
    //     if (markerIntersects.length > 0) {
    //         new TWEEN.Tween(lerpToMarker).to({value: 0.9}, 250).start().onUpdate(() => {
    //             ringSight.position.lerpVectors(planeIntersect[0].point, worldPosMarker, lerpToMarker.value);
    //             lineHorizontal.position.y = MathUtils.lerp(ringSight.position.y, worldPosMarker.y, lerpToMarker.value);
    //             lineVertical.position.x = MathUtils.lerp(ringSight.position.x, worldPosMarker.x, lerpToMarker.value);
    //         })
    //         markerIntersects[0].object.getWorldPosition(worldPosMarker)
    //
    //         if (!isMouseOverMarker) {
    //             new TWEEN.Tween(ringSight.scale).to(new Vector3().setScalar(1.2), 250).start()
    //             regenerateRingSightGeometry(0.005)
    //             isMouseOverMarker = true
    //             divInfo.innerHTML = "point: " + worldPosMarker.x.toString().slice(0, 5) + " ; " + worldPosMarker.y.toString().slice(0, 5)
    //         }
    //     }
    //     else {
    //         if (isMouseOverMarker){
    //             new TWEEN.Tween(lerpToMarker).to({value: 0}, 300).start().onUpdate(() => {
    //                 ringSight.position.lerpVectors(planeIntersect[0].point, ringSight.position, lerpToMarker.value);
    //                 lineHorizontal.position.y = MathUtils.lerp(ringSight.position.y, worldPosMarker.y, lerpToMarker.value);
    //                 lineVertical.position.x = MathUtils.lerp(ringSight.position.x, worldPosMarker.x, lerpToMarker.value);
    //             })
    //             new TWEEN.Tween(ringSight.scale).to(new Vector3().setScalar(1), 150).start()
    //             regenerateRingSightGeometry(0.035)
    //             divInfo.innerHTML = "";
    //             isMouseOverMarker = false
    //         }
    //     }
    // }
    //
    // function regenerateRingSightGeometry(newInnerRadius: number) {
    //     new TWEEN.Tween(ringSightData)
    //         .to({innerRadius: newInnerRadius}, 350)
    //         .start()
    //         .onUpdate(() => {
    //             ringSight.geometry.dispose();
    //             ringSight.geometry = new THREE.RingGeometry(
    //                 ringSightData.innerRadius, ringSightData.outerRadius, ringSightData.thetaSegments)
    //         })
    // }
}