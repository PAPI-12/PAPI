import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const cursorNoteRef = useRef<HTMLDivElement>(null);
  const [isMeasured, setIsMeasured] = useState(false);

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, { stiffness: 260, damping: 28, mass: 0.6 });
  const springY = useSpring(targetY, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let heroBounds = hero.getBoundingClientRect();
    let noteWidth = cursorNoteRef.current?.offsetWidth || 180;
    let noteHeight = cursorNoteRef.current?.offsetHeight || 32;

    const updateBounds = () => {
      if (!hero) return;
      heroBounds = hero.getBoundingClientRect();
      if (cursorNoteRef.current) {
        noteWidth = cursorNoteRef.current.offsetWidth || 180;
        noteHeight = cursorNoteRef.current.offsetHeight || 32;
      }
      const centerX = (heroBounds.width - noteWidth) / 2;
      const centerY = (heroBounds.height - noteHeight) / 2;
      targetX.set(centerX);
      targetY.set(centerY);
      setIsMeasured(true);
    };

    updateBounds();
    window.addEventListener('resize', updateBounds, { passive: true });
    const fonts = (document as any).fonts;
    if (fonts && fonts.ready) {
      fonts.ready.then(updateBounds).catch(() => {});
    }

    const handlePointerMove = (e: PointerEvent) => {
      const padding = 16;
      const localMouseX = e.clientX - heroBounds.left;
      const localMouseY = e.clientY - heroBounds.top;

      const boundedX = Math.max(padding, Math.min(localMouseX + 16, heroBounds.width - noteWidth - padding));
      const boundedY = Math.max(padding, Math.min(localMouseY + 16, heroBounds.height - noteHeight - padding));

      targetX.set(boundedX);
      targetY.set(boundedY);
    };

    const handlePointerLeave = () => {
      const centerX = (heroBounds.width - noteWidth) / 2;
      const centerY = (heroBounds.height - noteHeight) / 2;
      targetX.set(centerX);
      targetY.set(centerY);
    };

    hero.addEventListener('pointermove', handlePointerMove, { passive: true });
    hero.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('resize', updateBounds);
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [targetX, targetY]);


  return (
    <section
      ref={heroRef}
      className="relative h-[100svh] min-h-[540px] flex items-center justify-center overflow-hidden bg-[#171715]"
    >
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Hero image.webp"
          alt="Papi Raborife"
          className="w-full h-full object-cover object-top"
          style={{ filter: 'grayscale(100%) contrast(1.3) brightness(0.35) saturate(0.3)' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,21,0.5),rgba(23,23,21,0.3)30%,rgba(23,23,21,0.88))]" />
      </div>

      {/* Ambient floating crosses */}
      <FloatingCross className="absolute top-[12%] left-[7%] z-20 hidden sm:block" size={38} duration={6.5} delay={0} />
      <FloatingCross className="absolute top-[18%] right-[11%] z-20 hidden md:block" size={24} duration={5.5} delay={0.5} />
      <FloatingCross className="absolute top-[32%] left-[15%] z-20 hidden md:block" size={28} duration={7} delay={0.3} />
      <FloatingCross className="absolute top-[8%] right-[26%] z-20 hidden lg:block" size={18} duration={6} delay={0.9} />
      <FloatingCross className="absolute bottom-[24%] right-[8%] z-20 hidden sm:block" size={30} duration={7.5} delay={0.2} />
      <FloatingCross className="absolute bottom-[16%] left-[11%] z-20 hidden sm:block" size={22} duration={5.8} delay={1} />
      <FloatingCross className="absolute top-[48%] left-[4%] z-20 hidden lg:block" size={16} duration={6.2} delay={1.2} />
      <FloatingCross className="absolute top-[58%] right-[17%] z-20 hidden md:block" size={20} duration={6.4} delay={0.8} />
      <FloatingCross className="absolute bottom-[38%] left-[22%] z-20 hidden lg:block" size={14} duration={5.2} delay={1.4} />
      <FloatingCross className="absolute top-[70%] left-[40%] z-20 hidden xl:block" size={16} duration={6.8} delay={0.6} />

      {/* Ambient floating waves */}
      <FloatingWave className="absolute top-[24%] right-[15%] z-20 hidden md:block" width={140} duration={7.5} delay={0} />
      <FloatingWave className="absolute top-[44%] left-[3%] z-20 hidden lg:block" width={110} duration={8.5} delay={0.4} />
      <FloatingWave className="absolute bottom-[32%] right-[5%] z-20 hidden md:block" width={130} duration={7} delay={0.9} />
      <FloatingWave className="absolute bottom-[14%] left-[17%] z-20 hidden sm:block" width={100} duration={8} delay={0.6} />
      <FloatingWave className="absolute top-[62%] right-[23%] z-20 hidden lg:block" width={90} duration={6.5} delay={1.1} />

      {/* Static scribbles for depth */}
      <ScribbleX className="absolute top-[20%] left-[28%] w-6 h-6 z-20 opacity-50 rotate-12 hidden md:block" />
      <ScribbleUnderline className="absolute top-[28%] right-[22%] w-28 h-3 z-20 opacity-60 rotate-3 hidden md:block" />

      <div className="relative z-10 text-center px-4 w-full max-w-[96vw]">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.35em] uppercase mb-6 md:mb-8 text-[#9a9a93]"
        >
          Papi Raborife
        </motion.p>

        <div className="relative flex flex-col items-center justify-center w-full">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="font-display text-[#f5f3ee] text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em]"
          >
            CRAFTING
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-display text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] max-w-full overflow-hidden"
            aria-hidden="true"
          >
            <SplitFlapText target="AWESOMENESS" startDelay={650} step={130} />
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
            className="font-display text-stroke text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em]"
          >
            SINCE 2015
          </motion.h1>
        </div>
      </div>

      {/* "culture led creative" — absolutely positioned inside the hero,
          centred at rest, clamped to the hero rectangle so it can never
          escape the section border. */}
      <motion.div
        ref={cursorNoteRef}
        className="absolute top-0 left-0 z-30 pointer-events-none hand-note text-[#d7ff4f] text-base sm:text-lg md:text-2xl font-bold whitespace-nowrap mix-blend-difference"
        style={{ x: springX, y: springY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isMeasured ? 1 : 0 }}
        transition={{ opacity: { duration: 0.3 } }}
      >
        culture led creative
      </motion.div>

      <div className="absolute left-4 sm:left-6 bottom-10 md:bottom-12 hidden md:flex flex-col gap-4 text-[10px] md:text-xs font-bold text-[#8f8f88] z-30">
        <Link to="/resume" className="hover:text-[#f5f3ee] transform -rotate-90 tracking-[0.2em]">
          RESUME
        </Link>
      </div>

      <div className="absolute right-4 sm:right-6 bottom-10 md:bottom-12 hidden md:flex items-center gap-2 text-[10px] font-bold text-[#8f8f88] tracking-[0.25em] z-30">
        <span>STUDIO MODE</span>
        <div className="flex gap-[2px] h-3 items-end">
          <div className="w-[2px] h-full bg-[#d7ff4f] animate-pulse" />
          <div className="w-[2px] h-1/2 bg-[#d7c4aa] animate-pulse" />
          <div className="w-[2px] h-3/4 bg-[#f5f3ee] animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
