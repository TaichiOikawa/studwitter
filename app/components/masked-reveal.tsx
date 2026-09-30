"use client";

import { Particles } from "@/components/ui/particles";
import { useEffect, useRef, useState } from "react";

const PARTICLE_SCALE = 1;
const MIN_PARTICLES = 40;
const MAX_PARTICLES = 2000;

type MaskedRevealProps = {
  text: string;
  index: number;
  initiallyRevealed: boolean;
};

export function MaskedReveal({
  text,
  index,
  initiallyRevealed,
}: MaskedRevealProps) {
  const [revealed, setRevealed] = useState(initiallyRevealed);
  const [showParticles, setShowParticles] = useState(!initiallyRevealed);
  const [quantity, setQuantity] = useState(MIN_PARTICLES);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const updateQuantity = () => {
      const { width, height } = container.getBoundingClientRect();
      const nextQuantity = Math.min(
        MAX_PARTICLES,
        Math.max(
          MIN_PARTICLES,
          Math.round(Math.sqrt(width * height) * PARTICLE_SCALE),
        ),
      );

      setQuantity(nextQuantity);
    };

    updateQuantity();

    const resizeObserver = new ResizeObserver(updateQuantity);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="inline-block relative" key={index}>
      <span>{text}</span>
      {showParticles && (
        <button
          type="button"
          className={`absolute inset-0 size-full overflow-hidden p-0 transition-opacity duration-500 bg-white dark:bg-black ${
            revealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-label="目隠し部分を表示"
          title="クリックして表示"
          onClick={() => setRevealed(true)}
          onTransitionEnd={(event) => {
            if (event.propertyName === "opacity" && revealed) {
              setShowParticles(false);
            }
          }}
        >
          <Particles
            key={quantity}
            className="absolute inset-0 size-full dark:invert"
            color="#000000"
            quantity={quantity}
          />
        </button>
      )}
    </div>
  );
}
