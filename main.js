import glslCanvas from "./canvas.js";

window.addEventListener("load", () => {
  fetch("./08.glsl")
    .then(res => res.text())
    .then(res => {
      glslCanvas(document.getElementById("canvas"), res);
    });
});
