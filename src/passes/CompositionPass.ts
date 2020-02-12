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
        colorBuffer: new Uniform(Texture.DEFAULT_IMAGE),
        gradient: new Uniform(Texture.DEFAULT_IMAGE)
      },
      defines: {
        MODE: 0
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
          uniform sampler2D gradient;

          const vec3 W = vec3(0.2125, 0.7154, 0.0721);
          float luminance(in vec3 color) {
            return dot(color, W);
          }

          // Based on code by Spektre posted at http://stackoverflow.com/questions/3407942/rgb-values-of-visible-spectrum
          vec4 spectral(float l) // RGB <0,1> <- lambda l <400,700> [nm]
          {
            float r=0.0,g=0.0,b=0.0;
                  if ((l>=400.0)&&(l<410.0)) { float t=(l-400.0)/(410.0-400.0); r=    +(0.33*t)-(0.20*t*t); }
              else if ((l>=410.0)&&(l<475.0)) { float t=(l-410.0)/(475.0-410.0); r=0.14         -(0.13*t*t); }
              else if ((l>=545.0)&&(l<595.0)) { float t=(l-545.0)/(595.0-545.0); r=    +(1.98*t)-(     t*t); }
              else if ((l>=595.0)&&(l<650.0)) { float t=(l-595.0)/(650.0-595.0); r=0.98+(0.06*t)-(0.40*t*t); }
              else if ((l>=650.0)&&(l<700.0)) { float t=(l-650.0)/(700.0-650.0); r=0.65-(0.84*t)+(0.20*t*t); }
                  if ((l>=415.0)&&(l<475.0)) { float t=(l-415.0)/(475.0-415.0); g=             +(0.80*t*t); }
              else if ((l>=475.0)&&(l<590.0)) { float t=(l-475.0)/(590.0-475.0); g=0.8 +(0.76*t)-(0.80*t*t); }
              else if ((l>=585.0)&&(l<639.0)) { float t=(l-585.0)/(639.0-585.0); g=0.82-(0.80*t)           ; }
                  if ((l>=400.0)&&(l<475.0)) { float t=(l-400.0)/(475.0-400.0); b=    +(2.20*t)-(1.50*t*t); }
              else if ((l>=475.0)&&(l<560.0)) { float t=(l-475.0)/(560.0-475.0); b=0.7 -(     t)+(0.30*t*t); }

            return vec4(r, g, b, 1.0);
          }

          void main() {
            vec4 color = texture2D(colorBuffer, vUV);
            float lum = luminance(abs(color.rgb));
            #if MODE == 0
            gl_FragColor = color;
            #elif MODE == 1
            gl_FragColor = vec4(lum);
            #elif MODE == 2
            gl_FragColor = spectral(mix(340.0, 700.0, lum));
            #elif MODE == 3
            gl_FragColor = texture2D(gradient, vec2(lum, 0.0));
            #endif
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
    if (uniforms.colorBuffer !== undefined) {
      this.material.uniforms.colorBuffer.value = uniforms.colorBuffer;
    }
    if (uniforms.mode !== undefined) {
      let mode = 0;
      switch (uniforms.mode) {
        case "Luminance":
          mode = 1;
          break;
        case "Spectral":
          mode = 2;
          break;
        case "Gradient":
          mode = 3;
          break;
        case "Normal":
        default:
      }
      if (mode !== this.material.defines.MODE) {
        this.material.defines.MODE = mode;
        this.material.needsUpdate = true;
      }
    }
    if (uniforms.gradient !== undefined) {
      this.material.uniforms.gradient.value = uniforms.gradient;
    }
  }
}
