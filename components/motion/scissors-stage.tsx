"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ScissorsInput, ScissorsPhase, ScissorsPose } from "@/lib/motion/scissors-path";
import type { SweepTool } from "@/lib/motion/sweep-tool";
import type { ScissorsScene } from "@/lib/three/scissors-scene";

import type { SweepTarget } from "@/components/motion/line-sweep";

import { measureSweepLine, readSweepTool, showToolStill, sweepRun } from "@/components/motion/line-sweep";
import { placeStill } from "@/components/motion/tool-still";
import { scissorsPose } from "@/lib/motion/scissors-path";
import { DUR, EASE_GSAP, SCISSORS, mq } from "@/lib/motion/motion-tokens";
import { SCISSORS_STILL_FRAME, stillCssHeight } from "@/lib/motion/still-frame";
import { SWEEP_TOOLS } from "@/lib/motion/sweep-tool";
import { lightingPreset } from "@/lib/three/lighting";

/**
 * 3D scissors stage (change xiax-lp-v3-scissors-3d · design D3/D4/D6/D7/D8).
 * Owns the right rail and its trail line (moved here from motion-choreography), a fixed
 * full-screen canvas for the three.js scene, and a still image of the same model that
 * shows until the 3D is ready — and stays, motionless, under reduced motion or when
 * WebGL is unavailable. Everything is decorative: aria-hidden, pointer-events none.
 *
 * Also runs the steps' line in #como-funciona with the page's tool (change xiax-lp-v3-razor-3d
 * · design D1–D4, D9; change xiax-lp-v5-salon · D7: the razor on the barbershop, the round
 * brush on the salon): same canvas and tick; the tool follows the line's own draw, and while
 * it holds the stage the scissors step out to the right. The scene's lights follow the page
 * theme.
 */

const MODEL_URL = "/models/scissors.glb";
const STILL_URL = "/models/scissors-still.webp";
/** Trail line peak opacity (unchanged from v2). */
const LINE_OPACITY = 0.4;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
/** Fraction of the remaining distance the pointer lean closes per frame (smoothing). */
const POINTER_FOLLOW = 0.15;

type Layout = Omit<ScissorsInput, "scrollY" | "flipDeg" | "spinDeg" | "pointer" | "bottomInsetPx" | "giveWay">;

interface Live {
  scrollY: number;
  progress: number;
  dir: number;
  flip: { deg: number };
  spinDeg: number;
  phase: ScissorsPhase;
  target: { x: number; y: number } | null;
  pointer: { x: number; y: number } | null;
  bottomInsetPx: number;
  dirty: boolean;
}

interface Els {
  rail: HTMLElement;
  line: HTMLElement;
  canvas: HTMLCanvasElement;
  still: HTMLImageElement;
}

function measure(rail: HTMLElement, isDesktop: boolean): Layout {
  const footer = document.querySelector<HTMLElement>("footer");
  // The rail stops at the footer top (v2 behavior, XIA-123): shorten the fixed rail.
  rail.style.bottom = footer ? `${footer.offsetHeight}px` : "0px";
  const scrollY = window.scrollY;
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const hero = document.querySelector("#hero")?.getBoundingClientRect();
  const anchor = document.querySelector("[data-scissors-anchor]")?.getBoundingClientRect();
  const r = rail.getBoundingClientRect();
  return {
    maxScroll: ScrollTrigger.maxScroll(window),
    viewport: { width, height },
    isDesktop,
    heroHeight: hero ? hero.bottom + scrollY : 0,
    anchor: anchor
      ? { x: anchor.left + anchor.width / 2, y: anchor.top + scrollY + anchor.height / 2 }
      : { x: width * 0.75, y: height * 0.3 },
    rail: { x: r.left + r.width / 2, top: r.top, bottom: r.bottom },
  };
}

/** Height of the mobile sticky CTA bar currently on screen (0 while it is hidden). */
function bottomInset(viewportHeight: number) {
  const bar = document.querySelector("[data-sticky-cta]");
  return bar ? Math.max(0, viewportHeight - bar.getBoundingClientRect().top) : 0;
}

