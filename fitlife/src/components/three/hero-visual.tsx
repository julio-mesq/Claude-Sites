"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const EnergyCore = dynamic(() => import("./energy-core"), { ssr: false, loading: () => <StaticCore /> });

function StaticCore() {
  return (
    <div className="relative grid h-full w-full place-items-center" aria-hidden>
      <div className="absolute h-64 w-64 rounded-full bg-neon/20 blur-3xl" />
      <div className="relative h-48 w-48 rounded-full border border-neon/30 bg-[radial-gradient(circle_at_35%_30%,#2b4a0e,#0d1410_60%)] shadow-[0_0_80px_-10px_rgb(182_255_59/0.5)]" />
      <div className="absolute h-72 w-72 rounded-full border border-neon/20" />
      <div className="absolute h-[22rem] w-[22rem] rounded-full border border-neon-600/10" />
    </div>
  );
}

/** Carrega a cena 3D apenas quando visível, com WebGL disponível e sem preferência por movimento reduzido. */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"static" | "3d">("static");
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true";
    const canvas = document.createElement("canvas");
    const webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    const lowEnd = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 3;
    if (reduced || !webgl || lowEnd || !ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        setMode("3d");
        io.disconnect();
      }
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="h-full w-full">{mode === "3d" ? <EnergyCore /> : <StaticCore />}</div>;
}
