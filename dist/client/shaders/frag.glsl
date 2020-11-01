uniform vec3 u_color;
uniform vec3 u_fresnelColor;
uniform float u_fresnelPower;

varying vec3 v_worldNormal;
varying vec3 v_position;
varying mat4 v_modelMatrix;

void main() {
    vec3 worldPosition = (v_modelMatrix * vec4(v_position, 0)).xyz;
    vec3 worldViewDir = normalize(cameraPosition - worldPosition);

    float fresnel = 1.0 - dot(worldViewDir, v_worldNormal);
    float fresnelPowered = pow(fresnel, u_fresnelPower);

    vec3 color = mix(u_color, u_fresnelColor, fresnelPowered);

    gl_FragColor = vec4(color * 1.5, 1);
}
