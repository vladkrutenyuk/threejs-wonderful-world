import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
//@ts-ignore
import stringLerp from "string-lerp";
import { getRandomString } from "../helpers/get-random-string";
import { setElementVisibility } from "../helpers/set-element-visibility";

export type TooltipParams = {
	text: string;
	x: number;
	y: number;
};

const OFFSET_X = 30;
const OFFSET_Y = -45;

const MARGIN_X = 150;
const MARGIN_Y = 30;

const DURATION = 500;
const DELAY_MS = 600;

export default class Tooltip {
	private _element?: HTMLElement;
	private tweenGroup = new TWEEN.Group();

	setElement(element: HTMLElement) {
		if (this._element) {
			console.warn("HTML element has already been set here.");
			return;
		}
		this._element = element;
	}

	set(params: TooltipParams) {
		const html = this._element;
		if (!html) {
			console.error("Tooltip element is not set, it is undefined");
			return;
		}

		const left = THREE.MathUtils.clamp(
			params.x + OFFSET_X,
			MARGIN_X,
			window.innerWidth - MARGIN_X
		);
		const top = THREE.MathUtils.clamp(
			params.y + OFFSET_Y,
			MARGIN_Y,
			window.innerHeight - MARGIN_Y
		);
		html.style.left = `${left}px`;
		html.style.top = `${top}px`;

		this.tweenGroup.removeAll();
		this.tweenGroup = new TWEEN.Group();

		let target = { value: 0 };
		new TWEEN.Tween(target, this.tweenGroup)
			.to({ value: 1 }, DURATION)
			.onStart(() => setElementVisibility(html, true))
			.onUpdate(() => {
				html.textContent = stringLerp.lerp(
					"",
					stringLerp.lerp(
						getRandomString(params.text.length * 1.5),
						params.text,
						Math.pow(target.value, 3)
					),
					target.value
				);
			})
			.delay(DELAY_MS)
			.start();
	}

	reset() {
		const html = this._element;
		if (!html) {
			console.error("Tooltip element is not set, it is undefined");
			return;
		}

		this.tweenGroup.removeAll();
		this.tweenGroup = new TWEEN.Group();

		html.textContent = "";
		setElementVisibility(html, false);
	}

	update() {
		this.tweenGroup.update();
	}
}
