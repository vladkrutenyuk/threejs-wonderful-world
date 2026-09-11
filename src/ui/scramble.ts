import { Tween } from "@tweenjs/tween.js";
import type { State } from "vanjs-core";
//@ts-ignore
import stringLerp from "string-lerp";

const CHARACTERS = "IJKLMNOPQRSTabcdefghijstuvwxyz0123456789!@#$%&";

const randomString = (length: number) => {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
	}
	return result;
};

const tweens = new WeakMap<State<string>, Tween<{ value: number }>>();

// Types `text` into `target` out of random characters
export const scramble = (
	target: State<string>,
	text: string,
	duration: number,
	delay = 0,
	onStart?: () => void
) => {
	stopScramble(target);
	const progress = { value: 0 };
	const tween = new Tween(progress)
		.to({ value: 1 }, duration)
		.delay(delay)
		.onStart(() => onStart?.())
		.onUpdate(() => {
			const noisy = stringLerp.lerp(randomString(text.length * 1.5), text, Math.pow(progress.value, 3));
			target.val = stringLerp.lerp("", noisy, progress.value);
		})
		.start();
	tweens.set(target, tween);
};

export const stopScramble = (target: State<string>) => {
	tweens.get(target)?.stop();
	tweens.delete(target);
};
