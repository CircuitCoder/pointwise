#version 300 es
precision highp float;

out vec4 color;
uniform sampler2D avg;

uniform sampler2D noiseLast;
uniform sampler2D noiseCur;
uniform float noiseInterp;

// TODO: grid transform
uniform vec2 ksize;

void main() {
  ivec2 coord = ivec2(
    floor(gl_FragCoord[0] / ksize[0]),
    floor(gl_FragCoord[1] / ksize[1])
  );
  vec4 avgLookup = texelFetch(
    avg, coord, 0
  );
  float noiseCurLookup = texelFetch(
    noiseCur, coord, 0
  )[0];
  float noiseLastLookup = texelFetch(
    noiseLast, coord, 0
  )[0];
  float noise = noiseCurLookup * noiseInterp + noiseLastLookup * (1. - noiseInterp);

  float fillRatio = clamp(avgLookup[3] / ksize[0] / ksize[1] + noise, 0., 1.);
  float radiusFactor = fillRatio * 10.;
  float eff = exp(radiusFactor);
  float enff = exp(-radiusFactor);
  float tanhff = (eff - enff) / (eff + enff);
  float radius = (1. + tanhff) / 2. * min(ksize[0], ksize[1]) * 0.70710678118 / 2.;

  vec2 center = vec2(
    float(coord[0]) * ksize[0] + ksize[0] / 2. - 0.5,
    float(coord[1]) * ksize[1] + ksize[1] / 2. - 0.5
  );

  float dx = gl_FragCoord[0] - center[0];
  float dy = gl_FragCoord[1] - center[1];
  float dist = sqrt(dx * dx + dy * dy);

  float alpha = clamp((radius - dist) / 2., 0., 1.) * fillRatio * 2.;

  color = vec4(avgLookup[0], avgLookup[1], avgLookup[2], alpha);
}