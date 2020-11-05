import * as THREE from '/build/three.module.js'
import {Color, Mesh, MeshBasicMaterial, PointLight, RingGeometry, Scene} from "/build/three.module.js";
import {TWEEN} from "/jsm/libs/tween.module.min";

class Crosshair {
    private ringParameters: {
        innerRadius: 0.035,
        outerRadius: 0.0425,
        thetaSegments: 16,
        color: 0xffffff
    }

    private lightSettings: {
        color: 0xffffff,
        intensity: 3,
        distance: 0.5
    }

    private scene: Scene;
    private sightLight: PointLight;
    private ring: Mesh;

    private isInitialized: boolean = false;

    constructor(scene: Scene, mapWidth: number, mapHeight: number) {
        this.scene = scene;
    }

    public Init() {
        this.sightLight = new PointLight(
            this.lightSettings.color,
            this.lightSettings.intensity,
            this.lightSettings.distance
        );
        this.sightLight.position.z = 0.15;
        this.scene.add(this.sightLight);

        this.ring = new Mesh(
            new RingGeometry(
                this.ringParameters.innerRadius,
                this.ringParameters.outerRadius,
                this.ringParameters.thetaSegments),
            new MeshBasicMaterial({
                color: this.ringParameters.color
            })
        );
        this.scene.add(this.ring);
    }

    public Update() {
        if (!this.isInitialized) return;


    }

    public OnMarkerEnter() {

    }

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