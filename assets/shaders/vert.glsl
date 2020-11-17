varying vec3 v_worldNormal;
varying vec3 v_position;
varying mat4 v_modelMatrix;

void main() {
    v_worldNormal = normalize((modelMatrix * vec4(normal, 0)).xyz);

    v_position = position;
    v_modelMatrix = modelMatrix;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
