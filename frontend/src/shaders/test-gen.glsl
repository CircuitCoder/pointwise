#version 300 es
precision highp float;

// in vec4 gl_FragCoord;
out vec4 color;

void main() {
  color = vec4(gl_FragCoord[0] / 1000.0, gl_FragCoord[1] / 1000.0, gl_FragCoord[0], 1);
}