#version 300 es
precision mediump float;

uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
	vec3 color = vec3(0.);

	vec2 st = gl_FragCoord.xy / u_resolution;

	color += step(.5, st.x);

	outColor = vec4(color, 1.);
}
