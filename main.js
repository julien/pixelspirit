const VERTEX_SHADER = `#version 300 es
precision mediump float;

in vec2 a_position;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
	vec2 pos = -1.0 + 2.0 * (gl_FragCoord.xy / u_resolution.xy);

	float r = pos.x * cos(u_time) - pos.y * sin(u_time);
	float g = pos.y * sin(u_time) - pos.x * cos(u_time);
	float b = pos.x * cos(u_time) + pos.y * sin(u_time);

	vec2 mousePos = -1.0 + 2.0 * (u_mouse.xy / u_resolution.xy);

	float dst = distance(pos, mousePos);
	float sum =  2.0 / dst;

	outColor = vec4(sum - r, sum - g, sum - b, 1.0);
}`;

let winW = window.innerWidth;
let winH = window.innerHeight;
let lastTime = 0;
let gl;
let info;
let a_positionBuffer;
let a_positions = [];
let u_time = 0;
let u_mouse = [0, 0];
let reader;
let requestId;

function main(canvas, fragmentShader) {
	canvas.width = winW;
	canvas.height = winH;

	gl = canvas.getContext('webgl2');
	if (!gl) throw Error('Failed to initialize WebGL');

	const program = createProgram(fragmentShader);
	gl.useProgram(program);

	createBuffers();
	setUniforms();
	addEventListeners();

	gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

	loop();
}

function createProgram(fragmentShader) {
	const vShader = createShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
	const fShader = createShader(gl, fragmentShader, gl.FRAGMENT_SHADER);

	const program = gl.createProgram();
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		err = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw err;
	}
	gl.deleteShader(vShader);
	gl.deleteShader(fShader);

	info = {
		a_position: gl.getAttribLocation(program, 'a_position'),
		u_mouse: gl.getUniformLocation(program, 'u_mouse'),
		u_resolution: gl.getUniformLocation(program, 'u_resolution'),
		u_time: gl.getUniformLocation(program, 'u_time')
	};

	return program;
}

function createBuffers() {
	a_positionBuffer = gl.createBuffer();
	gl.enableVertexAttribArray(info.a_position);
	gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);

	a_positions = [
		-1.0,
		1.0, // top left
		-1.0,
		-1.0, // bottom left
		1.0,
		1.0, // top right
		1.0,
		-1.0 // bottom right
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a_positions), gl.STATIC_DRAW);

	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	gl.enableVertexAttribArray(info.a_position);
	gl.vertexAttribPointer(info.a_position, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, a_positions.length / 2);
}

function setUniforms() {
	gl.uniform1f(info.u_time, u_time);
	gl.uniform2f(info.u_mouse, u_mouse[0], u_mouse[1]);
	gl.uniform2f(info.u_resolution, winW, winH);
}

function loop() {
	requestId = requestAnimationFrame(loop);

	const now = new Date().getTime();
	if (lastTime) {
		const elapsed = now - lastTime;

		u_time += (2.0 * elapsed) / 1000.0;
	}
	lastTime = now;
	draw();
}

function draw() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	u_time += 0.01;
	gl.uniform1f(info.u_time, u_time);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, a_positions.length / 2);
}

function createShader(gl, src, type) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, src);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const err = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw err;
	}
	return shader;
}

function addEventListeners() {
	window.addEventListener(
		'resize',
		() => {
			winW = window.innerWidth;
			winH = window.innerHeight;
			gl.canvas.width = winW;
			gl.canvas.height = winH;
			gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

			gl.uniform2f(info.u_resolution, winW, winH);
		},
		false
	);

	document.addEventListener(
		'mousemove',
		(e) => {
			u_mouse[0] = e.pageX;
			u_mouse[1] = e.pageY * -1;

			gl.uniform2f(info.u_mouse, u_mouse[0], u_mouse[1]);
		},
		false
	);

	document.body.addEventListener('dragover', (e) => {
		e.preventDefault();
		gl.canvas.style.opacity = 0.5;
	});

	document.body.addEventListener('drop', (e) => {
		e.preventDefault();
		gl.canvas.style.opacity = 1.0;

		if (e.dataTransfer.files.length > 0)
			if (!reader) {
				reader = new FileReader();
				reader.addEventListener('loadend', handleLoadEnd);
			}
			reader.readAsText(e.dataTransfer.files[0]);
	});
}

function handleLoadEnd(e) {
	if (requestId) cancelAnimationFrame(requestId);

	const program = createProgram(e.target.result);
	gl.useProgram(program);
	createBuffers();
	setUniforms();
	loop();
}

export default function glslCanvas(canvas, fragmentShader) {
	if (!fragmentShader) fragmentShader = FRAGMENT_SHADER;
	main(canvas, fragmentShader);
}
