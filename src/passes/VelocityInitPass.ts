import {
  BufferAttribute,
  BufferGeometry,
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  RawShaderMaterial,
  RGBFormat,
  Scene,
  Texture,
  Uniform,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from "three";

export class VelocityInitPass {
  public readonly scene: Scene;
  public readonly camera: OrthographicCamera;

  private geometry: BufferGeometry;
  private material: RawShaderMaterial;
  private mesh: Mesh;

  private renderTarget: WebGLRenderTarget;

  constructor(readonly renderer: WebGLRenderer, readonly resolution: Vector2) {
    this.scene = new Scene();
    this.camera = new OrthographicCamera(0, 0, 0, 0, 0, 0);

    this.renderTarget = new WebGLRenderTarget(resolution.x, resolution.y, {
      format: RGBFormat,
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false
    });

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array([-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1]),
        2
      )
    );
    this.material = new RawShaderMaterial({
      uniforms: {
        scale: new Uniform(
          window.innerWidth > window.innerHeight
            ? new Vector2(window.innerWidth / window.innerHeight, 1.0)
            : new Vector2(1.0, window.innerHeight / window.innerWidth)
        )
      },
      vertexShader: `
        attribute vec2 position;
        varying vec2 clipPos;

        void main() {
          clipPos = position;
          gl_Position = vec4(position, 0.0, 1.0);
        }`,
      fragmentShader: `
        #define PI 3.1415926535897932384626433832795  
        precision highp float;
        precision highp int;
        varying vec2 clipPos;

        void main() {
          vec2 v = vec2(sin(2.0 * PI * clipPos.y), sin(2.0 * PI * clipPos.x));
          gl_FragColor = vec4(v, 0.0, 1.0);
        }`,
      depthTest: false,
      depthWrite: false
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false; // Just here to silence a console error.
    this.scene.add(this.mesh);
  }

  public update(uniforms: any): void {
    if (uniforms.width !== undefined && uniforms.height !== undefined) {
      this.renderTarget.setSize(uniforms.width, uniforms.height);

      const isWider = window.innerWidth > window.innerHeight;
      isWider
        ? this.material.uniforms.scale.value.set(
            window.innerWidth / window.innerHeight,
            1.0
          )
        : this.material.uniforms.scale.value.set(
            1.0,
            window.innerHeight / window.innerWidth
          );
    }
  }

  public render(): Texture {
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    return this.renderTarget.texture;
  }
}