/** Trail line ahead of the blade: below it going down, above it going up (v2 rule). */
function applyLine(line: HTMLElement, dir: number, progress: number, presence: number) {
  const clipPath =
    dir === -1 ? `inset(0px 0px ${(1 - progress) * 100}% 0px)` : `inset(${progress * 100}% 0px 0px 0px)`;
  gsap.set(line, { clipPath, opacity: LINE_OPACITY * presence });
}

/** The scissors still is sized for the hero; smaller poses scale it down from there. */
const placeScissorsStill = (still: HTMLImageElement, pose: ScissorsPose) =>
  placeStill(still, pose, SCISSORS_STILL_FRAME, SCISSORS.heroLengthPx);

/**
 * Static branch (reduced motion / no WebGL): the scissors still at the top of the rail with a
 * full line, and the line tool's still on the end of its drawn line (phones too).
 * @returns cleanup for the tool still's refresh listener
 */
function showStatic({ rail, line, still, canvas }: Els, isDesktop: boolean) {
  gsap.set(canvas, { autoAlpha: 0 });
  const stopTool = showToolStill();
  if (!isDesktop) {
    gsap.set(still, { autoAlpha: 0 });
    return stopTool;
  }
  const layout = measure(rail, true);
  const len = SCISSORS.railLengthPx;
  still.src = STILL_URL;
  placeScissorsStill(still, {
    phase: "rail",
    x: layout.rail.x,
    y: layout.rail.top + SCISSORS.pivotFromTop * len,
    lengthPx: len,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    snipDeg: 0,
    railPresence: 1,
  });
  gsap.set(still, { autoAlpha: 1 });
  gsap.set(line, { clipPath: "inset(0px 0px 0% 0px)", opacity: LINE_OPACITY });
  return stopTool;
}

function smoothPointer(live: Live) {
  if (!live.target) {
    if (live.pointer) live.dirty = true;
    live.pointer = null;
    return;
  }
  const p = live.pointer ?? live.target;
  const next = {
    x: p.x + (live.target.x - p.x) * POINTER_FOLLOW,
    y: p.y + (live.target.y - p.y) * POINTER_FOLLOW,
  };
  if (!live.pointer || Math.hypot(next.x - p.x, next.y - p.y) > 0.1) live.dirty = true;
  live.pointer = next;
}

function newLive(): Live {
  return {
    scrollY: window.scrollY,
    progress: 0,
    dir: 1,
    flip: { deg: 0 },
    spinDeg: 0,
    phase: "hero",
    target: null,
    pointer: null,
    bottomInsetPx: 0,
    dirty: true,
  };
}

function trackScroll(live: Live, onRefresh: () => void) {
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onRefresh,
    onUpdate: (self) => {
      live.scrollY = self.scroll();
      live.progress = self.progress;
      if (self.direction !== live.dir) {
        live.dir = self.direction;
        gsap.to(live.flip, {
          deg: live.dir === -1 ? SCISSORS.flipDeg : 0,
          duration: DUR.microIn,
          ease: EASE_GSAP.standard,
          overwrite: true,
          onUpdate: () => void (live.dirty = true),
        });
      }
      live.dirty = true;
    },
  });
}

function trackPointer(live: Live) {
  const onMove = (e: PointerEvent) => (live.target = { x: e.clientX, y: e.clientY });
  const onLeave = () => (live.target = null);
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  return () => {
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
  };
}

/**
 * Mobile: the scissors rests on the sticky CTA bar, which slides in and out with a CSS
 * transition. Its position is followed every frame while that transition runs.
 */
function trackCtaBar(live: Live) {
  const bar = document.querySelector<HTMLElement>("[data-sticky-cta]");
  if (!bar) return () => {};
  const follow = () => {
    live.bottomInsetPx = bottomInset(window.innerHeight);
    live.dirty = true;
  };
  const onRun = (e: TransitionEvent) => e.target === bar && gsap.ticker.add(follow);
  const onEnd = (e: TransitionEvent) => {
    if (e.target !== bar) return;
    gsap.ticker.remove(follow);
    follow();
  };
  bar.addEventListener("transitionrun", onRun);
  bar.addEventListener("transitionend", onEnd);
  bar.addEventListener("transitioncancel", onEnd);
  follow();
  return () => {
    gsap.ticker.remove(follow);
    bar.removeEventListener("transitionrun", onRun);
    bar.removeEventListener("transitionend", onEnd);
    bar.removeEventListener("transitioncancel", onEnd);
  };
}

