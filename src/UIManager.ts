import TWEEN, { Tween } from "@tweenjs/tween.js";
import stringLerp from "string-lerp";
import {Vector2} from "three";

export class UIManager {
    private static wonderNameElement = document.getElementById("wonderName");
    private static titleElement = document.getElementById("title");
    private static hintElement = document.getElementById("hintMouseOver");
    public static hintTweenGroup = new TWEEN.Group();

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

    public static setHint = (text: string, x: number = 0, y: number = 0, isEnabling: boolean = false): void => {
        const fromText: string = UIManager.hintElement.textContent;

        if (isEnabling) {
            UIManager.hintElement.style.left = x + 30 + 'px';
            UIManager.hintElement.style.top = y - 45 + 'px';
        }

        let tweener = { value: 0 };

        UIManager.hintTweenGroup.removeAll();
        UIManager.hintTweenGroup = new TWEEN.Group();

        new Tween(tweener, UIManager.hintTweenGroup)
            .to({ value: 1 }, isEnabling ? 500 : 1)
            .onUpdate( () => {
                console.log("onUpdate");
                UIManager.hintElement.textContent
                    = stringLerp.lerp(
                        fromText,
                        stringLerp.lerp("q4we@%4rT32*yu%i!opa&s", text, Math.pow(tweener.value, 3)),
                        tweener.value);
            })
            .delay(isEnabling ? 600 : 0)
            .start()
            .onStart(() => {console.log("onStart")});
    }

    public static update = (): void => {
        UIManager.hintTweenGroup.update();
    }
}