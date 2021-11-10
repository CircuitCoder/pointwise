import SHADER_BINLIFT from './color-binlift.glsl';
import SHADER_REDUCE from './color-reduce.glsl';
import SHADER_COVER from './cover.glsl';

type Program = {
  input: WebGLTexture,
  stages: Stage[]
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
}

type Setup = (gl: WebGL2RenderingContext, prog: WebGLProgram, params: Record<string, any>) => void;

type Stage = {
  prog: WebGLProgram,
  fbo: WebGLFramebuffer,
  output: WebGLTexture,
  setup: Setup,
}

export function setup(canvas: HTMLCanvasElement): Program {
  // TODO: build maximum size texture
  const width = canvas.width;
  const height = canvas.height;

  const gl = getGL(canvas);

  const input = createTexture(gl, width, height);

  const [levels, binliftStages] = buildBinliftTower(gl, input, width, height, 12);
  const reduceStage = buildReducer(gl, levels, width, height);
  return {
    input,
    stages: [...binliftStages, reduceStage],
    gl,
    canvas,
  };
}

export function render(prog: Program, input: HTMLCanvasElement | HTMLImageElement, patch: number = 20) {
  // Update texture
  const { gl, input: texture, stages, canvas } = prog;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    input,
  );

  for(const stage of stages)
    renderStage(gl, stage, canvas.width, canvas.height, { patch });
}

function getGL(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2');
  if(!gl) throw new Error('WebGL 2 not supported!');
  return gl;
}

function compile(gl: WebGL2RenderingContext, src: string, shaderType = gl.FRAGMENT_SHADER): WebGLShader {
  console.log('Compile...', src);
  const shader = gl.createShader(shaderType);
  if(!shader) throw new Error('Shader type not supported');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  const compilationLog = gl.getShaderInfoLog(shader);
  console.log('Shader compiler log: ' + compilationLog);
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if(!compiled) throw new Error('Shader compilation failed');

  return shader;
}

function buildBinliftTower(gl: WebGL2RenderingContext, input: WebGLTexture, width: number, height: number, levels: number): [WebGLTexture[], Stage[]] {
  const shaderBinlift = compile(gl, SHADER_BINLIFT);

  let last = input;
  const textures = [input];
  const stages = [];
  for(let i = 0; i < (levels - 1); ++i) {
    const _i = i;
    const _last = last;

    const output = createRenderer(gl, shaderBinlift, width, height, (gl, prog) => {
      // TODO: profile this
      const biasLoc = gl.getUniformLocation(prog, "bias");
      const horizontalLoc = gl.getUniformLocation(prog, "horizontal");
      const sizeLoc = gl.getUniformLocation(prog, "size");

      gl.uniform1i(biasLoc, 1 << _i);
      gl.uniform1i(horizontalLoc, 0);
      gl.uniform2f(sizeLoc, width, height);

      attachTexture(gl, _last, 0)
    });

    last = output.output;

    textures.push(last);
    stages.push(output);
  }

  return [textures, stages];
}

function buildReducer(gl: WebGL2RenderingContext, levels: WebGLTexture[], width: number, height: number): Stage {
  if(levels.length !== 12) throw new Error('Currently only supports 12 levels');
  const shaderReduce = compile(gl, SHADER_REDUCE);
  return createRenderer(gl, shaderReduce, width, height, (gl, prog, { patch = 20 }) => {
    // TODO: profile this
    const enablesLoc = gl.getUniformLocation(prog, "enables");
    const horizontalLoc = gl.getUniformLocation(prog, "horizontal");
    const sizeLoc = gl.getUniformLocation(prog, "size");

    gl.uniform1iv(enablesLoc, binrepr(patch, 12), 0, 12);
    gl.uniform1i(horizontalLoc, 0);
    gl.uniform2f(sizeLoc, width, height);

    // Debug: unset frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    for(let i = 0; i < 12; ++i) attachTexture(gl, levels[i], i);
  });
}

function createTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture {
  // From https://webgl2fundamentals.org/webgl/lessons/webgl-render-to-texture.html
  const texture = gl.createTexture();
  if(!texture) throw new Error('Unable to create texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width, height, 0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}


function createRenderer(
  gl: WebGL2RenderingContext,
  shader: WebGLShader,
  width: number,
  height: number,
  setup: Setup,
): Stage {
  const prog = gl.createProgram();
  if(!prog) throw new Error('Unable to create WebGL program');
  const shaderCover = compile(gl, SHADER_COVER, gl.VERTEX_SHADER);
  gl.attachShader(prog, shaderCover);
  gl.attachShader(prog, shader);

  gl.linkProgram(prog);

  console.log("Program linkage: ", gl.getProgramInfoLog(prog));

  const output = createTexture(gl, width, height);
  const fbo = gl.createFramebuffer();
  if(!fbo) throw new Error('Unable to create WebGL FBO');
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    output,
    0
  );

  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    prog,
    fbo,
    output,
    setup,
  };
}

function renderStage(gl: WebGL2RenderingContext, stage: Stage, width: number, height: number, params: Record<string, any> = {}) {
  gl.useProgram(stage.prog);
  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, stage.fbo);
  stage.setup(gl, stage.prog, params);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function attachTexture(gl: WebGL2RenderingContext, texture: WebGLTexture, idx: number) {
  gl.activeTexture(gl.TEXTURE0 + idx);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

function binrepr(input: number, length: number): number[] {
  const output = new Array(length);

  for(let i = 0; i < length; ++i) {
    output[i] = input % 2;
    input >>= 1;
  }

  return output;
}