import {
  HalfFloatType,
  OrthographicCamera,
  RGBFormat,
  Texture,
  UnsignedByteType,
  Vector2,
  WebGLRenderer
} from "three";
import { AdvectionPass } from "./passes/AdvectionPass";
import { BoundaryPass } from "./passes/BoundaryPass";
import { ColorInitPass } from "./passes/ColorInitPass";
import { CompositionPass } from "./passes/CompositionPass";
import { DivergencePass } from "./passes/DivergencePass";
import { GradientSubstractionPass } from "./passes/GradientSubstractionPass";
import { JacobiIterationsPass } from "./passes/JacobiIterationsPass";
import { MouseColorPass } from "./passes/MouseColorPass";
import { MouseForcePass } from "./passes/MouseForcePass";
import { VelocityInitPass } from "./passes/VelocityInitPass";
import { RenderTarget } from "./RenderTarget";

// tslint:disable:no-var-requires
const Stats = require("stats.js");
const dat = require("dat.gui");
// tslint:enable:no-var-requires

// App configuration options.
const configuration = {
  Simulate: true,
  Iterations: 32,
  Radius: 0.25,
  Scale: 1.0,
  Boundaries: true,
  AddColor: true,
  Visualize: "Color",
  Timestep: "1/60",
  Reset: () => {
    velocityAdvectionPass.update({
      inputTexture: velocityInitTexture,
      velocity: velocityInitTexture
    });
    colorAdvectionPass.update({
      inputTexture: colorInitTexture,
      velocity: velocityInitTexture
    });
    v = undefined;
    c = undefined;
  },
  Github: () => {
    window.open("https://github.com/amsXYZ/three-fluid-sim");
  },
  Twitter: () => {
    window.open("https://twitter.com/_amsXYZ");
  }
};

// Html/Three.js initialization.
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const container = canvas.parentElement;
const stats = new Stats();
container.appendChild(stats.dom);
const gui = new dat.GUI();
initGUI();

const renderer = new WebGLRenderer({ canvas });
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
const camera = new OrthographicCamera(0, 0, 0, 0, 0, 0);
let dt = 1 / 60;

// Check floating point texture support.
if (!(renderer.context.getExtension("OES_texture_half_float") && renderer.context.getExtension("OES_texture_half_float_linear"))) {
  alert("This demo is not supported on your device.");
}

const resolution = new Vector2(
  (configuration.Scale * window.innerWidth) / window.devicePixelRatio,
  (configuration.Scale * window.innerHeight) / window.devicePixelRatio
);
const aspect = new Vector2(resolution.x / resolution.y, 1.0);

// RenderTargets initialization.
const velocityRT = new RenderTarget(resolution, 2, RGBFormat, HalfFloatType);
const divergenceRT = new RenderTarget(resolution, 1, RGBFormat, HalfFloatType);
const pressureRT = new RenderTarget(resolution, 2, RGBFormat, HalfFloatType);
const colorRT = new RenderTarget(resolution, 2, RGBFormat, UnsignedByteType);

// These variables are used to store the result the result of the different
// render passes. Not needed but nice for convenience.
let c: Texture;
let v: Texture;
let d: Texture;
let p: Texture;

// Render passes initialization.
const velocityInitPass = new VelocityInitPass(renderer, resolution);
const velocityInitTexture = velocityInitPass.render();
const colorInitPass = new ColorInitPass(renderer, resolution);
const colorInitTexture = colorInitPass.render();
const velocityAdvectionPass = new AdvectionPass(
  velocityInitTexture,
  velocityInitTexture
);
const colorAdvectionPass = new AdvectionPass(
  velocityInitTexture,
  colorInitTexture
);
const mouseForceAdditionPass = new MouseForcePass(
  resolution,
  configuration.Radius
);
const mouseColorAdditionPass = new MouseColorPass(
  resolution,
  configuration.Radius
);
const velocityBoundary = new BoundaryPass();
const velocityDivergencePass = new DivergencePass();
const pressurePass = new JacobiIterationsPass();
const pressureSubstractionPass = new GradientSubstractionPass();
const compositionPass = new CompositionPass();

