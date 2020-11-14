import {Vector2} from "/build/three.module.js";

export class Input {
    private _mousePosition: Vector2 = new Vector2();
    public get mousePosition() { return this._mousePosition };

    constructor() {
        this.init();
    }

    private init = (): void => {
        document.addEventListener('mousemove', this.onMouseMove, false);
    }

    public onMouseMove = (event: MouseEvent): void => {
        this._mousePosition.x = event.clientX;
        this._mousePosition.y = event.clientY;
    }
}