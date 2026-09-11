import { GUI } from 'dat.gui'
import { Color, GridHelper, Mesh, PlaneGeometry, ShaderMaterial, TextureLoader, Timer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { setElementVisibility } from '../helpers/set-element-visibility'
import { World } from '../modules/World'

setElementVisibility(document.querySelector('.header') as HTMLElement, false)
setElementVisibility(document.querySelector('.footer') as HTMLElement, false)

const world = new World()
world.scene.background = new Color(0x000000)
world.controls.dispose()
world.controls = new OrbitControls(world.camera, world.renderer.domElement)
world.controls.maxDistance = 50
world.controls.minDistance = 0
const timer = new Timer()
const textureLoader = new TextureLoader()
const mapGeometry = new PlaneGeometry(3.6, 1.8, 140 * 1.3, 70 * 1.3)

const uniforms = {
	u_time: { value: 0.0 },
	u_displacementMap: { value: textureLoader.load('img/world_height.jpg') },
	u_displacementScale: { value: 0.45 },
	u_displacementBias: { value: -0.25 },
	u_waterMaskMap: { value: textureLoader.load('img/world_specular.jpg') },
	u_waterGradSpread: { value: 9.9 }, //8.8
	u_waterGradOrigin: { value: 1.91 }, //1.7
	u_waterGradMap: { value: textureLoader.load('img/water_grad.png') },
    u_wireframeMode: { value: 0 }
}

const gui = new GUI()
gui.add(uniforms.u_waterGradSpread, 'value', -5, 10).name('u_waterGradSpread')
gui.add(uniforms.u_waterGradOrigin, 'value', -5, 5).name('u_waterGradOrigin')

const mapMaterial = new ShaderMaterial({
	vertexShader: /*glsl*/ `
        uniform float u_time;
        uniform sampler2D u_displacementMap;
        uniform float u_displacementScale;
        uniform float u_displacementBias;

        varying vec2 v_uv;
        varying vec3 v_localPos;
        varying float v_waterMask;
        
        float random(in vec2 st) {
            return fract(sin(dot(st.xy,vec2(12.9898,78.233))) * 43758.5453123);
        }
    
        float noise(in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
    
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
    
            vec2 u = f*f*(3.0-2.0*f);
    
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            v_uv = uv;

            vec3 transformed = vec3(position);
            // transformed += normalize(normal) * texture2D( u_displacementMap, uv ).x * u_displacementScale + u_displacementBias;
        
            // Water
            float scale = 10.0;
            float timeScale = 0.4;
            float strength = 0.2;
        
            float treshold = 0.37;
            float normalizedHeight = texture2D(u_displacementMap, uv).x;
            v_waterMask = 1.0 - step(0.37, normalizedHeight);

            float time = u_time;
        
            float noise1 = noise(uv * vec2(noise(uv), 1) * vec2(5.0 * scale, scale) + vec2(-time, time) * timeScale);
            float noise2 = noise(uv * vec2(1, noise(uv)) * vec2(scale, scale * 6.0) + vec2(time, -time) * timeScale);
            float noise3 = noise(uv * vec2(noise(uv)) * vec2(3.0 * scale) + vec2(time, -time) * timeScale);
            float noise4 = noise(uv * vec2(noise(uv)) * vec2(scale * 3.0) + vec2(-time, time) * timeScale);
        
            float noiseResult = (noise1 + noise2 + noise3 + noise4) / 4.0;
            transformed.z -= v_waterMask * (noiseResult * strength - 0.07);
        
            //  Edges
            float margin = 0.0;
            float scaleX = 0.2;
            float scaleY = 0.2;
            float maskX = smoothstep(0.0 + margin, scaleX, uv.x) * (1.0 - smoothstep(1.0 - scaleX, 1.0 - margin, uv.x));
            float maskY = smoothstep(0.0 + margin, scaleY, uv.y) * (1.0 - smoothstep(1.0 - scaleY, 1.0 - margin, uv.y));
            float mask = 1.0 - maskX * maskY;
        
            transformed.z -= mask * 0.2;

            // vec4 pos = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
            v_localPos = transformed;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
       }
    `,
	fragmentShader: /*glsl*/ `
        uniform float u_waterGradSpread;
        uniform float u_waterGradOrigin;
        uniform sampler2D u_waterGradMap;
        uniform float u_wireframeMode;

        varying vec2 v_uv;
        varying vec3 v_localPos;
        varying float v_waterMask;

        float remap(in float value, in float min1, in float max1, in float min2, in float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            float margin = 0.05;
            float scaleX = 0.25;
            float scaleY = 0.25;
        
            float maskX = smoothstep(0.0 + margin, scaleX, v_uv.x) * (1.0 - smoothstep(1.0 - scaleX, 1.0 - margin, v_uv.x));
            float maskY = smoothstep(0.0 + margin, scaleY, v_uv.y) * (1.0 - smoothstep(1.0 - scaleY, 1.0 - margin, v_uv.y));
            float mask = maskX * maskY;

            float waterCoords = v_localPos.z * u_waterGradSpread + u_waterGradOrigin;
            vec4 waterGradColor = vec4( texture2D(u_waterGradMap, vec2(0.5, waterCoords)) );
            vec4 water = mix(waterGradColor, vec4(waterCoords), u_wireframeMode);
            // vec4 water = vec4(waterCoords);
            vec4 earth = vec4(1.0, 1.0, 1.0, 0.0);
            vec4 col = vec4(mix(earth, water, v_waterMask));
            col.a *= mask;
            gl_FragColor =col;
        }
    `,
	uniforms: uniforms,
	transparent: true,
	depthTest: true,
	wireframe: uniforms.u_wireframeMode.value == 1,
})

const wireframeModeToggle = { value: uniforms.u_wireframeMode.value == 1 }

gui.add(wireframeModeToggle, 'value').name('wireframe').onChange(v => {
    const isWireframeMode = v as boolean
    uniforms.u_wireframeMode.value = isWireframeMode ? 1 : 0
    mapMaterial.wireframe = isWireframeMode
})

const mapMesh = new Mesh(mapGeometry, mapMaterial)
world.scene.add(mapMesh)
const col = new Color(0x303030)
const grid = new GridHelper(10, 30, col, col)
grid.position.set(0, 0, -0.3)
grid.rotation.set(80, 0, 0)
world.scene.add(grid)

const gridToogle = { value: true }
gui.add(gridToogle, 'value').name('grid').onChange(value => grid.visible = value as boolean)

function animate() {
	requestAnimationFrame(animate)
	timer.update()
	uniforms.u_time.value = timer.getElapsed()
	world.update()
}
animate()
