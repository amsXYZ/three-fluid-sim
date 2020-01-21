import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  RawShaderMaterial,
  Scene,
  Texture,
  Uniform
} from "three";

export class DivergencePass {
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
        timeDelta: new Uniform(0.0),
        velocity: new Uniform(Texture.DEFAULT_IMAGE)
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
          uniform float timeDelta;
          uniform sampler2D velocity;
         
          void main() {
            vec2 texelSize = vec2(dFdx(vUV.x), dFdy(vUV.y));
            
            float x0 = texture2D(velocity, vUV - vec2(texelSize.x, 0)).x;
            float x1 = texture2D(velocity, vUV + vec2(texelSize.x, 0)).x;
            float y0 = texture2D(velocity, vUV - vec2(0, texelSize.y)).y;
            float y1 = texture2D(velocity, vUV + vec2(0, texelSize.y)).y;
            float divergence = ( x1 - x0 + y1 - y0) * 0.5;
            
            gl_FragColor = vec4(divergence);
          }`,
      depthTest: false,
      depthWrite: false,
      extensions: { derivatives: true }
    });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.frustumCulled = false; // Just here to silence a console error.
    this.scene.add(this.mesh);
  }

  public update(uniforms: any): void {
    if (uniforms.timeDelta !== undefined) {
      this.material.uniforms.timeDelta.value = uniforms.timeDelta;
    }
    if (uniforms.density !== undefined) {
      this.material.uniforms.density.value = uniforms.density;
    }
    if (uniforms.velocity !== undefined) {
      this.material.uniforms.velocity.value = uniforms.velocity;
    }
  }
}