/** Loads three.js + the model after idle; resolves null if WebGL or the model fails. */
async function loadScene(canvas: HTMLCanvasElement): Promise<ScissorsScene | null> {
  await new Promise<void>((resolve) => {
    // Safari has no requestIdleCallback.
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => resolve(), { timeout: 2000 });
    } else {
      setTimeout(resolve, 200);
    }
  });
  try {
    const { createScissorsScene } = await import("@/lib/three/scissors-scene");
    const lighting = lightingPreset(document.documentElement.dataset.theme);
    return await createScissorsScene(canvas, MODEL_URL, SCISSORS.maxDpr, lighting);
  } catch {
    return null;
  }
}

/** What the frame loop reads that changes after start: layout, scene, line, its tool. */
interface Runtime {
  layout: Layout;
  scene: ScissorsScene | null;
  tool: SweepTool | null;
  cut: SweepTarget | null;
  toolReady: boolean;
}

type SweepRun = ReturnType<typeof sweepRun>;

/**
 * One frame: advances the hero spin, the pointer lean and the line's sweep, then redraws only
 * on change. The tool goes first: its presence is how far the scissors give way.
 */
function makeTick(els: Els, live: Live, rt: Runtime, run: SweepRun | null, isDesktop: boolean) {
  return (_time: number, deltaMs: number) => {
    if (live.phase === "hero" || live.phase === "transition") {
      live.spinDeg += (SCISSORS.heroSpinDegPerSec * deltaMs) / 1000;
      live.dirty = true;
    }
    smoothPointer(live);
    if (run?.lineMoved(rt.cut)) live.dirty = true;
    if (!live.dirty) return;
    live.dirty = false;
    const frame = { scrollY: live.scrollY, viewport: rt.layout.viewport, pointer: live.pointer };
    const tool = rt.scene && run ? run.pose(rt.cut, frame, rt.toolReady) : null;
    const pose = scissorsPose({ ...rt.layout, ...live, flipDeg: live.flip.deg, giveWay: tool?.pose.presence ?? 0 });
    live.phase = pose.phase;
    if (isDesktop) applyLine(els.line, live.dir, live.progress, pose.railPresence);
    if (rt.scene) {
      rt.scene.setPose(pose);
      rt.scene.setToolPose(tool);
      rt.scene.render();
    } else placeScissorsStill(els.still, pose);
  };
}

/** Scene ready: show it, then add the page's tool when the page has a line for it to run. */
function onSceneReady(loaded: ScissorsScene, els: Els, live: Live, rt: Runtime) {
  rt.scene = loaded;
  loaded.resize(rt.layout.viewport.width, rt.layout.viewport.height);
  live.dirty = true;
  crossfadeToScene(els);
  if (!rt.cut || !rt.tool) return;
  loaded.loadTool(rt.tool, SWEEP_TOOLS[rt.tool].modelUrl).then(
    () => {
      rt.toolReady = true;
      live.dirty = true;
    },
    () => undefined,
  );
}

function crossfadeToScene({ canvas, still }: Els) {
  gsap.to(canvas, { autoAlpha: 1, duration: DUR.reveal, ease: EASE_GSAP.out });
  gsap.to(still, { autoAlpha: 0, duration: DUR.reveal, ease: EASE_GSAP.out });
}

