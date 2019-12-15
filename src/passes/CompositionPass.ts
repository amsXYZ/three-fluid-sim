import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  RawShaderMaterial,
  Scene,
  Texture,
  Uniform
} from "three";

export class CompositionPass {
  public readonly scene: Scene;

  private material: RawShaderMaterial;
  private mesh: Mesh;

  constructor() {
    this.scene = new Scene();

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array([-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1]),
        2
      )
    );
    this.material = new RawShaderMaterial({
      uniforms: {
        colorBuffer: new Uniform(Texture.DEFAULT_IMAGE)
      },
      vertexShader: `
          attribute vec2 position;
          varying vec2 vUV;
          
          void main() {
            vUV = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
          }`,
      fragmentShader: `
          precision highp float;
          precision highp int;
          varying vec2 vUV;
          uniform sampler2D colorBuffer;

          void main() {
            gl_FragColor = texture2D(colorBuffer, vUV);
          }`,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.frustumCulled = false; // Just here to silence a console error.
    this.scene.add(this.mesh);
  }

  public update(uniforms: any): void {
    if (uniforms.colorBuffer) {
      this.material.uniforms.colorBuffer.value = uniforms.colorBuffer;
    }
  }
}
