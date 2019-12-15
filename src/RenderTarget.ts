import { Texture, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";

interface IBuffer {
  target: WebGLRenderTarget;
  needsResize: boolean;
}

export class RenderTarget {
  private index: number;
  private buffers: IBuffer[];

  constructor(
    readonly resolution: Vector2,
    readonly nBuffers: number,
    readonly format: number,
    readonly type: number
  ) {
    this.index = 0;
    this.buffers = [
      {
        target: new WebGLRenderTarget(resolution.x, resolution.y, {
          format,
          type,
          depthBuffer: false,
          stencilBuffer: false
        }),
        needsResize: false
      }
    ];
    for (let i = 1; i < nBuffers; ++i) {
      this.buffers[i] = {
        target: this.buffers[0].target.clone(),
        needsResize: false
      };
    }
  }

  public resize(resolution: Vector2): void {
    resolution.copy(resolution);
    for (let i = 0; i < this.nBuffers; ++i) {
      this.buffers[i].needsResize = true;
    }
  }

  public set(renderer: WebGLRenderer): Texture {
    const buffer = this.buffers[this.index++];
    if (buffer.needsResize) {
      buffer.needsResize = false;
      buffer.target.setSize(this.resolution.x, this.resolution.y);
    }
    renderer.setRenderTarget(buffer.target);
    this.index %= this.nBuffers;
    return buffer.target.texture;
  }
}
