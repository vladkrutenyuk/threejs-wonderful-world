import * as THREE from '/build/three.module.js'
import {
    Camera,
    Color, Group, Material,
    Mesh,
    MeshBasicMaterial,
    PointLight,
    Raycaster,
    RingGeometry,
    Scene,
    Vector2
} from "/build/three.module.js";
import {TWEEN} from "/jsm/libs/tween.module.min";

export class MapCursor {
    private _cursor: Group;
    private _ring: Mesh;
    private _ringGeometry: RingGeometry;
    private _ringMaterial: Material;
    private _light: PointLight;

    private _scene: Scene;
    private _camera: Camera;
    private _mapMesh: Mesh;

    private _raycaster: Raycaster = new Raycaster();

    constructor(scene: Scene, camera: Camera, mapMesh: Mesh) {
        this._scene = scene;
        this._camera = camera;
        this._mapMesh = mapMesh;
        this.init();
    }

    private init = (): void => {
        this._cursor = new Group();

        this._light = new PointLight(0xffffff, 3, 0.5)
        this._light.position.z = 0.15;
        this._cursor.add(this._light);

        this._ringGeometry = new RingGeometry(0.035,0.0425,16);
        this._ringMaterial = new MeshBasicMaterial({ color: 0xffffff });
        this._ring = new Mesh(this._ringGeometry, this._ringMaterial);
        this._cursor.add(this._ring);

        this._scene.add(this._cursor);
    }

    public positioning = (mousePosition: Vector2): void => {
        const mouseCoords = {
            x: (mousePosition.x / window.innerWidth) * 2 - 1,
            y: -(mousePosition.y / window.innerHeight) * 2 + 1
        };

        this._raycaster.setFromCamera(mouseCoords, this._camera);

        const mapIntersection = this._raycaster.intersectObject(this._mapMesh)[0];

        if (mapIntersection == null) return;

        this._cursor.position.copy(mapIntersection.point);
        // выпускаем райкаст по этим координатам
        // если пересечение с плейном - обновляем позицию прицела
        // если пересечение с маркером - onMarkerEnter
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