function startActive(els: Els, isDesktop: boolean, finePointer: boolean) {
  const live = newLive();
  const tool = readSweepTool();
  const rt: Runtime = { layout: measure(els.rail, isDesktop), scene: null, tool, cut: measureSweepLine(), toolReady: false };
  const run = tool ? sweepRun(tool, () => void (live.dirty = true)) : null;
  let disposed = false;
  let stopStatic = () => {};

  trackScroll(live, () => {
    rt.layout = measure(els.rail, isDesktop);
    rt.cut = measureSweepLine();
    rt.scene?.resize(rt.layout.viewport.width, rt.layout.viewport.height);
    live.dirty = true;
  });
  const stopPointer = finePointer && isDesktop ? trackPointer(live) : () => {};
  const stopCtaBar = isDesktop ? () => {} : trackCtaBar(live);
  const tick = makeTick(els, live, rt, run, isDesktop);
  const onVisibility = () => (document.hidden ? gsap.ticker.remove(tick) : gsap.ticker.add(tick));
  const stopLoop = () => {
    gsap.ticker.remove(tick);
    document.removeEventListener("visibilitychange", onVisibility);
    stopPointer();
    stopCtaBar();
  };

  els.still.src = STILL_URL;
  gsap.set(els.still, { autoAlpha: 1 });
  gsap.ticker.add(tick);
  document.addEventListener("visibilitychange", onVisibility);

  loadScene(els.canvas).then((loaded) => {
    if (disposed) return loaded?.dispose();
    if (!loaded) {
      // No WebGL / broken model: the spec's static fallback, with the loop fully stopped.
      stopLoop();
      stopStatic = showStatic(els, isDesktop);
      return;
    }
    onSceneReady(loaded, els, live, rt);
  });

  return () => {
    disposed = true;
    stopLoop();
    stopStatic();
    run?.dispose();
    rt.scene?.dispose();
  };
}

export function ScissorsStage() {
  const railRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stillRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const [rail, line, canvas, still] = [railRef.current, lineRef.current, canvasRef.current, stillRef.current];
    if (!rail || !line || !canvas || !still) return;
    const els: Els = { rail, line, canvas, still };
    const forceReduced = new URLSearchParams(window.location.search).get("reduced") === "1";
    const mm = gsap.matchMedia();

    // matchMedia runs the callback only while at least one condition matches: `reduce` and
    // `motion` are complementary, so it always runs — a touch phone matches nothing else.
    mm.add(
      {
        reduce: "(prefers-reduced-motion: reduce)",
        motion: "(prefers-reduced-motion: no-preference)",
        isDesktop: mq("md"),
        fine: FINE_POINTER,
      },
      (ctx) => {
        const isDesktop = Boolean(ctx.conditions?.isDesktop);
        if (ctx.conditions?.reduce || forceReduced) return showStatic(els, isDesktop);
        return startActive(els, isDesktop, Boolean(ctx.conditions?.fine));
      },
    );
    return () => mm.revert();
  }, []);

  return (
    <>
      {/* Right rail (≥ md): fixed in the gutter, outside every <section>; CLS 0. */}
      <div
        ref={railRef}
        aria-hidden="true"
        data-scissors-rail
        className="pointer-events-none fixed right-0 z-rail hidden w-[clamp(48px,6vw,72px)] text-accent md:block"
        style={{ top: "var(--header-h)", bottom: 0 }}
      >
        {/* Trail line: fixed-height dashes (repeating gradient), revealed by clip-path —
            1px wide, so no stroke-dashoffset repaint cost (XIA-122). */}
        <div
          ref={lineRef}
          className="absolute top-0 h-full w-px"
          style={{
            left: "calc(50% - 0.5px)",
            opacity: 0,
            backgroundImage: "repeating-linear-gradient(to bottom, currentColor 0 2px, transparent 2px 8px)",
            clipPath: "inset(0 0 100% 0)",
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-scissors-canvas
        tabIndex={-1}
        className="pointer-events-none invisible fixed inset-0 z-rail h-full w-full opacity-0"
      />
      {/* Plain <img>: decorative, and its src is set by JS only in the branches that show it. */}
      <img
        ref={stillRef}
        alt=""
        data-scissors-still
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none invisible fixed left-0 top-0 z-rail w-auto max-w-none opacity-0"
        style={{ height: stillCssHeight(SCISSORS_STILL_FRAME, SCISSORS.heroLengthPx) }}
      />
    </>
  );
}
