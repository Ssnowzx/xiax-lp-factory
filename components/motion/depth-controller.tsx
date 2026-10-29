"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { Tilt } from "@/lib/motion/depth";

import { layerLift, pointerTilt, scrollTilt, sheenTransform } from "@/lib/motion/depth";
import { DEPTH, DUR, EASE_GSAP, SCRUB } from "@/lib/motion/motion-tokens";

/**
 * Depth controller (change xiax-lp-v3-cards-25d · design D1/D2/D5).
 * Wires every server-rendered `[data-depth-card]` once: a fine pointer turns the stage to
 * face the cursor; touch devices tilt it by scroll. Reduced motion (or `?reduced=1`)
 * never sets the depth vars, so cards stay flat. Mounted after first paint, like the
 * choreography, so it never competes with the LCP.
 */

const POINTER = "(hover: hover) and (pointer: fine)";
const ROOT_VARS = ["--depth-perspective", "--depth-1", "--depth-2", "--depth-3"] as const;

interface CardParts {
  card: HTMLElement;
  stage: HTMLElement;
  sheen: HTMLElement | null;
}

function collectCards(): CardParts[] {
  return gsap.utils.toArray<HTMLElement>("[data-depth-card]").flatMap((card) => {
    const stage = card.querySelector<HTMLElement>("[data-depth-stage]");
    if (!stage) return [];
    return [{ card, stage, sheen: stage.querySelector<HTMLElement>("[data-depth-sheen] > span") }];
  });
}

function setRootVars() {
  const root = document.documentElement.style;
  root.setProperty("--depth-perspective", `${DEPTH.perspectivePx}px`);
  DEPTH.layerPx.forEach((px, i) => root.setProperty(`--depth-${i + 1}`, `${px}px`));
}

function clearRootVars() {
  ROOT_VARS.forEach((name) => document.documentElement.style.removeProperty(name));
}

/** Applies a tilt (and its sheen) to one card through pre-built quickTo setters. */
function makeApplier({ stage, sheen }: CardParts, maxDeg: number) {
  const opts = { duration: DUR.micro, ease: EASE_GSAP.standard };
  const rx = gsap.quickTo(stage, "rotationX", opts);
  const ry = gsap.quickTo(stage, "rotationY", opts);
  const lift = gsap.quickTo(stage, "--depth-lift", opts);
  const sx = sheen ? gsap.quickTo(sheen, "xPercent", opts) : null;
  const sy = sheen ? gsap.quickTo(sheen, "yPercent", opts) : null;
  const so = sheen ? gsap.quickTo(sheen, "opacity", opts) : null;
  return (tilt: Tilt) => {
    rx(tilt.rx);
    ry(tilt.ry);
    lift(layerLift(tilt, maxDeg));
    const s = sheenTransform(tilt, maxDeg, DEPTH.sheenOpacity);
    sx?.(s.xPercent);
    sy?.(s.yPercent);
    so?.(s.opacity);
  };
}

function liftPopular(parts: CardParts) {
  if (parts.card.hasAttribute("data-popular")) gsap.set(parts.stage, { z: DEPTH.popularLiftPx });
}

/** Pointer branch: listeners live on each card, so off-screen cards cost nothing. */
function bindPointer(parts: CardParts) {
  const apply = makeApplier(parts, DEPTH.tiltDeg);
  const onMove = (e: PointerEvent) =>
    apply(pointerTilt({ x: e.clientX, y: e.clientY }, parts.card.getBoundingClientRect(), DEPTH.tiltDeg));
  const onEnter = () => gsap.set(parts.stage, { willChange: "transform" });
  const onLeave = () => {
    apply({ rx: 0, ry: 0 });
    gsap.set(parts.stage, { willChange: "auto" });
  };
  parts.card.addEventListener("pointerenter", onEnter);
  parts.card.addEventListener("pointermove", onMove);
  parts.card.addEventListener("pointerleave", onLeave);
  return () => {
    parts.card.removeEventListener("pointerenter", onEnter);
    parts.card.removeEventListener("pointermove", onMove);
    parts.card.removeEventListener("pointerleave", onLeave);
  };
}

/** Touch branch: the card's pass through the viewport drives a gentle tilt. */
function bindScroll(parts: CardParts) {
  const apply = makeApplier(parts, DEPTH.touchTiltDeg);
  ScrollTrigger.create({
    trigger: parts.card,
    start: "top bottom",
    end: "bottom top",
    scrub: SCRUB.base,
    onUpdate: (self) => apply(scrollTilt(self.progress, DEPTH.touchTiltDeg)),
  });
}

export function DepthController() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const forceReduced = new URLSearchParams(window.location.search).has("reduced");
    const mm = gsap.matchMedia();

    mm.add(
      { ok: "(prefers-reduced-motion: no-preference)", pointer: POINTER },
      (ctx) => {
        if (!ctx.conditions?.ok || forceReduced) return;
        setRootVars();
        const cards = collectCards();
        cards.forEach(liftPopular);
        const unbinds = ctx.conditions.pointer ? cards.map(bindPointer) : [];
        if (!ctx.conditions.pointer) cards.forEach(bindScroll);
        ScrollTrigger.refresh();
        return () => {
          unbinds.forEach((unbind) => unbind());
          clearRootVars();
        };
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}
