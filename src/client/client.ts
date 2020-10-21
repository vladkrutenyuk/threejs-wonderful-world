import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { GUI } from '/jsm/libs/dat.gui.module'
import { TWEEN } from '/jsm/libs/tween.module.min'

import { Vector3, Scene, Color, PerspectiveCamera, WebGLRenderer, Mesh, AxesHelper, Material, IcosahedronGeometry, MeshBasicMaterial, Texture, TextureLoader, CubeTextureLoader, DirectionalLight, Vector2, PlaneGeometry, Object3D, RingGeometry, Raycaster, PointLight, OrthographicCamera, CylinderGeometry, ConeBufferGeometry, Vector, GridHelper, Line, LineBasicMaterial, BufferGeometry } from '/build/three.module.js'

const scene: Scene = new Scene()
scene.background = new Color(0x101010)

const camera: PerspectiveCamera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 150)

const renderer: WebGLRenderer = new WebGLRenderer({ antialias: true })
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

var planeData = {
    width: 3.6,
    height: 1.8,
    widthSegments: 140,
    heightSegments: 70
};

const planeGeometry = new PlaneGeometry(
    planeData.width,
    planeData.height,
    planeData.widthSegments,
    planeData.heightSegments
)

var planeMatData = {
    map: new TextureLoader().load("img/world_color.jpg"),
    specularMap: new TextureLoader().load("img/world_specular.jpg"),
    displacementMap: new TextureLoader().load("img/world_height.jpg"),
    displacementBias: -0.25,
    displacementScale: 0.75,
    wireframe: true,
    center: new Vector2(.5, .5),
    transparent: true,
    opacity: 0.6
}

const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial(planeMatData)

const planeMesh: Mesh = new Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

let linesOffsetZ = 0
var lineVertGeom = new BufferGeometry().setFromPoints([
    new Vector3(0, planeData.height / 2, linesOffsetZ),
    new Vector3(0, -planeData.height / 2, linesOffsetZ)
]);

var lineVertical = new Line(lineVertGeom, new LineBasicMaterial({ color: 0xffffff }));
scene.add(lineVertical);

var lineHorizGeom = new BufferGeometry().setFromPoints([
    new Vector3(planeData.width / 2, 0, linesOffsetZ),
    new Vector3(-planeData.width / 2, 0, linesOffsetZ)
]);

var lineHorizontal = new Line(lineHorizGeom, new LineBasicMaterial({ color: 0xffffff }));
scene.add(lineHorizontal);

camera.position.set(0, 0.2, 2)
camera.lookAt(0, 0, 0)

// const stats = Stats()
// document.body.appendChild(stats.dom)

// const gui = new GUI()
// const folder = gui.addFolder("Columns Parent")
// folder.add(columnsParent.position, "x", -4, 4, 0.01)

function onKeyDown(event) {
    const step: number = 0.015
    switch (event.keyCode) {
        case 87: // w
            moveMap(new Vector2(0, step))
            break;
        case 65: // a
            moveMap(new Vector2(-step, 0))
            break;
        case 83: // s
            moveMap(new Vector2(0, -step))
            break;
        case 68: // d
            moveMap(new Vector2(step, 0))
            break;
        case 81: // q
            scaleMap(step)
            break;
        case 69: // e
            scaleMap(-step)
            break;
    }

    // const div = document.getElementById('help-container');

    // div.innerHTML = event.keyCode;
};

function moveMap(step: Vector2) {
    if (planeMaterial.map.center.x + step.x < 0 || planeMaterial.map.center.x + step.x > 1) {
        return
    }
    if (planeMaterial.map.center.y + step.y < 0 || planeMaterial.map.center.y + step.y > 1) {
        return
    }

    planeMaterial.map.center.x += step.x * planeMaterial.map.repeat.x;
    planeMaterial.map.center.y += step.y * planeMaterial.map.repeat.x;
}

function scaleMap(step: number) {

    var repeatX = planeMaterial.map.repeat.x
    if (repeatX + step < 0.1 || repeatX + step > 1) {
        return
    }
    planeMaterial.map.repeat.addScalar(step)
}

document.addEventListener('keydown', onKeyDown, false);

const ringSightData = {
    innerRadius: 0.03,
    outerRadius: 0.05,
    thetaSegments: 16
}

const ringGeom = new RingGeometry(ringSightData.innerRadius, ringSightData.outerRadius, ringSightData.thetaSegments)
const ringMat = new MeshBasicMaterial({ color: new Color(0xffffff), transparent: true })
const ringSight = new Mesh(ringGeom, ringMat)
scene.add(ringSight)

var raycaster = new Raycaster()

document.addEventListener('mousemove', onMouseMove, false)

function onMouseMove(event: MouseEvent) {
    var mousePos = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mousePos, camera)
    var intersect = raycaster.intersectObject(planeMesh);
    ringSight.position.copy(intersect[0].point)

    lineHorizontal.position.y = ringSight.position.y
    lineVertical.position.x = ringSight.position.x

    sightLight.position.y = ringSight.position.y
    sightLight.position.x = ringSight.position.x
}

document.addEventListener('dblclick', onDoubleClick, false)

function onDoubleClick(event: MouseEvent) {
    var mousePos = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mousePos, camera)
    var intersect = raycaster.intersectObject(planeMesh)[0];

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

    // stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate();