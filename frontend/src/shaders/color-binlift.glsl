#version 300 es
precision highp float;

// in vec4 gl_FragCoord;
out vec4 avg;
uniform sampler2D last;

uniform int bias;
uniform bool horizontal;

float alphaScale(float alpha) {
  return alpha;
}

vec4 colorWeightedSum(vec4 a, vec4 b) {
  float aa = alphaScale(a[3]);
  float ba = alphaScale(b[3]);

  float sum = aa + ba;
  if(sum < 1e-6) return vec4(0, 0, 0, 0);
  return vec4(
    (a[0] * aa + b[0] * ba) / sum,
    (a[1] * aa + b[1] * ba) / sum,
    (a[2] * aa + b[2] * ba) / sum,
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