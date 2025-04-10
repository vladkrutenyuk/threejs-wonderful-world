import { Tween } from "@tweenjs/tween.js";
//@ts-ignore
import stringLerp from "string-lerp";
import { getRandomString } from "../helpers/get-random-string";
import { setElementVisibility } from "../helpers/set-element-visibility";

const TITLE_ELEMENT_ID = "title";
const TITLE_ELEMENT = document.getElementById(TITLE_ELEMENT_ID);

const WONDER_TITLE_ELEMENT_ID = "wonder_title";
const WONDER_TITLE_ELEMENT = document.getElementById(WONDER_TITLE_ELEMENT_ID);

export enum HeaderStyle {
	AloneHeader,
	SubtitleForWonder,
}

export default class Header {
	static setTitleStyle(size: HeaderStyle) {
		if (!TITLE_ELEMENT) {
			throw `Title element was not found (id=${TITLE_ELEMENT_ID})`;
		}

		switch (size) {
			case HeaderStyle.AloneHeader:
				TITLE_ELEMENT.classList.add("big");
				TITLE_ELEMENT.classList.remove("small");
				TITLE_ELEMENT.textContent = "Wonders of the world".toUpperCase();
				break;
			case HeaderStyle.SubtitleForWonder:
				TITLE_ELEMENT.classList.add("small");
				TITLE_ELEMENT.classList.remove("big");
				TITLE_ELEMENT.textContent = "Wonder of the world".toUpperCase();
				break;
		}
	}

	static setWonderTitle(text: string, href: string) {
		if (!WONDER_TITLE_ELEMENT) {
			throw `Title element was not found (id=${WONDER_TITLE_ELEMENT_ID})`;
		}

		setElementVisibility(WONDER_TITLE_ELEMENT, true);
		WONDER_TITLE_ELEMENT.textContent = "";
		WONDER_TITLE_ELEMENT.setAttribute("href", href);

		const target = { value: 0 };

		new Tween(target)
			.to({ value: 1 }, 1000)
			.onUpdate(() => {
				WONDER_TITLE_ELEMENT.textContent = stringLerp.lerp(
					"",
					stringLerp
						.lerp(
							getRandomString(text.length * 1.5),
							text,
							Math.pow(target.value, 3)
						)
						.toUpperCase(),
					target.value
				);
			})
			.start();
	}

	static resetWonderTitle() {
		if (!WONDER_TITLE_ELEMENT) {
			throw `Title element was not found (id=${WONDER_TITLE_ELEMENT_ID})`;
		}

		WONDER_TITLE_ELEMENT.textContent = "";
		setElementVisibility(WONDER_TITLE_ELEMENT, false);
	}
}

Header.setTitleStyle(HeaderStyle.AloneHeader);
