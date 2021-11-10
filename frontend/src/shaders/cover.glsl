#version 300 es
// Taken from https://community.khronos.org/t/draw-with-fragment-shader-without-vertices/70964

vec2 quadVertices[4];

void main() {
  quadVertices[0] = vec2(-1.,-1.);
  quadVertices[1] = vec2(1.,-1.);
  quadVertices[2] = vec2(-1.,1.);
  quadVertices[3] = vec2(1.,1.);
  gl_Position = vec4(quadVertices[gl_VertexID],0.,1.);
}