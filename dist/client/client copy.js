import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
import { GUI } from '/jsm/libs/dat.gui.module';
import { Vector3, Scene, Color, PerspectiveCamera, WebGLRenderer, Mesh, AxesHelper, IcosahedronGeometry, MeshBasicMaterial } from '/build/three.module.js';
const scene = new Scene();
scene.background = new Color(0xF2F2F2);
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var axes = new AxesHelper(.5);
scene.add(axes);
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
const sphereGeometry = new THREE.SphereGeometry;
const sphereMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
const sphere = new Mesh(sphereGeometry, sphereMat);
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
const cube = new Mesh(cubeGeometry, cubeMaterial);
const icoGeometry = new IcosahedronGeometry;
const icoMat = new MeshBasicMaterial();
const ico = new Mesh(icoGeometry, icoMat);
// const icoTex = new TextureLoader().load("img/abstractGenerativeTexture.png")
// icoMat.map = icoTex;
const icoEnvTex = new THREE.CubeTextureLoader().load(["img/px_50.png", "img/nx_50.png", "img/py_50.png", "img/ny_50.png", "img/pz_50.png", "img/nz_50.png"]);
icoEnvTex.mapping = THREE.CubeRefractionMapping;
icoMat.envMap = icoEnvTex;
scene.add(ico, cube, sphere);
sphere.position.add(new Vector3(1, 0.6, 0.1));
sphere.scale.multiplyScalar(0.5);
sphere.parent = cube;
ico.position.x -= 3;
camera.position.z = 3;
const stats = Stats();
document.body.appendChild(stats.dom);
const gui = new GUI();
var data = {
    color: icoMat.color.getHex()
};
const icoMatFolder = gui.addFolder("Ico MeshBasicMaterial");
icoMatFolder.addColor(data, "color").onChange(() => {
    icoMat.color.setHex(Number(data.color.toString().replace('#', '0x')));
});
icoMatFolder.add(icoMat, "wireframe");
const cubeFolder = gui.addFolder("Cube");
const rotFolder = cubeFolder.addFolder("Rotation");
rotFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.01);
rotFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.01);
rotFolder.add(cube.rotation, "z", 0, Math.PI * 2, 0.01);
cubeFolder.open();
const posFolder = cubeFolder.addFolder("Position");
posFolder.add(cube.position, "x", -3, 3, 0.01);
posFolder.add(cube.position, "y", -3, 3, 0.01);
posFolder.add(cube.position, "z", -3, 3, 0.01);
const scaleFolder = cubeFolder.addFolder("Scale");
scaleFolder.add(cube.scale, "x", -3, 3, 0.01);
scaleFolder.add(cube.scale, "y", -3, 3, 0.01);
scaleFolder.add(cube.scale, "z", -3, 3, 0.01);
cubeFolder.add(cube, "visible", true);
var cubeData = {
    width: 1,
    height: 1,
    depth: 1,
    widthSegments: 1,
    heightSegments: 1,
    depthSegments: 1
};
const cubePropertiesFolder = cubeFolder.addFolder("Properties");
cubePropertiesFolder.add(cubeData, 'width', 1, 30).onChange(regenerateBoxGeometry).onFinishChange(() => console.dir(cube.geometry));
cubePropertiesFolder.add(cubeData, 'height', 1, 30).onChange(regenerateBoxGeometry);
cubePropertiesFolder.add(cubeData, 'depth', 1, 30).onChange(regenerateBoxGeometry);
cubePropertiesFolder.add(cubeData, 'widthSegments', 1, 30).onChange(regenerateBoxGeometry);
cubePropertiesFolder.add(cubeData, 'heightSegments', 1, 30).onChange(regenerateBoxGeometry);
cubePropertiesFolder.add(cubeData, 'depthSegments', 1, 30).onChange(regenerateBoxGeometry);
function regenerateBoxGeometry() {
    let newGeometry = new THREE.BoxGeometry(cubeData.width, cubeData.height, cubeData.depth, cubeData.widthSegments, cubeData.heightSegments, cubeData.depthSegments);
    cube.geometry.dispose();
    cube.geometry = newGeometry;
}
var sphereData = {
    radius: 1,
    widthSegments: 8,
    heightSegments: 6,
    phiStart: 0,
    phiLength: Math.PI * 2,
    thetaStart: 0,
    thetaLength: Math.PI
};
const sphereFolder = gui.addFolder("Sphere");
const spherePropertiesFolder = sphereFolder.addFolder("Properties");
spherePropertiesFolder.add(sphereData, 'radius', .1, 30).onChange(regenerateSphereGeometry);
spherePropertiesFolder.add(sphereData, 'widthSegments', 1, 32).onChange(regenerateSphereGeometry);
spherePropertiesFolder.add(sphereData, 'heightSegments', 1, 16).onChange(regenerateSphereGeometry);
spherePropertiesFolder.add(sphereData, 'phiStart', 0, Math.PI * 2).onChange(regenerateSphereGeometry);
spherePropertiesFolder.add(sphereData, 'phiLength', 0, Math.PI * 2).onChange(regenerateSphereGeometry);
spherePropertiesFolder.add(sphereData, 'thetaStart', 0, Math.PI).onChange(regenerateSphereGeometry);
spherePropertiesFolder.add(sphereData, 'thetaLength', 0, Math.PI).onChange(regenerateSphereGeometry);
function regenerateSphereGeometry() {
    let newGeometry = new THREE.SphereGeometry(sphereData.radius, sphereData.widthSegments, sphereData.heightSegments, sphereData.phiStart, sphereData.phiLength, sphereData.thetaStart, sphereData.thetaLength);
    sphere.geometry.dispose();
    sphere.geometry = newGeometry;
}
function render() {
    renderer.render(scene, camera);
}
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix;
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    sphere.rotation.y += 0.02;
    controls.update();
    render();
    stats.update();
}
animate();
