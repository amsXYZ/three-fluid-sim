import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  RawShaderMaterial,
  Scene,
  Texture,
  Uniform,
  Vector2,
  Vector4
} from "three";

const MAX_TOUCHES = 10;

export class TouchColorPass {
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
        input0: new Uniform(new Vector4()),
        input1: new Uniform(new Vector4()),
        input2: new Uniform(new Vector4()),
        input3: new Uniform(new Vector4()),
        input4: new Uniform(new Vector4()),
        input5: new Uniform(new Vector4()),
        input6: new Uniform(new Vector4()),
        input7: new Uniform(new Vector4()),
        input8: new Uniform(new Vector4()),
        input9: new Uniform(new Vector4()),
        radius: new Uniform(radius),
        color: new Uniform(Texture.DEFAULT_IMAGE)
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
        uniform vec4 input0;
        uniform vec4 input1;
        uniform vec4 input2;
        uniform vec4 input3;
        uniform vec4 input4;
        uniform vec4 input5;
        uniform vec4 input6;
        uniform vec4 input7;
        uniform vec4 input8;
        uniform vec4 input9;
        uniform float radius;
        uniform sampler2D color;

        vec2 getColor(vec4 inputVec) {
          float d = distance(vScaledUV, inputVec.xy) / radius;
          float strength = 1.0 / max(d * d, 0.01);
          strength *= clamp(dot(normalize(vScaledUV - inputVec.xy), normalize(inputVec.zw)), 0.0, 1.0);
          return strength * abs(inputVec.zw) * radius;
        }

        void main() {
          vec4 touchColor = vec4(0.0);
          touchColor.xy += getColor(input0);
          touchColor.xy += getColor(input1);
          touchColor.xy += getColor(input2);
          touchColor.xy += getColor(input3);
          touchColor.xy += getColor(input4);
          touchColor.xy += getColor(input5);
          touchColor.xy += getColor(input6);
          touchColor.xy += getColor(input7);
          touchColor.xy += getColor(input8);
          touchColor.xy += getColor(input9);

          gl_FragColor = texture2D(color, vUV) + touchColor;
        }`,
      depthTest: false,
      depthWrite: false
    });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.frustumCulled = false; // Just here to silence a console error.
    this.scene.add(this.mesh);
  }

  public update(uniforms: any): void {
    if (uniforms.aspect !== undefined) {
      this.material.uniforms.aspect.value = uniforms.aspect;
    }
    if (uniforms.touches !== undefined) {
      const touchMax = Math.min(MAX_TOUCHES, uniforms.touches.length);
      for (let i = 0; i < touchMax; ++i) {
        this.material.uniforms["input" + i].value = uniforms.touches[i].input;
      }
      for (let i = uniforms.touches.length; i < MAX_TOUCHES; ++i) {
        this.material.uniforms["input" + i].value.set(0, 0, 0, 0);
      }
    }
    if (uniforms.radius !== undefined) {
      this.material.uniforms.radius.value = uniforms.radius;
    }
    if (uniforms.color !== undefined) {
      this.material.uniforms.color.value = uniforms.color;
    }
  }
}
