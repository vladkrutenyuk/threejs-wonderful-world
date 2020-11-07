import {Camera, Color, Light, PerspectiveCamera, PointLight, Scene, WebGLRenderer} from "/build/three.module.js";
import {OrbitControls} from "/jsm/controls/OrbitControls";

export class World{
    private _scene: Scene;
    public get scene(): Scene { return this._scene };

    private _camera: PerspectiveCamera;
    public get camera(): PerspectiveCamera { return this._camera };

    private _renderer: WebGLRenderer;
    public get renderer(): WebGLRenderer { return this._renderer };

    private _light: Light;
    public get light(): Light { return this._light };

    private _controls: OrbitControls;
    public get controls(): OrbitControls { return this._controls };

    constructor() {
        this.init();
    }

    /** Init scene, perspective camera, orbit controls, renderer, light. And set determined properties  */
    private init = (): void => {
        this._scene = new Scene();
        this._scene.background = new Color(0x101010);

        this._camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 150);
        this._camera.position.set(0, 0.2, 2);
        this._camera.lookAt(0, 0, 0);

        this._renderer = new WebGLRenderer({ antialias: true});
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._renderer.domElement)
        // document.body.style.cursor = 'none';
        window.addEventListener('resize', this.onWindowResize, false)

        this._light = new PointLight(0xffffff, 1.5);
        this._light.position.set(0, 5, 10);
        this._scene.add(this._light);

        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.maxDistance = 5;
        this._controls.minDistance = 0.5;
    }

    /** Start inited scene rendering by inited camera */
    public startRendering = (): void => {
        requestAnimationFrame(this.startRendering);
        this._renderer.render(this._scene, this._camera);
    }

    private onWindowResize = (): void => {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
}