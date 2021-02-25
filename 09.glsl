#version 300 es
precision mediump float;

#define PI 3.141592653589793

uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_resolution;

out vec4 outColor;

float stroke(float x, float s, float w) {
	float d = step(s, x + w * .5) -
		step(s, x - w * .5);

	return clamp(d, 0., 1.);
}

float circleSDF(vec2 st) {
	return length(st - .5) * 2.;
}

float fill(float x, float size) {
	return 1. - step(size, x);
}

void main() {
	vec3 color = vec3(0.);

	vec2 st = gl_FragCoord.xy / u_resolution;

	color += fill(circleSDF(st), .65);

	vec2 offset = vec2(.1, .05);

	color -= fill(circleSDF(st-offset), .5);

	outColor = vec4(color, 1.);
}
