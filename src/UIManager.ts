import TWEEN, { Tween } from "@tweenjs/tween.js";
import stringLerp from "string-lerp";
import {Vector2} from "three";

export class UIManager {
    private static wonderNameElement = document.getElementById("wonderName");
    private static titleElement = document.getElementById("title");
    private static hintElement = document.getElementById("hintMouseOver");
    private static hintLastPos: Vector2 = new Vector2();

    public static setWonderNameTitle = (text: string): void => {
        const fromText: string = UIManager.wonderNameElement.textContent;

        let tweener = { value: 0 };

        new Tween(tweener)
            .to({ value: 1 }, 500)
            .onUpdate( () => {
                UIManager.wonderNameElement.textContent = stringLerp
                    .lerp(
                        fromText,
                        stringLerp.lerp("q4we@%4rT32*yu%i!opa&s", text, Math.pow(tweener.value, 3)),
                        tweener.value);
            })
            .start()
    }

    public static setTitle = (text: string): void => {
        UIManager.titleElement.textContent = text;
    }

    public static setHint = (text: string,
                             x: number = UIManager.hintLastPos.x,
                             y: number = UIManager.hintLastPos.y,
                             enabled: boolean = false): void => {
        UIManager.hintLastPos.set(x, y);
        const fromText: string = UIManager.hintElement.textContent;

        UIManager.hintElement.style.left = x + 30 + 'px';
        UIManager.hintElement.style.top = y - 45 + 'px';

        let tweener = { value: 0 };

        const duration = enabled ? 500 : 250;

        new Tween(tweener)
            .to({ value: 1 }, duration)
            .onUpdate( () => {
                UIManager.hintElement.textContent = stringLerp
                    .lerp(
                        fromText,
                        stringLerp.lerp("q4we@%4rT32*yu%i!opa&s", text, Math.pow(tweener.value, 3)),
                        tweener.value);
            })
            .delay(enabled ? 600 : 0)
            .start()
    }
}