/**
 * three.js scene for the 3D scissors (change xiax-lp-v3-scissors-3d · design D2).
 * Loaded only through a dynamic import after the page is idle, so `three` never lands in
 * the route's first-load JS. One transparent full-screen canvas; the camera is placed so
 * 1 world unit on the z = 0 plane equals 1 CSS pixel, letting the stage position the
 * model with plain viewport coordinates. Frames are drawn on demand only.
 *
 * GLB contract (assets/3d/scissors/build-scissors.py): nodes `Scissors` › `BladeL`,
 * `BladeR`, `Rivet`; blade origins on the rivet; length 1.0; tips toward −Y; opening =
 * BladeL about +Z and BladeR about −Z.
 *
 * The tool that runs the steps' line joins the same renderer, scene and camera — no second
 * WebGL context. It loads on its own after the scissors, so a broken tool GLB never takes the
 * scissors down, and only the page's own tool is fetched (change xiax-lp-v5-salon · D7).
 *  - razor (change xiax-lp-v3-razor-3d · design D2, assets/3d/razor/build-razor.py): nodes
 *    `Razor` › `Handle`, `Blade`, `Pivot`; pivots on the pin; length 1.0 open; tip toward −Y;
 *    folding = `Blade` about +Z.
 *  - round brush (assets/3d/brush/build-brush.py): nodes `Brush` › `Handle`, `Barrel`,
 *    `Bristles`; origin on the barrel centre; length 1.0; handle toward −Y; the roll =
 *    `Barrel` and `Bristles` about their own Y (the cylinder axis).
 *
 * The lights follow the page theme (`lightingPreset`, change xiax-lp-v5-salon · D7).
 */
import {
  DirectionalLight,
  MathUtils,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import type { ScissorsPose } from "@/lib/motion/scissors-path";
import type { SweepTool, ToolPose } from "@/lib/motion/sweep-tool";
import type { LightingPreset } from "@/lib/three/lighting";

/** Low FOV keeps perspective subtle: the model reads as an object, not a fisheye. */
const FOV_DEG = 15;
/** Key light from the upper left, in front; its colour and strength come with the theme. */
const KEY_POSITION = [-0.6, 1, 1.2] as const;

export interface ScissorsScene {
  setPose(pose: ScissorsPose): void;
  /** Adds the line's tool to the scene; rejects, leaving the scissors untouched, if it fails. */
  loadTool(tool: SweepTool, url: string): Promise<void>;
  /** Poses the tool, or hides it with null. Ignored until `loadTool` resolves. */
  setToolPose(pose: ToolPose | null): void;
  resize(width: number, height: number): void;
  /** Draws a frame only if the pose or size changed since the last one. */
  render(): boolean;
  dispose(): void;
}

interface Parts {
  root: Object3D;
  bladeL: Object3D;
  bladeR: Object3D;
}

function findParts(scene: Object3D): Parts {
  const bladeL = scene.getObjectByName("BladeL");
  const bladeR = scene.getObjectByName("BladeR");
  if (!bladeL || !bladeR) throw new Error("scissors.glb is missing BladeL/BladeR");
  return { root: scene.getObjectByName("Scissors") ?? scene, bladeL, bladeR };
}

interface Size {
  width: number;
  height: number;
}

interface Placement {
  x: number;
  y: number;
  lengthPx: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}

/**
 * Puts a model's pivot at viewport px. Pose angles follow CSS conventions (y down), so X and
 * Z flip for three's y-up world.
 */
function place(root: Object3D, pose: Placement, size: Size) {
  root.position.set(pose.x - size.width / 2, size.height / 2 - pose.y, 0);
  root.scale.setScalar(pose.lengthPx);
  root.rotation.set(MathUtils.degToRad(-pose.rotX), MathUtils.degToRad(pose.rotY), MathUtils.degToRad(-pose.rotZ));
}

function disposeTree(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((m) => m.dispose());
  });
}

/** Distance at which the camera sees exactly `heightPx` units at z = 0. */
const pixelDistance = (heightPx: number) => heightPx / 2 / Math.tan(MathUtils.degToRad(FOV_DEG / 2));

/**
 * Builds the renderer and loads the model.
 * @param canvas - full-screen transparent canvas
 * @param modelUrl - URL of scissors.glb
 * @param maxDpr - device pixel ratio cap
 * @param lighting - the page theme's lights (`lightingPreset`)
 * @throws when WebGL is unavailable or the model breaks the contract
 */
export async function createScissorsScene(
  canvas: HTMLCanvasElement,
  modelUrl: string,
  maxDpr: number,
  lighting: LightingPreset,
): Promise<ScissorsScene> {
  const studio = createStudio(canvas, maxDpr, lighting);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let gltfScene: Object3D;
  try {
    gltfScene = (await loader.loadAsync(modelUrl)).scene;
  } catch (error) {
    studio.dispose();
    throw error;
  }
  const parts = findParts(gltfScene);
  studio.scene.add(gltfScene);
  return sceneApi(studio, loader, gltfScene, parts);
}

interface Studio {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  dispose(): void;
}

/** Renderer, lights and camera shared by every model on the canvas. */
function createStudio(canvas: HTMLCanvasElement, maxDpr: number, lighting: LightingPreset): Studio {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.outputColorSpace = SRGBColorSpace;
  // Same view transform as the Blender stills (Khronos PBR Neutral), so the crossfade matches.
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = lighting.exposure;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = lighting.environmentIntensity;
  const key = new DirectionalLight(lighting.key.color, lighting.key.intensity);
  key.position.set(...KEY_POSITION);
  scene.add(key);

  const camera = new PerspectiveCamera(FOV_DEG, 1, 1, 10);
  const dispose = () => {
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
  return { renderer, scene, camera, dispose };
}

/** A loaded tool: its model, its root (shown or hidden) and how a pose of its kind moves it. */
interface ToolRig {
  model: Object3D;
  root: Object3D;
  apply(pose: ToolPose, size: Size): void;
}

function razorRig(model: Object3D): ToolRig {
  const root = model.getObjectByName("Razor");
  const blade = model.getObjectByName("Blade");
  if (!root || !blade) throw new Error("razor.glb is missing Razor/Blade");
  return {
    model,
    root,
    apply(tagged, size) {
      if (tagged.tool !== "razor") return;
      place(root, tagged.pose, size);
      blade.rotation.z = MathUtils.degToRad(tagged.pose.foldDeg);
    },
  };
}

/** The brush lies flat in the screen plane (no tilt) and rolls: barrel and bristles spin
 *  together about the cylinder axis; the handle does not. */
function brushRig(model: Object3D): ToolRig {
  const root = model.getObjectByName("Brush");
  const barrel = model.getObjectByName("Barrel");
  const bristles = model.getObjectByName("Bristles");
  if (!root || !barrel || !bristles) throw new Error("brush.glb is missing Brush/Barrel/Bristles");
  return {
    model,
    root,
    apply(tagged, size) {
      if (tagged.tool !== "brush") return;
      const { pose } = tagged;
      place(root, { ...pose, rotX: 0, rotY: 0 }, size);
      barrel.rotation.y = MathUtils.degToRad(pose.spinDeg);
      bristles.rotation.y = barrel.rotation.y;
    },
  };
}

const RIGS: Record<SweepTool, (model: Object3D) => ToolRig> = { razor: razorRig, brush: brushRig };

/** The tool's place in the scene: empty until loaded, then posed or hidden per frame. */
function toolSlot(scene: Scene, loader: GLTFLoader, markDirty: () => void) {
  let rig: ToolRig | null = null;
  return {
    async load(tool: SweepTool, url: string) {
      const model = (await loader.loadAsync(url)).scene;
      const loaded = RIGS[tool](model);
      loaded.root.visible = false;
      scene.add(model);
      rig = loaded;
    },
    pose(pose: ToolPose | null, size: Size) {
      if (!rig) return;
      if (!pose) {
        if (rig.root.visible) markDirty();
        rig.root.visible = false;
        return;
      }
      rig.root.visible = true;
      rig.apply(pose, size);
      markDirty();
    },
    dispose() {
      if (rig) disposeTree(rig.model);
    },
  };
}

function sceneApi(studio: Studio, loader: GLTFLoader, gltfScene: Object3D, parts: Parts): ScissorsScene {
  const { renderer, scene, camera } = studio;
  let size = { width: 1, height: 1 };
  let dirty = true;
  const tool = toolSlot(scene, loader, () => void (dirty = true));

  return {
    setPose(pose) {
      place(parts.root, pose, size);
      parts.bladeL.rotation.z = MathUtils.degToRad(pose.snipDeg);
      parts.bladeR.rotation.z = MathUtils.degToRad(-pose.snipDeg);
      dirty = true;
    },
    loadTool: (name, url) => tool.load(name, url),
    setToolPose: (pose) => tool.pose(pose, size),
    resize(width, height) {
      size = { width, height };
      renderer.setSize(width, height, false);
      const distance = pixelDistance(height);
      camera.aspect = width / height;
      camera.position.set(0, 0, distance);
      camera.near = distance / 10;
      camera.far = distance * 10;
      camera.updateProjectionMatrix();
      dirty = true;
    },
    render() {
      if (!dirty) return false;
      renderer.render(scene, camera);
      dirty = false;
      return true;
    },
    dispose() {
      disposeTree(gltfScene);
      tool.dispose();
      studio.dispose();
    },
  };
}
