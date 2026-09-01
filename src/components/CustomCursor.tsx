import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useMouse } from '../context/MouseContext';

const CustomCursor: React.FC = () => {
  const { mouseX, mouseY, cursorSize } = useMouse();
  const [isHovering, setIsHovering] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const hoverRef = useRef(false);

  const springConfig = { stiffness: 420, damping: 32, mass: 0.35 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const dotSpringConfig = { stiffness: 1000, damping: 50, mass: 0.1 };
  const dotX = useSpring(mouseX, dotSpringConfig);
  const dotY = useSpring(mouseY, dotSpringConfig);

  // Only mount the custom cursor on devices that actually have one. On touch
  // this component was still running two springs against every mouse event.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fine =
      window.matchMedia('(pointer: fine)').matches &&
      window.matchMedia('(hover: hover)').matches;
    setEnabled(fine);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const next =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        !!target.closest('a,button,[role="button"],.cursor-pointer');

      // Guard on a ref so we only re-render React when the state truly flips.
      // Without this, every mouseover (hundreds per second across a dense
      // layout) triggered a state update and a full cursor re-render.
      if (next === hoverRef.current) return;
      hoverRef.current = next;
      setIsHovering(next);
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, [enabled]);

  if (!enabled) return null;

  const isLarge = cursorSize === 'large';
  const size = isHovering ? 60 : isLarge ? 56 : 24;

  return (
    <>
      <motion.div
        className="custom-cursor fixed top-0 left-0 rounded-full border-[3px] border-[#d7ff4f] z-[9999] pointer-events-none hidden md:block"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          width: size,
          height: size,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          backgroundColor: 'transparent',
        }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      />
      <motion.div
        className="custom-cursor fixed top-0 left-0 w-1.5 h-1.5 bg-[#d7c4aa] rounded-full z-[9999] pointer-events-none hidden md:block"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isLarge ? 0 : 1,
          willChange: 'transform',
        }}
      />
    </>
  );
};

export default CustomCursor;
