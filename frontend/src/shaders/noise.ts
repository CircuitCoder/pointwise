import { Random } from 'pointwise-render';
import { createTextureInternal } from '.';

export class Noise {
  rng: Random

  public last: WebGLTexture
  public cur: WebGLTexture

  buffer: Float32Array;
  mean: number;
  stddev: number;
  width: number;
  height: number;

  constructor(gl: WebGL2RenderingContext, rng: Random, width: number, height: number, mean: number, stddev: number) {
    this.cur = createTextureInternal(gl, width, height, gl.R32F);
    this.last = createTextureInternal(gl, width, height, gl.R32F);

    this.rng = rng;
    this.stddev = stddev;
    this.mean = mean;
    this.width = width;
    this.height = height;

    this.buffer = new Float32Array(width * height)

    // Initialize last & cur
    this.swap(gl);
    this.swap(gl);
  }

  public swap(gl: WebGL2RenderingContext) {
    const tmp = this.last;
    this.last = this.cur;
    this.cur = tmp;

    // Fill cur with new data
    this.rng.fill_noise_f32(this.buffer, this.mean, this.stddev);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RED, gl.FLOAT, this.buffer);
  }
}