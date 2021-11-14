#version 300 es
precision highp float;

out vec4 avg;

uniform sampler2D level_0;
uniform sampler2D level_1;
uniform sampler2D level_2;
uniform sampler2D level_3;
uniform sampler2D level_4;

uniform bool enables[12]; // Binary repersentation of kernel size
uniform bool horizontal;
uniform int ksize;

#define PROCESS(level, i) if(enables[i]) result = process_loop_with(level, i, result, base, bias);

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

vec4 process_loop_with(sampler2D level, const int i, vec4 result, ivec2 base, inout int bias) {
  ivec2 coord = ivec2(
    horizontal ? base[0] + bias : base[0],
    horizontal ? base[1] : base[1] + bias
  );
  vec4 lookup = texelFetch(
    level, coord, 0
  );
  vec4 sum = colorWeightedSum(result, lookup);

  bias += 1 << i;

  return sum;
}

void main() {
  ivec2 base = ivec2(
    horizontal ? int(gl_FragCoord[0]) * ksize : int(gl_FragCoord[0]),
    horizontal ? int(gl_FragCoord[1]) : int(gl_FragCoord[1]) * ksize
  );
  vec4 result = vec4(0, 0, 0, 0);
  int bias = 0;

  PROCESS(level_0, 0)
  PROCESS(level_1, 1)
  PROCESS(level_2, 2)
  PROCESS(level_3, 3)
  PROCESS(level_4, 4)

  avg = result;
}