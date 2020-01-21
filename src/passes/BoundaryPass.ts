import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  RawShaderMaterial,
  Scene,
  Texture,
  Uniform,
  Vector2
} from "three";

export class BoundaryPass {
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
        uniform sampler2D velocity;

        void main() {
          vec2 texelSize = vec2(dFdx(vUV.x), dFdy(vUV.y));

          float leftEdgeMask = ceil(texelSize.x - vUV.x);
          float bottomEdgeMask = ceil(texelSize.y - vUV.y);
          float rightEdgeMask = ceil(vUV.x - (1.0 - texelSize.x));
          float topEdgeMask = ceil(vUV.y - (1.0 - texelSize.y));
          float mask = clamp(leftEdgeMask + bottomEdgeMask + rightEdgeMask + topEdgeMask, 0.0, 1.0);
          float direction = mix(1.0, -1.0, mask);
          
          gl_FragColor = texture2D(velocity, vUV) * direction;
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
    if (uniforms.position !== undefined) {
      this.material.uniforms.position.value = uniforms.position;
    }
    if (uniforms.direction !== undefined) {
      this.material.uniforms.direction.value = uniforms.direction;
    }
    if (uniforms.radius !== undefined) {
      this.material.uniforms.radius.value = uniforms.radius;
    }
    if (uniforms.velocity !== undefined) {
      this.material.uniforms.velocity.value = uniforms.velocity;
    }
  }
}
