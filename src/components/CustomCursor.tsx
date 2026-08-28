import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useMouse } from '../context/MouseContext';

const CustomCursor: React.FC = () => {
  const { mouseX, mouseY, cursorSize } = useMouse();
  const [isHovering, setIsHovering] = useState(false);

  const springConfig = { stiffness: 420, damping: 32, mass: 0.35 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const dotSpringConfig = { stiffness: 1000, damping: 50, mass: 0.1 };
  const dotX = useSpring(mouseX, dotSpringConfig);
  const dotY = useSpring(mouseY, dotSpringConfig);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isLink =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        !!target.closest('a') ||
        !!target.closest('button') ||
        target.classList.contains('cursor-pointer');
      setIsHovering(isLink);
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, []);

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
          willChange: 'transform, width, height',
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

