import {Vector2} from "/build/three.module.js";

export class Input {
    private _mousePosition: Vector2 = new Vector2();
    public get mousePosition() { return this._mousePosition };

    private _onMouseMoveEventFunc: (mousePosition: Vector2) => void;
    private _onMouseClickEventFunc: () => void;

    constructor() {
        this.init();
    }

    private init = (): void => {
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('click', this.onMouseClick, false);
    }

    private onMouseMove = (event: MouseEvent): void => {
        this._mousePosition.x = event.clientX;
        this._mousePosition.y = event.clientY;

        this._onMouseMoveEventFunc(this.mousePosition);
    }

    private onMouseClick = (): void => {
        this._onMouseClickEventFunc();
    }

    public setMouseMoveEventListener = (func: (mousePosition: Vector2) => void) => {
        this._onMouseMoveEventFunc = func;
    }

    public setMouseClickEventListener = (func: () => void) => {
        this._onMouseClickEventFunc = func;
    }
}