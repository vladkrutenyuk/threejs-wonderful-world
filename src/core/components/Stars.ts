import * as THREE from "three/webgpu";
import { instancedBufferAttribute } from "three/tsl";
import { Object3DBehaviour } from "three-start";

export class Stars extends Object3DBehaviour {
	onAwake() {
		const vertices = [];
		const range = 50;
		for (let i = 0; i < 10000; i++) {
			const x = THREE.MathUtils.randFloatSpread(range);
			const y = THREE.MathUtils.randFloatSpread(range);
			const z = THREE.MathUtils.randFloatSpread(range);

			if (Math.sqrt(x * x + y * y + z * z) > 5) vertices.push(x, y, z);
		}

		// WebGPU draws Points 1px wide whatever the size, so the stars are instanced sprites,
		// which PointsNodeMaterial sizes the same way as PointsMaterial.
		const positions = new THREE.InstancedBufferAttribute(new Float32Array(vertices), 3);
		const material = new THREE.PointsNodeMaterial({ color: 0x505050, size: 0.08 });
		material.positionNode = instancedBufferAttribute(positions);
		const points = new THREE.Sprite(material);
		points.count = positions.count;
		points.frustumCulled = false;
		this.object.add(points);
	}
}
