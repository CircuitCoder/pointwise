#version 300 es
precision highp float;

// in vec4 gl_FragCoord;
out vec4 avg;
uniform sampler2D last;

uniform int bias;
uniform bool horizontal;

vec4 colorWeightedSum(vec4 a, vec4 b) {
  float sum = a[3] + b[3];
  if(sum < 1e-4) return vec4(0, 0, 0, 0);
  return vec4(
    (a[0] * a[3] + b[0] * b[3]) / sum,
    (a[1] * a[3] + b[1] * b[3]) / sum,
    (a[2] * a[3] + b[2] * b[3]) / sum,
    sum
  );
}

void main() {
  vec4 cur = texelFetch(
    last, ivec2(gl_FragCoord[0], gl_FragCoord[1]), 0
  );

  ivec2 siblingCoord = ivec2(
    horizontal ? gl_FragCoord[0] + float(bias) : gl_FragCoord[0],
    horizontal ? gl_FragCoord[1] : gl_FragCoord[1] + float(bias)
  );
  vec4 sibling = texelFetch(
    last, siblingCoord, 0
  );

  avg = colorWeightedSum(cur, sibling);
}