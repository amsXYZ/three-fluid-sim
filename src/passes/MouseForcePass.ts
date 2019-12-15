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

export class MouseForcePass {
  public readonly scene: Scene;

  private material: RawShaderMaterial;
  private mesh: Mesh;

  constructor(readonly resolution: Vector2, readonly radius: number) {
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
        aspect: new Uniform(new Vector2(resolution.x / resolution.y, 1.0)),
        position: new Uniform(new Vector2()),
        direction: new Uniform(new Vector2()),
        radius: new Uniform(radius),
        velocity: new Uniform(Texture.DEFAULT_IMAGE)
      },
      vertexShader: `
        attribute vec2 position;
        varying vec2 vUV;
        varying vec2 vScaledUV;
        uniform vec2 aspect;

        void main() {
          vUV = position * 0.5 + 0.5;
          vScaledUV = position * aspect * 0.5 + aspect * 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        precision highp int;
        varying vec2 vUV;
        varying vec2 vScaledUV;
        uniform vec2 position;
        uniform vec2 direction;
        uniform float radius;
        uniform sampler2D velocity;

        void main() {
          float d = distance(vScaledUV, position) / radius;
          float strength = 1.0 / max(d * d, 0.01);
          strength *= clamp(dot(normalize(vScaledUV - position), normalize(direction)), 0.0, 1.0);

          gl_FragColor = texture2D(velocity, vUV) + vec4(strength * direction, 0.0, 0.0);
        }`,
      depthTest: false,
      depthWrite: false
    });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.frustumCulled = false; // Just here to silence a console error.
    this.scene.add(this.mesh);
  }

  public update(uniforms: any): void {
    if (uniforms.aspect) {
      this.material.uniforms.aspect.value = uniforms.aspect;
    }
    if (uniforms.position) {
      this.material.uniforms.position.value = uniforms.position;
    }
    if (uniforms.direction) {
      this.material.uniforms.direction.value = uniforms.direction;
    }
    if (uniforms.radius) {
      this.material.uniforms.radius.value = uniforms.radius;
    }
    if (uniforms.velocity) {
      this.material.uniforms.velocity.value = uniforms.velocity;
    }
  }
}