// Event listeners (resizing and mouse/touch input).
window.addEventListener("resize", (event: UIEvent) => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  resolution.set(
    (configuration.Scale * window.innerWidth) / window.devicePixelRatio,
    (configuration.Scale * window.innerHeight) / window.devicePixelRatio
  );
  velocityRT.resize(resolution);
  divergenceRT.resize(resolution);
  pressureRT.resize(resolution);
  colorRT.resize(resolution);

  aspect.set(resolution.x / resolution.y, 1.0);
  mouseForceAdditionPass.update({ aspect });
  mouseColorAdditionPass.update({ aspect });
});

let isRecordingMouse = false;
const mousePosition = new Vector2();
const mouseVelocity = new Vector2();
container.addEventListener("mousedown", (event: MouseEvent) => {
  if (event.button === 0) {
    mousePosition.x = (event.clientX / canvas.clientWidth) * aspect.x;
    mousePosition.y = 1.0 - event.clientY / canvas.clientHeight;
    isRecordingMouse = true;
  }
});
container.addEventListener("touchstart", (event: TouchEvent) => {
  const touch = event.changedTouches[0];
  mousePosition.x = (touch.clientX / canvas.clientWidth) * 2 - 1;
  mousePosition.y = -(touch.clientY / canvas.clientHeight) * 2 + 1;
  isRecordingMouse = true;
});
container.addEventListener("mousemove", (event: MouseEvent) => {
  if (isRecordingMouse) {
    const x = (event.clientX / canvas.clientWidth) * aspect.x;
    const y = 1.0 - event.clientY / canvas.clientHeight;
    mouseVelocity.set(x, y).sub(mousePosition);
    mousePosition.set(x, y);
  }
});
container.addEventListener("touchmove", (event: TouchEvent) => {
  event.preventDefault();
  if (isRecordingMouse) {
    const touch = event.changedTouches[0];
    const x = (touch.clientX / canvas.clientWidth) * aspect.x;
    const y = 1.0 - touch.clientY / canvas.clientHeight;
    mouseVelocity.set(x, y).sub(mousePosition);
    mousePosition.set(x, y);
  }
});
container.addEventListener("mouseup", (event: MouseEvent) => {
  if (event.button === 0) {
    if (isRecordingMouse) {
      mouseVelocity.set(0, 0);
      mousePosition.set(0, 0);
      isRecordingMouse = false;
    }
  }
});
container.addEventListener("touchend", (event: MouseEvent) => {
  if (isRecordingMouse) {
    mouseVelocity.set(0, 0);
    mousePosition.set(0, 0);
    isRecordingMouse = false;
  }
});
container.addEventListener("touchcancel", (event: MouseEvent) => {
  if (isRecordingMouse) {
    mouseVelocity.set(0, 0);
    mousePosition.set(0, 0);
    isRecordingMouse = false;
  }
});

// Dat.GUI configuration.
function initGUI() {
  const sim = gui.addFolder("Simulation");
  sim
    .add(configuration, "Scale", 0.1, 2.0, 0.1)
    .onFinishChange((value: number) => {
      resolution.set(
        (configuration.Scale * window.innerWidth) / window.devicePixelRatio,
        (configuration.Scale * window.innerHeight) / window.devicePixelRatio
      );
      velocityRT.resize(resolution);
      divergenceRT.resize(resolution);
      pressureRT.resize(resolution);
      colorRT.resize(resolution);
    });
  sim.add(configuration, "Iterations", 16, 128, 1);
  sim
    .add(configuration, "Timestep", ["1/15", "1/30", "1/60", "1/90", "1/120"])
    .onChange((value: string) => {
      switch (value) {
        case "1/15":
          dt = 1 / 15;
          break;
        case "1/30":
          dt = 1 / 30;
          break;
        case "1/60":
          dt = 1 / 60;
          break;
        case "1/90":
          dt = 1 / 90;
          break;
        case "1/120":
          dt = 1 / 120;
          break;
      }
    });
  sim.add(configuration, "Simulate");
  sim.add(configuration, "Boundaries");
  sim.add(configuration, "Reset");

  const input = gui.addFolder("Input");
  input.add(configuration, "Radius", 0.1, 1, 0.1);
  input.add(configuration, "AddColor");

  gui.add(configuration, "Visualize", [
    "Color",
    "Velocity",
    "Divergence",
    "Pressure"
  ]);

  const github = gui.add(configuration, "Github");
  github.__li.className = "guiIconText";
  github.__li.style.borderLeft = "3px solid #8C8C8C";
  const githubIcon = document.createElement("span");
  githubIcon.className = "guiIcon github";
  github.domElement.parentElement.appendChild(githubIcon);

  const twitter = gui.add(configuration, "Twitter");
  twitter.__li.className = "guiIconText";
  twitter.__li.style.borderLeft = "3px solid #8C8C8C";
  const twitterIcon = document.createElement("span");
  twitterIcon.className = "guiIcon twitter";
  twitter.domElement.parentElement.appendChild(twitterIcon);
}

