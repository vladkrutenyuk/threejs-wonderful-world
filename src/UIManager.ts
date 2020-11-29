import { Tween } from "@tweenjs/tween.js";
import stringLerp from "string-lerp";

export class UIManager {
    public static setWonderNameTitle = (text: string): void => {
        const element = document.getElementById("wonderName");
        const fromText: string = element.textContent;

        let tweener = { value: 0 };

        new Tween(tweener)
            .to({ value: 1 }, 250)
            .onUpdate( () => {
                element.textContent = stringLerp.lerp(fromText, text, tweener.value);
            })
            .start()
    }

    public static setTitle = (text: string): void => {
        document.getElementById("title").textContent = text;
    }

    // TODO: hint text over Marker (goTo> Marker name / <back)
}