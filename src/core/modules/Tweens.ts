import TWEEN from "@tweenjs/tween.js";
import { ContextModule } from "three-start";

// Steps the tweens of the default group, before the components update
export class Tweens extends ContextModule {
	onUpdate() {
		TWEEN.update();
	}
}
