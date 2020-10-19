import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { GUI } from '/jsm/libs/dat.gui.module'

import { Vector3, Scene, Color, PerspectiveCamera, WebGLRenderer, Mesh, AxesHelper, Material, IcosahedronGeometry, MeshBasicMaterial, Texture, TextureLoader, CubeTextureLoader, DirectionalLight, Vector2, PlaneGeometry, Object3D, RingGeometry, Raycaster, PointLight, OrthographicCamera, CylinderGeometry, ConeBufferGeometry, Vector} from '/build/three.module.js'

const scene: Scene = new Scene()    
scene.background = new Color(0x101010)

const camera: PerspectiveCamera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 150)

const renderer: WebGLRenderer = new WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = new PointLight(0xffffff, 2);
light.position.set(0, 5, 10);
scene.add(light);

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
    center: new Vector2(.5, .5)
} 

const planeMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial()

planeMaterial.map = planeMatData.map
planeMaterial.specularMap = planeMatData.specularMap
planeMaterial.displacementMap = planeMatData.displacementMap
planeMaterial.displacementBias = planeMatData.displacementBias
planeMaterial.displacementScale = planeMatData.displacementScale
planeMaterial.wireframe = planeMatData.wireframe
planeMaterial.map.center = planeMatData.center

const planeMesh: Mesh = new Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

camera.position.set(0, -0.5, 2.5)
camera.lookAt(0, 0, 0)

const stats = Stats()
document.body.appendChild(stats.dom)

const columnsParent = new Mesh()
scene.add(columnsParent)

var columns : Mesh[] = new Array()

// const gui = new GUI()
// const folder = gui.addFolder("Columns Parent")
// var scale = { scale: 1,}
// folder.add(columnsParent.position, "x", -4, 4, 0.01)
// folder.add(columnsParent.position, "y", -4, 4, 0.01)
// folder.add(columnsParent.position, "z", -4, 4, 0.01)
// folder.add(columnsParent.scale, "x", 1, 10, 0.01)
// folder.add(columnsParent.scale, "y", 1, 10, 0.01)
// folder.add(columnsParent.scale, "z", 1, 10, 0.01)
// folder.open()

function onKeyDown (event) {
    const step : number = 0.015
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
};

function moveMap(step : Vector2) {
    if (planeMaterial.map.center.x + step.x < 0 || planeMaterial.map.center.x + step.x > 1) {
        return
    }
    if (planeMaterial.map.center.y + step.y < 0 || planeMaterial.map.center.y + step.y > 1) {
        return
    }

    planeMaterial.map.center.x += step.x * planeMaterial.map.repeat.x;
    planeMaterial.map.center.y += step.y * planeMaterial.map.repeat.x;
    
    columnsParent.position.x = -(planeMaterial.map.center.x - 0.5) / planeMaterial.map.repeat.x
    columnsParent.position.y = -(planeMaterial.map.center.y - 0.5) / planeMaterial.map.repeat.y

    // for (let i = 0; i < columns.length; i++) {
    //     var column = columns[i]

    //     column.position.x -= step.x * planeData.width / planeMaterial.map.repeat.x
    //     column.position.y -= step.y * planeData.height / planeMaterial.map.repeat.x

    //     var isHidden: boolean = Math.abs(column.position.x) > planeData.width / 2 || Math.abs(column.position.y) > planeData.height / 2
    //     column.visible = !isHidden
    // }
}

function scaleMap(step: number) {

    var repeatX = planeMaterial.map.repeat.x
    if (repeatX + step < 0.1 || repeatX + step > 1) {
        return
    }   
    planeMaterial.map.repeat.addScalar(step)

    columnsParent.scale.set(1 / planeMaterial.map.repeat.x, 1 / planeMaterial.map.repeat.y, 1)

    // for (let i = 0; i < columns.length; i++) {
    //     var column = columns[i]

    //     var divider = 1 / (repeatX - step)

    //     column.position.divideScalar(divider).multiplyScalar(1 / repeatX)
    //     column.position.z = 0.1

    //     var isHidden: boolean = Math.abs(column.position.x) > planeData.width / 2 || Math.abs(column.position.y) > planeData.height / 2
    //     column.visible = !isHidden
    // }
}

document.addEventListener('keydown', onKeyDown, false);

const ringSightData = {
    innerRadius : 0.03,
    outerRadius : 0.05, 
    thetaSegments : 16
}

const ringGeom = new RingGeometry( ringSightData.innerRadius, ringSightData.outerRadius, ringSightData.thetaSegments)
const ringMat = new MeshBasicMaterial( {color: new Color(0xff0000)} )
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
}

const columnData = {
    radiusTop : 0.008,
    radiusBottom : 0.003, 
    height : 0.4
}

document.addEventListener('dblclick', onDoubleClick, false)

function onDoubleClick(event: MouseEvent) {
    var mousePos = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }

    raycaster.setFromCamera(mousePos, camera)
    var intersect = raycaster.intersectObject(planeMesh);
    
    const column = new Mesh(
        new CylinderGeometry(columnData.radiusTop, columnData.radiusBottom, columnData.height),
        new MeshBasicMaterial( {color: 0xff0000} )
    )

    column.position.copy(intersect[0].point)
    column.rotation.x = Math.PI / 2
    column.position.z += 0.1;

    columns.push(column)
    scene.add(column)
    column.parent = columnsParent;
    console.log("Added new column: " + column.position.x)
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function animate () {
    requestAnimationFrame(animate)

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate();