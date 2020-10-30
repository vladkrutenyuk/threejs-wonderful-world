import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import { TWEEN } from '/jsm/libs/tween.module.min'

import { Group, Vector3, Scene, Color, PerspectiveCamera, WebGLRenderer, Mesh, AxesHelper, Material, IcosahedronGeometry, MeshBasicMaterial, Texture, TextureLoader, CubeTextureLoader, DirectionalLight, Vector2, PlaneGeometry, Object3D, RingGeometry, Raycaster, PointLight, OrthographicCamera, CylinderGeometry, ConeBufferGeometry, Vector, GridHelper, Line, LineBasicMaterial, BufferGeometry, SphereGeometry} from '/build/three.module.js'

const scene: Scene = new Scene()
scene.background = new Color(0x101010)

const camera: PerspectiveCamera = new PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 150)

const renderer: WebGLRenderer = new WebGLRenderer({ antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = new PointLight(0xffffff, 1.5);
light.position.set(0, 5, 10);
scene.add(light);

const sightLight = new PointLight(0xffffff, 3, 0.5);
sightLight.position.z = 0.15
scene.add(sightLight);

const controls = new OrbitControls(camera, renderer.domElement)
controls.addEventListener('change', render)

fetch("shaders/fragment.glsl")
    .then( r => r.text() )
    .then( t => console.log(t))
fetch("shaders/vertex.glsl")
    .then( r => r.text() )
    .then( t => console.log(t))

const vshader: string = ""
const fshader: string = ""

// const obj = new Mesh(new BoxGeometry(), new ShaderMaterial({
//     vertexShader: vshader,
//     fragmentShader: fshader
// }))

const planeGeometry = new PlaneGeometry(
    3.6,
    1.8,
    140,
    70
)

const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
    map: new TextureLoader().load("img/world_color.jpg"),
    specularMap: new TextureLoader().load("img/world_specular.jpg"),
    displacementMap: new TextureLoader().load("img/world_height.jpg"),
    displacementBias: -0.25,
    displacementScale: 0.75,
    wireframe: true,
    transparent: true,
    opacity: 0.6
})

planeMaterial.map.center.set(.5, .5);

const planeMesh: Mesh = new Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

const linesOffsetZ = 0
const lineVertGeom = new BufferGeometry().setFromPoints([
    new Vector3(0, planeGeometry.parameters.height / 2, linesOffsetZ),
    new Vector3(0, -planeGeometry.parameters.height / 2, linesOffsetZ)
]);

const lineVertical = new Line(lineVertGeom, new LineBasicMaterial({ color: 0xffffff }));
scene.add(lineVertical);

const lineHorizGeom = new BufferGeometry().setFromPoints([
    new Vector3(planeGeometry.parameters.width / 2, 0, linesOffsetZ),
    new Vector3(-planeGeometry.parameters.width / 2, 0, linesOffsetZ)
]);

const lineHorizontal = new Line(lineHorizGeom, new LineBasicMaterial({ color: 0xffffff }));
scene.add(lineHorizontal);

camera.position.set(0, 0.2, 2)
camera.lookAt(0, 0, 0)

function onKeyDown(event) {
    const step: number = 0.005

    switch (event.keyCode) {
        case 87: // w
            moveMap(0, step)
            break;
        case 65: // a
            moveMap(-step, 0)
            break;
        case 83: // s
            moveMap(0, -step)
            break;
        case 68: // d
            moveMap(step, 0)
            break;
        case 81: // q
            scaleMap(step)
            break;
        case 69: // e
            scaleMap(-step)
            break;
    }

}

let markersGroup = new Group();

scene.add(markersGroup)

function getMapScale() {
    return 1 / planeMaterial.map.repeat.x
}

function getOffsetLimit() {
    let limit = (getMapScale() * 0.5 - 0.5) / getMapScale()
    return limit
}

function moveMap(stepX: number, stepY: number) {
    planeMaterial.map.offset
        .set(planeMaterial.map.offset.x + stepX, planeMaterial.map.offset.y + stepY)

    fixOffsetMap()
}

function scaleMap(step: number) {
    planeMaterial.map.repeat.addScalar(step).clampScalar(0.1, 1)

    fixOffsetMap()

    markersGroup.scale.setScalar(getMapScale())
}

function fixOffsetMap() {
    planeMaterial.map.offset.clampScalar(-getOffsetLimit(), getOffsetLimit())

    markersGroup.position.x = -planeMaterial.map.offset.x * planeGeometry.parameters.width * getMapScale()
    markersGroup.position.y = -planeMaterial.map.offset.y * planeGeometry.parameters.height * getMapScale()
}

document.addEventListener('keydown', onKeyDown, false);

let ringSightData = {
    innerRadius: 0.03,
    outerRadius: 0.05,
    thetaSegments: 16
}

const ringSight = new Mesh(
    new RingGeometry(
        ringSightData.innerRadius, ringSightData.outerRadius, ringSightData.thetaSegments
    )
    , new MeshBasicMaterial({
        color: new Color(0xffffff),
        transparent: true
        }
    )
)

scene.add(ringSight)
const raycaster = new Raycaster()
let isMouseOverMarker : boolean = false
let lerpToMarker = { value: 0 }
let worldPosMarker: Vector3 = new Vector3().setScalar(0)

const divInfo = document.getElementById('info');
document.addEventListener('mousemove', onMouseMove, false)


function onMouseMove(event: MouseEvent) {
    const mousePos = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mousePos, camera)

    const planeIntersect = raycaster.intersectObject(planeMesh);
    const markerIntersects = raycaster.intersectObjects(markersGroup.children)

    if (planeIntersect.length > 0) {
        ringSight.position.copy(planeIntersect[0].point)
        lineHorizontal.position.y = ringSight.position.y
        lineVertical.position.x = ringSight.position.x
        sightLight.position.y = ringSight.position.y
        sightLight.position.x = ringSight.position.x
    }

    if (markerIntersects.length > 0) {
        new TWEEN.Tween(lerpToMarker).to({value: 0.95}, 250).start()
        markerIntersects[0].object.getWorldPosition(worldPosMarker)

        if (!isMouseOverMarker) {
            new TWEEN.Tween(ringSight.scale).to(new Vector3().setScalar(1.2), 250).start()
            regenerateRingSightGeometry(0.045)
            isMouseOverMarker = true
            divInfo.innerHTML = "point: " + worldPosMarker.x.toString().slice(0, 5) + " ; " + worldPosMarker.y.toString().slice(0, 5)
        }
    }
    else {
        if (isMouseOverMarker){
            new TWEEN.Tween(lerpToMarker).to({value: 0}, 300).start()
            new TWEEN.Tween(ringSight.scale).to(new Vector3().setScalar(1), 150).start()
            regenerateRingSightGeometry(0.03)
            divInfo.innerHTML = "";
            isMouseOverMarker = false
        }
    }

    ringSight.position.lerpVectors(ringSight.position, worldPosMarker, lerpToMarker.value)
}

function regenerateRingSightGeometry(newInnerRadius: number) {
    new TWEEN.Tween(ringSightData)
        .to({innerRadius: newInnerRadius}, 350)
        .start()
        .onUpdate(() => {
            ringSight.geometry.dispose();
            ringSight.geometry = new THREE.RingGeometry(
                ringSightData.innerRadius, ringSightData.outerRadius, ringSightData.thetaSegments)
        })
}

document.addEventListener('dblclick', onDoubleClick, false)

function onDoubleClick(event: MouseEvent) {
    const mousePos = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mousePos, camera)
    const intersect = raycaster.intersectObject(planeMesh)[0];

    const marker = new Mesh(
        new SphereGeometry(0.08),
        new MeshBasicMaterial({
            color: new Color(1 ,1 ,1),
            visible: false
        })
    )
    const markerVisual = new Mesh(
        new SphereGeometry(0.02),
        new MeshBasicMaterial({
            color: new Color(1 ,1 ,1),
            transparent: false
        })
    )
    marker.position.copy(intersect.point)
    marker.scale.setScalar(0)
    scene.add(marker)
    scene.add(markerVisual)
    markerVisual.parent = marker
    new TWEEN.Tween(marker.scale)
        .to(new Vector3().setScalar(1), 500)
        .easing(TWEEN.Easing.Back.Out)
        .start()
        .onComplete(() => markersGroup.add(marker))

    new TWEEN.Tween(ringSight.scale).to(new Vector3().setScalar(0), 350).easing(TWEEN.Easing.Back.InOut).start().onComplete(resetRing)
    new TWEEN.Tween(ringSight.material).to( {opacity: 0} , 350).easing(TWEEN.Easing.Cubic.InOut).start()
    new TWEEN.Tween(sightLight.position).to( {z: 0} , 350).easing(TWEEN.Easing.Back.InOut).start()
}

function resetRing() {
    new TWEEN.Tween(ringSight.scale).to(new Vector3().setScalar(1), 150).easing(TWEEN.Easing.Back.Out).start()
    new TWEEN.Tween(ringSight.material).to( {opacity: 1} , 300).easing(TWEEN.Easing.Back.Out).start()
    new TWEEN.Tween(sightLight.position).to( {z: 0.15} , 250).easing(TWEEN.Easing.Back.InOut).start()
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function animate() {
    requestAnimationFrame(animate)
    TWEEN.update()
    render()
}

function render() {
    renderer.render(scene, camera)
}

animate()