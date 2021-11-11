import SHADER_BINLIFT from './color-binlift.glsl';
import SHADER_REDUCE from './color-reduce.glsl';
import SHADER_COVER from './cover.glsl';
import SHADER_CIRCLE from './circle.glsl';
import ShADER_CIRCLE_FASTAVG from './circle-fastavg.glsl'

const LEVELS = 5;

type Program = {
  input: WebGLTexture,
  stages: Stage[]
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
}

type Setup = (gl: WebGL2RenderingContext, stage: Stage, params: Record<string, any>) => void;

type Stage = {
  prog: WebGLProgram,
  fbo: WebGLFramebuffer,
  output: WebGLTexture,
  setup: Setup,
  uniforms: Record<string, WebGLUniformLocation>,
  final: boolean,
}

export function setup(canvas: HTMLCanvasElement): Program {
  // TODO: build maximum size texture
  const width = canvas.width;
  const height = canvas.height;

  const gl = getGL(canvas);

  const input = createTexture(gl, width, height);

  const [vertLevels, vertBinliftStages] = buildBinliftTower(gl, input, width, height, false);
  const vertReduceStage = buildReducer(gl, vertLevels, width, height, false);

  const [hozLevels, hozBinliftStages] = buildBinliftTower(gl, vertReduceStage.output, width, height, true);
  const hozReduceStage = buildReducer(gl, hozLevels, width, height, true);

  const circleFilterStage = buildCircleFilter(gl, hozReduceStage.output, width, height);

  return {
    input,
    stages: [...vertBinliftStages, vertReduceStage, ...hozBinliftStages, hozReduceStage, circleFilterStage],
    gl,
    canvas,
  };
}

export function render(prog: Program, input: HTMLCanvasElement | HTMLImageElement, patch: number = 40) {
  // Update texture
  const { gl, input: texture, stages, canvas } = prog;

  // gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    input,
  );
  gl.generateMipmap(gl.TEXTURE_2D);

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

function buildBinliftTower(gl: WebGL2RenderingContext, input: WebGLTexture, width: number, height: number, horizontal: boolean): [WebGLTexture[], Stage[]] {
  const shaderBinlift = compile(gl, SHADER_BINLIFT);

  let last = input;
  const textures = [input];
  const stages = [];
  for(let i = 0; i < (LEVELS - 1); ++i) {
    const _i = i;
    const _last = last;

    const output = createRenderer(gl, shaderBinlift, width, height, (gl, stage) => {
      gl.uniform1i(stage.uniforms.bias, 1 << _i);
      gl.uniform1i(stage.uniforms.horizontal, horizontal ? 0 : 1);

      attachTexture(gl, _last, 0)
      gl.uniform1i(stage.uniforms.last, 0);
    });

    last = output.output;

    textures.push(last);
    stages.push(output);
  }

  return [textures, stages];
}

function buildReducer(gl: WebGL2RenderingContext, levels: WebGLTexture[], width: number, height: number, horizontal: boolean): Stage {
  if(levels.length !== LEVELS) throw new Error('Currently only supports ${LEVELS} levels');
  const shaderReduce = compile(gl, SHADER_REDUCE);
  return createRenderer(gl, shaderReduce, width, height, (gl, stage, { patch }) => {
    const bin = binrepr(patch, LEVELS);
    gl.uniform1iv(stage.uniforms['enables[0]'], Uint32Array.from(bin));
    gl.uniform1i(stage.uniforms.horizontal, horizontal ? 0 : 1)

    for(let i = 0; i < LEVELS; ++i) {
      attachTexture(gl, levels[i], i);
      gl.uniform1i(stage.uniforms[`level_${i}`], i);
    }
  });
}

function buildCircleFilter(gl: WebGL2RenderingContext, avg: WebGLTexture, width: number, height: number): Stage {
  const shaderCircle = compile(gl, SHADER_CIRCLE);
  return createRenderer(
    gl,
    shaderCircle,
    width,
    height,
    (gl, stage, { patch }) => {
      gl.uniform2f(stage.uniforms.ksize, patch, patch);

      attachTexture(gl, avg, 0)
      gl.uniform1i(stage.uniforms.avg, 0);
    },
    true,
  );
}

function buildCircleFastavgFilter(gl: WebGL2RenderingContext, orig: WebGLTexture, width: number, height: number): Stage {
  const shaderCircleFastavg = compile(gl, ShADER_CIRCLE_FASTAVG);
  return createRenderer(
    gl,
    shaderCircleFastavg,
    width,
    height,
    (gl, stage, { patch }) => {
      gl.uniform1f(stage.uniforms.ksize, patch);
      gl.uniform2f(stage.uniforms.size, width, height);

      attachTexture(gl, orig, 0)
      gl.uniform1i(stage.uniforms.orig, 0);
    },
    true,
  );
}

function createTexture(gl: WebGL2RenderingContext, width: number, height: number, withMipmap = false): WebGLTexture {
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

  if(!withMipmap) {
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  return texture;
}


function createRenderer(
  gl: WebGL2RenderingContext,
  shader: WebGLShader,
  width: number,
  height: number,
  setup: Setup,
  final = false,
): Stage {
  const prog = gl.createProgram();
  if(!prog) throw new Error('Unable to create WebGL program');
  const shaderCover = compile(gl, SHADER_COVER, gl.VERTEX_SHADER);
  gl.attachShader(prog, shaderCover);
  gl.attachShader(prog, shader);

  gl.linkProgram(prog);

  console.log("Program linkage: ", gl.getProgramInfoLog(prog));
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('WebGL Program linking failure');

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
    uniforms: getUniforms(gl, prog),
    final,
  };
}

function renderStage(gl: WebGL2RenderingContext, stage: Stage, width: number, height: number, params: Record<string, any> = {}) {
  gl.useProgram(stage.prog);
  gl.viewport(0, 0, width, height);
  if(!stage.final) gl.bindFramebuffer(gl.FRAMEBUFFER, stage.fbo);
  else gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  stage.setup(gl, stage, params);
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

function getUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram): Record<string, WebGLUniformLocation> {
  const result: Record<string, WebGLUniformLocation> = {};
  const cnt: number = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for(let i = 0; i < cnt; i++) {
    const uniform = gl.getActiveUniform(prog, i);
    console.log(uniform);
    if(uniform === null) throw new Error(`Unable to find uniform ${i}`);
    const loc = gl.getUniformLocation(prog, uniform.name);
    if(loc === null) throw new Error(`Unable to find uniform location for ${uniform.name}`);
    result[uniform.name] = loc;
  }
  return result;
}