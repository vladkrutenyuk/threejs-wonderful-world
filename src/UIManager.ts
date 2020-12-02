import TWEEN, { Tween } from "@tweenjs/tween.js";
import stringLerp from "string-lerp";
import {MathUtils} from "three";

export class UIManager {
    private static wonderNameElement = document.getElementById("wonderName");
    private static titleElement = document.getElementById("title");
    private static hintElement = document.getElementById("hintMouseOver");
    public static hintTweenGroup = new TWEEN.Group();

    public static setWonderNameTitle = (text: string): void => {
        const fromText: string = UIManager.wonderNameElement.textContent;

        let tweener = { textValue: 0};

        new Tween(tweener)
            .to({ textValue: 1 }, 1000)
            .onUpdate( () => {
                UIManager.wonderNameElement.textContent = stringLerp.lerp(
                        fromText,
                        stringLerp.lerp(
                            UIManager.getRandomString(text.length * 1.5),
                            text,
                            Math.pow(tweener.textValue, 3)),
                        tweener.textValue);
            })
            .start()
    }

    public static setTitle = (text: string, shallMakeSmaller: boolean): void => {
        UIManager.titleElement.textContent = text;
        // UIManager.titleElement.style.fontSize;

        let tweener = { value: shallMakeSmaller ? 1 : 0};
        new Tween(tweener)
            .to({ value: shallMakeSmaller ? 0 : 1 }, 1000)
            .start()
            .onUpdate(() => {
                UIManager.titleElement.style.fontSize = MathUtils.lerp(12, 17, tweener.value) + "px";
            });
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
                        stringLerp.lerp(
                            UIManager.getRandomString(text.length * 1.5),
                            text,
                            Math.pow(tweener.value, 3)),
                        tweener.value);
            })
            .delay(isEnabling ? 600 : 0)
            .start()
            .onStart(() => {console.log("onStart")});
    }

    public static update = (): void => {
        UIManager.hintTweenGroup.update();
    }

    public static getRandomString = (length): string => {
        let result = '';
        const characters = 'IJKLMNOPQRSTabcdefghijstuvwxyz0123456789!@#$%&';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}