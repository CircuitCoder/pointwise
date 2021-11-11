#version 300 es
precision highp float;

out vec4 avg;

uniform sampler2D level_0;
uniform sampler2D level_1;
uniform sampler2D level_2;
uniform sampler2D level_3;
uniform sampler2D level_4;
uniform sampler2D level_5;
uniform sampler2D level_6;
uniform sampler2D level_7;
uniform sampler2D level_8;
uniform sampler2D level_9;
uniform sampler2D level_10;
uniform sampler2D level_11;

uniform bool enables[12]; // Binary repersentation of kernel size
uniform bool horizontal;

#define PROCESS(level, i) if(enables[i]) result = process_loop_with(level, i, result, bias);

vec4 colorWeightedSum(vec4 a, vec4 b) {
  float sum = a[3] + b[3];
  if(sum < 1e-6) return vec4(0, 0, 0, 0);
  return vec4(
    (a[0] * a[3] + b[0] * b[3]) / sum,
    (a[1] * a[3] + b[1] * b[3]) / sum,
    (a[2] * a[3] + b[2] * b[3]) / sum,
    sum
  );
}

vec4 process_loop_with(sampler2D level, const int i, vec4 result, inout int bias) {
  ivec2 coord = ivec2(
    horizontal ? gl_FragCoord[0] + float(bias) : gl_FragCoord[0],
    horizontal ? gl_FragCoord[1] : gl_FragCoord[1] + float(bias)
  );
  vec4 lookup = texelFetch(
    level, coord, 0
  );
  vec4 sum = colorWeightedSum(result, lookup);

  bias += 1 << i;

  return sum;
}

void main() {
  vec4 result = vec4(0, 0, 0, 0);
  int bias = 1;

  PROCESS(level_0, 0)
  PROCESS(level_1, 1)
  PROCESS(level_2, 2)
  PROCESS(level_3, 3)
  PROCESS(level_4, 4)

  avg = result;
}