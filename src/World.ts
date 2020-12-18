import {
    Color, Light, PerspectiveCamera, PointLight,
    Scene, WebGLRenderer, LinearToneMapping, Vector2
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

export class World{
    private _scene: Scene;
    public get scene(): Scene { return this._scene };
    private _camera: PerspectiveCamera;
    public get camera(): PerspectiveCamera { return this._camera };

    private _renderer: WebGLRenderer;
    public get renderer(): WebGLRenderer { return this._renderer };
    private _light: Light;
    private _controls: OrbitControls;

    private _composer: EffectComposer;

    private _bloomParams = {
        exposure: 1.1,
        strength: 0.48,
        threshold: 0.3,
        radius: 0.49
    };

    constructor() {
        this.init();
    }

    private init = (): void => {
        this._scene = new Scene();
        this._scene.background = new Color(0x101010);

        this._camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 150);

        this._renderer = new WebGLRenderer({ antialias: true});
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._renderer.domElement)
        window.addEventListener('resize', this.onWindowResize, false)

        this._light = new PointLight(0xffffff, 1.5);
        this._light.position.set(0, 5, 10);
        this._scene.add(this._light);

        this.setPostProcessing();

        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.maxDistance = 1.5;
        this._controls.minDistance = 1;
        this._controls.minAzimuthAngle = -Math.PI / 4;
        this._controls.maxAzimuthAngle = Math.PI / 4;

        this._controls.minPolarAngle = -Math.PI / 3 + Math.PI / 2;
        this._controls.maxPolarAngle = Math.PI / 3 + Math.PI / 2;

        this._controls.enablePan = false;

        this._camera.position.set(0.01224, -0.70044, 1.07851);
        this._camera.rotation.set(0.57599, 0.00951,  -0.00618);
    }

    private setPostProcessing = (): void => {
        this._renderer.toneMapping = LinearToneMapping;
        // this._renderer.toneMappingExposure = Math.pow(this._bloomParams.exposure, 4.0);

        const renderScene = new RenderPass( this._scene, this._camera );

        const bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            this._bloomParams.strength,
            this._bloomParams.radius,
            this._bloomParams.threshold
        );

        this._composer = new EffectComposer(this._renderer);
        this._composer.addPass(renderScene);
        this._composer.addPass(bloomPass);
        
        const gui = new GUI();
        gui.domElement.id = 'title';

        gui.add( this._bloomParams, 'threshold', 0.0, 1.0).onChange( function ( value ) {

            bloomPass.threshold = Number( value );

        } );

        gui.add( this._bloomParams, 'strength', 0.0, 3.0 ).onChange( function ( value ) {

            bloomPass.strength = Number( value );

        } );

        gui.add( this._bloomParams, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {

            bloomPass.radius = Number( value );

        } );
    }

    private setGui() {

    }

    public render = (): void => {
        this._renderer.render(this._scene, this._camera);
        this._composer.render();
    }

    private onWindowResize = (): void => {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
}