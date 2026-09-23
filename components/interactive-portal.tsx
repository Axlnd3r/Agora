"use client";

import { useEffect, useRef, useState } from "react";

const PORTAL_FILM = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4";

export function CinematicPortal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPlayback = () => {
      setMotionAllowed(!preference.matches);
      if (preference.matches) videoRef.current?.pause();
      else void videoRef.current?.play().catch(() => undefined);
    };

    syncPlayback();
    preference.addEventListener("change", syncPlayback);
    return () => preference.removeEventListener("change", syncPlayback);
  }, []);

  return (
    <div className="portal-scene cinematic-plate" aria-hidden="true">
      <video
        ref={videoRef}
        className="plate-video"
        autoPlay={motionAllowed}
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        <source src={PORTAL_FILM} type="video/mp4" />
      </video>
    </div>
  );
}