// Render loop.
function render() {
  if (configuration.Simulate) {
    // Advect the velocity vector field.
    velocityAdvectionPass.update({ timeDelta: dt });
    v = velocityRT.set(renderer);
    renderer.render(velocityAdvectionPass.scene, camera);

    // Add external forces/colors according to input.
    if (mouseVelocity.length() > 0) {
      mouseForceAdditionPass.update({
        mousePosition,
        mouseDirection: mouseVelocity,
        mouseRadius: configuration.Radius,
        velocity: v
      });
      v = velocityRT.set(renderer);
      renderer.render(mouseForceAdditionPass.scene, camera);

      if (configuration.AddColor) {
        mouseColorAdditionPass.update({
          mousePosition,
          mouseDirection: mouseVelocity,
          mouseRadius: configuration.Radius,
          color: c
        });
        c = colorRT.set(renderer);
        renderer.render(mouseColorAdditionPass.scene, camera);
      }
    }

    // Add velocity boundaries (simulation walls).
    if (configuration.Boundaries) {
      velocityBoundary.update({ velocity: v });
      v = velocityRT.set(renderer);
      renderer.render(velocityBoundary.scene, camera);
    }

    // Compute the divergence of the advected velocity vector field.
    velocityDivergencePass.update({
      timeDelta: dt,
      velocity: v
    });
    d = divergenceRT.set(renderer);
    renderer.render(velocityDivergencePass.scene, camera);

    // Compute the pressure gradient of the advected velocity vector field (using
    // jacobi iterations).
    pressurePass.update({ divergence: d });
    for (let i = 0; i < configuration.Iterations; ++i) {
      p = pressureRT.set(renderer);
      renderer.render(pressurePass.scene, camera);
      pressurePass.update({ previousIteration: p });
    }

    // Substract the pressure gradient from to obtain a velocity vector field with
    // zero divergence.
    pressureSubstractionPass.update({
      timeDelta: dt,
      velocity: v,
      pressure: p
    });
    v = velocityRT.set(renderer);
    renderer.render(pressureSubstractionPass.scene, camera);

    // Advect the color buffer with the divergence-free velocity vector field.
    colorAdvectionPass.update({
      timeDelta: dt,
      inputTexture: c,
      velocity: v
    });
    c = colorRT.set(renderer);
    renderer.render(colorAdvectionPass.scene, camera);

    // Feed the input of the advection passes with the last advected results.
    velocityAdvectionPass.update({
      inputTexture: v,
      velocity: v
    });
    colorAdvectionPass.update({
      inputTexture: c
    });
  }

  // Render to the main framebuffer the desired visualization.
  renderer.setRenderTarget(null);
  let visualization;
  switch (configuration.Visualize) {
    case "Color":
      visualization = c;
      break;
    case "Velocity":
      visualization = v;
      break;
    case "Divergence":
      visualization = d;
      break;
    case "Pressure":
      visualization = p;
      break;
  }
  compositionPass.update({ colorBuffer: visualization });
  renderer.render(compositionPass.scene, camera);
}
function animate() {
  requestAnimationFrame(animate);
  stats.begin();
  render();
  stats.end();
}
animate();
