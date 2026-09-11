import * as THREE from "three/webgpu";
import { Fn, float } from "three/tsl";

/*
 * The scene was designed with the legacy lighting of three r150. Physically correct lighting became
 * the default in r155 and the legacy mode was removed in r165. Legacy lights differed in two ways:
 *   1. the renderer multiplied every light intensity by PI;
 *   2. point light falloff was `pow(saturate(1 - distance / cutoff), decay)`, and there was no
 *      falloff at all when `distance` was 0 (physical lights fall off with the inverse square).
 * LegacyPointLight renders with both, once its light node is registered with registerLegacyLights().
 */

export class LegacyPointLight extends THREE.PointLight {}

type AttenuationParams = {
	lightDistance: THREE.Node<"float">;
	cutoffDistance: THREE.Node<"float">;
	decayExponent: THREE.Node<"float">;
};

const legacyDistanceAttenuation = Fn(({ lightDistance, cutoffDistance, decayExponent }: AttenuationParams) =>
	cutoffDistance
		.greaterThan(0)
		.and(decayExponent.greaterThan(0))
		.select(lightDistance.negate().div(cutoffDistance).add(1).clamp().pow(decayExponent), float(1))
);

class LegacyPointLightNode extends THREE.PointLightNode {
	// set up by AnalyticLightNode, missing from @types/three
	declare color: THREE.Color;
	declare colorNode: THREE.Node<"vec3">;

	update(frame: THREE.NodeFrame) {
		const result = super.update(frame);
		if (this.light) this.color.copy(this.light.color).multiplyScalar(this.light.intensity * Math.PI);
		return result;
	}

	setupDirect(builder: THREE.NodeBuilder) {
		const lightVector = this.getLightVector(builder) as THREE.Node<"vec3">;
		const attenuation = legacyDistanceAttenuation({
			lightDistance: lightVector.length(),
			cutoffDistance: this.cutoffDistanceNode as THREE.Node<"float">,
			decayExponent: this.decayExponentNode as THREE.Node<"float">,
		});
		return { lightDirection: lightVector.normalize(), lightColor: this.colorNode.mul(attenuation) };
	}
}

export const registerLegacyLights = (renderer: THREE.WebGPURenderer): void => {
	renderer.library.addLight(LegacyPointLightNode, LegacyPointLight);
};
