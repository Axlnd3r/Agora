"use client";

import { PointerEvent, useRef } from "react";

export function InteractivePortal() {
  const sceneRef = useRef<HTMLDivElement>(null);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
    sceneRef.current?.style.setProperty("--portal-x", `${x}px`);
    sceneRef.current?.style.setProperty("--portal-y", `${y}px`);
  }

  function reset() {
    sceneRef.current?.style.setProperty("--portal-x", "0px");
    sceneRef.current?.style.setProperty("--portal-y", "0px");
  }

  return (
    <div ref={sceneRef} className="portal-scene" aria-hidden="true" onPointerMove={move} onPointerLeave={reset}>
      <div className="portal-haze" />
      <div className="portal-rings"><i /><i /><i /></div>
      <div className="portal" />
      <div className="portal-figure" />
    </div>
  );
}
