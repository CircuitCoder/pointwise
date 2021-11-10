#version 300 es
precision highp float;

out vec4 color;
uniform sampler2D avg;

// TODO: grid transform
uniform vec2 ksize;
uniform vec2 size;

void main() {
  ivec2 avgCoord = ivec2(
    floor(gl_FragCoord[0] / ksize[0]) * ksize[0],
    floor(gl_FragCoord[1] / ksize[1]) * ksize[1]
  );
  vec4 avgLookup = texelFetch(
    avg, avgCoord, 0
  );
  float fillRatio = avgLookup[3] / ksize[0] / ksize[1];
  float fillFactor = fillRatio * ksize[0] * ksize[1];
  float eff = exp(fillFactor);
  float enff = exp(-fillFactor);
  float tanhff = (eff - enff) / (eff + enff);
  float radius = tanhff * min(ksize[0], ksize[1]) * 0.4; // TODO: make 0.8 an uniform variable

  vec2 center = vec2(
    float(avgCoord[0]) + ksize[0] / 2. - 0.5,
    float(avgCoord[1]) + ksize[1] / 2. - 0.5
  );

  float dx = gl_FragCoord[0] - center[0];
  float dy = gl_FragCoord[1] - center[1];
  float dist = sqrt(dx * dx + dy * dy);

  float alpha = clamp((radius - dist) / 2., 0., 1.) * 0.2;

  color = vec4(avgLookup[0], avgLookup[1], avgLookup[2], alpha);
}