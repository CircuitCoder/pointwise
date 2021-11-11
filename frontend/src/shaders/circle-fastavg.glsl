#version 300 es
precision highp float;

out vec4 color;
uniform sampler2D orig;

// TODO: grid transform
uniform float ksize;
uniform vec2 size;

void main() {
  vec2 center = vec2(
    floor(gl_FragCoord[0] / ksize) * ksize + ksize / 2. - 0.5,
    floor(gl_FragCoord[1] / ksize) * ksize + ksize / 2. - 0.5
  );

  vec4 avgLookup = texture(
    orig, vec2(center[0] / size[0], center[1] / size[1]), log2(ksize)
  );

  float fillRatio = avgLookup[3];
  float fillFactor = fillRatio * ksize * ksize;
  float eff = exp(fillFactor);
  float enff = exp(-fillFactor);
  float tanhff = (eff - enff) / (eff + enff);
  float radius = tanhff * ksize * 0.3; // TODO: make 0.8 an uniform variable

  float dx = gl_FragCoord[0] - center[0];
  float dy = gl_FragCoord[1] - center[1];
  float dist = sqrt(dx * dx + dy * dy);

  float alpha = clamp((radius - dist) / 2., 0., 1.) * 0.2;

  // color = vec4(avgLookup[0], avgLookup[1], avgLookup[2], alpha);
  color = avgLookup;
}