import * as THREE from "three";

/*
 * The scene was designed with the legacy lighting of three r150. Physically correct lighting became
 * the default in r155 and the legacy mode was removed in r165. Legacy lights differed in two ways:
 *   1. the renderer multiplied every light intensity by PI;
 *   2. point light falloff was `pow(saturate(1 - distance / cutoff), decay)`, and there was no
 *      falloff at all when `distance` was 0 (physical lights fall off with the inverse square).
 * These helpers restore both, so lit materials look exactly as they did in r150.
 */

export const legacyLightIntensity = (intensity: number): number => intensity * Math.PI;

const physicalDistanceAttenuation = /float getDistanceAttenuation\([\s\S]*?\n}/;

const legacyDistanceAttenuation = /*glsl*/ `float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

	if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {

		return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );

	}

	return 1.0;

}`;

// For `onBeforeCompile` of lit materials.
export const withLegacyLightAttenuation = (fragmentShader: string): string => {
	const chunk = THREE.ShaderChunk.lights_pars_begin;
	if (!physicalDistanceAttenuation.test(chunk)) {
		throw "getDistanceAttenuation() was not found in lights_pars_begin shader chunk";
	}
	return fragmentShader.replace(
		"#include <lights_pars_begin>",
		chunk.replace(physicalDistanceAttenuation, legacyDistanceAttenuation)
	);
};
