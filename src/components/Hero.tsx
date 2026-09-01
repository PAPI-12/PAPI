import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics } from '../hooks/useHeroPhysics';

const HeroLetters: React.FC<{ text: string }> = ({ text }) => (
  <>
    {Array.from(text).map((ch, i) =>
      ch === ' ' ? (
        <span key={i}>{' '}</span>
      ) : (
        <span key={i} data-hero-physics="letter" className="hero-physics-letter">
          {ch}
        </span>
      ),
    )}
  </>
);

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const cursorNoteRef = useRef<HTMLDivElement>(null);
  const [isMeasured, setIsMeasured] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);


  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhysicsEnabled(fine && !reduce);
  }, []);

  useHeroPhysics(heroRef, introComplete && physicsEnabled);

  // Safety net: if the split-flap never reports completion (tab was
  // backgrounded, timers throttled), still hand control to the physics layer.
  useEffect(() => {
    const t = window.setTimeout(() => setIntroComplete(true), 4200);
    return () => window.clearTimeout(t);
  }, []);

  // The trailing note used to be two framer-motion springs. It is now a tiny
  // hand-rolled critically-damped spring driven by the same rAF loop that
  // writes the transform, so the hero no longer needs the motion runtime at
  // all — and the note is written once per frame instead of per mouse event.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const note = cursorNoteRef.current;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let velX = 0;
    let velY = 0;
    let primed = false;
    let raf = 0;

    const setTarget = (x: number, y: number) => {
      targetX = x;
      targetY = y;
      if (!primed) {
        primed = true;
        curX = x;
        curY = y;
        if (note) note.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    let noteWidth = cursorNoteRef.current?.offsetWidth || 180;
    let noteHeight = cursorNoteRef.current?.offsetHeight || 32;
    // Cached hero geometry. Kept fresh by resize/scroll rather than being
    // re-measured on every pointer move (that caused a forced reflow per
    // mousemove, and went stale on scroll so the note drifted off-centre).
    let boxLeft = 0;
    let boxTop = 0;
    let boxWidth = 0;
    let boxHeight = 0;

    const syncBox = () => {
      const r = hero.getBoundingClientRect();
      boxLeft = r.left;
      boxTop = r.top;
      boxWidth = r.width;
      boxHeight = r.height;
    };

    const centre = () => {
      setTarget((boxWidth - noteWidth) / 2, (boxHeight - noteHeight) / 2);
    };

    const measure = () => {
      syncBox();
      if (cursorNoteRef.current) {
        noteWidth = cursorNoteRef.current.offsetWidth || 180;
        noteHeight = cursorNoteRef.current.offsetHeight || 32;
      }
      centre();
      setIsMeasured(true);
    };

    measure();

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 120);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', syncBox, { passive: true });

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(measure).catch(() => {});

    let inside = false;
    const handlePointerMove = (e: PointerEvent) => {
      // Touch taps fire a synthetic pointermove; ignore so the note stays put.
      if (e.pointerType === 'touch') return;

      const padding = 16;
      const localX = e.clientX - boxLeft;
      const localY = e.clientY - boxTop;
      const within = localX >= 0 && localY >= 0 && localX <= boxWidth && localY <= boxHeight;

      if (!within) {
        if (inside) {
          inside = false;
          centre();
        }
        return;
      }
      inside = true;

      setTarget(
        Math.max(padding, Math.min(localX + 16, boxWidth - noteWidth - padding)),
        Math.max(padding, Math.min(localY + 16, boxHeight - noteHeight - padding)),
      );
    };

    // Listening on window (not the section) means leaving the hero in any
    // direction re-centres the note instead of leaving it stuck at the edge.
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Spring integration. Stops itself once settled and wakes on the next
    // pointer move, so an idle hero costs zero frames.
    const STIFF = 260;
    const DAMP = 28;
    const MASS = 0.6;
    let lastT = 0;
    let idleFrames = 0;

    const tick = (now: number) => {
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.032) : 1 / 60;
      lastT = now;

      const ax = (-STIFF * (curX - targetX) - DAMP * velX) / MASS;
      const ay = (-STIFF * (curY - targetY) - DAMP * velY) / MASS;
      velX += ax * dt;
      velY += ay * dt;
      curX += velX * dt;
      curY += velY * dt;

      const still =
        Math.abs(curX - targetX) < 0.05 &&
        Math.abs(curY - targetY) < 0.05 &&
        Math.abs(velX) < 0.5 &&
        Math.abs(velY) < 0.5;

      if (still) {
        curX = targetX;
        curY = targetY;
        velX = 0;
        velY = 0;
        idleFrames++;
      } else {
        idleFrames = 0;
      }

      if (note) note.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      // Keep a short tail of frames so a resettle is instant, then sleep.
      if (idleFrames > 8) {
        raf = 0;
        lastT = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        lastT = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    window.addEventListener('pointermove', wake, { passive: true });
    wake();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', wake);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', syncBox);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);


  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative h-[100svh] min-h-[540px] flex items-center justify-center overflow-hidden bg-[#171715]"
    >
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Hero image.webp"
          alt="Papi Raborife"
          className="w-full h-full object-cover object-top"
          fetchPriority="high"
          decoding="async"
          style={{ filter: 'grayscale(100%) contrast(1.3) brightness(0.35) saturate(0.3)' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,21,0.5),rgba(23,23,21,0.3)30%,rgba(23,23,21,0.88))]" />
      </div>

      {/* Ambient floating crosses */}
      <FloatingCross className="absolute top-[12%] left-[7%] z-20 hidden sm:block" size={38} duration={6.5} delay={0} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[18%] right-[11%] z-20 hidden md:block" size={24} duration={5.5} delay={0.5} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[32%] left-[15%] z-20 hidden md:block" size={28} duration={7} delay={0.3} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[8%] right-[26%] z-20 hidden lg:block" size={18} duration={6} delay={0.9} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute bottom-[24%] right-[8%] z-20 hidden sm:block" size={30} duration={7.5} delay={0.2} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute bottom-[16%] left-[11%] z-20 hidden sm:block" size={22} duration={5.8} delay={1} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[48%] left-[4%] z-20 hidden lg:block" size={16} duration={6.2} delay={1.2} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[58%] right-[17%] z-20 hidden md:block" size={20} duration={6.4} delay={0.8} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute bottom-[38%] left-[22%] z-20 hidden lg:block" size={14} duration={5.2} delay={1.4} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[70%] left-[40%] z-20 hidden xl:block" size={16} duration={6.8} delay={0.6} frozen={introComplete && physicsEnabled} />

      {/* Ambient floating waves */}
      <FloatingWave className="absolute top-[24%] right-[15%] z-20 hidden md:block" width={140} duration={7.5} delay={0} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute top-[44%] left-[3%] z-20 hidden lg:block" width={110} duration={8.5} delay={0.4} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute bottom-[32%] right-[5%] z-20 hidden md:block" width={130} duration={7} delay={0.9} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute bottom-[14%] left-[17%] z-20 hidden sm:block" width={100} duration={8} delay={0.6} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute top-[62%] right-[23%] z-20 hidden lg:block" width={90} duration={6.5} delay={1.1} frozen={introComplete && physicsEnabled} />

      {/* Static scribbles for depth */}
      <ScribbleX data-hero-physics="deco" className="absolute top-[20%] left-[28%] w-6 h-6 z-20 opacity-50 rotate-12 hidden md:block" />
      <ScribbleUnderline data-hero-physics="deco" className="absolute top-[28%] right-[22%] w-28 h-3 z-20 opacity-60 rotate-3 hidden md:block" />

      <div className="relative z-10 text-center px-4 w-full max-w-[96vw]">
        <h1 className="sr-only">CRAFTING AWESOMENESS SINCE 2015</h1>
        <p className="hero-rise text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.35em] uppercase mb-6 md:mb-8 text-[#9a9a93]">
          Papi Raborife
        </p>

        <div className="relative flex flex-col items-center justify-center w-full">
          <h1
            aria-hidden="true"
            className="hero-pop font-display text-[#f5f3ee] text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="CRAFTING" />
          </h1>

          <h1
            className="hero-fade font-display text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] max-w-full whitespace-nowrap"
            aria-hidden="true"
          >
            <SplitFlapText
              target="AWESOMENESS"
              startDelay={815}
              step={163}
              interval={70}
              onComplete={handleIntroComplete}
            />
          </h1>

          <h1
            aria-hidden="true"
            className="hero-pop hero-pop-late font-display text-stroke text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="SINCE 2015" />
          </h1>
        </div>
      </div>

      {/* "culture led creative" — absolutely positioned inside the hero,
          centred at rest, clamped to the hero rectangle so it can never
          escape the section border. */}
      <div
        ref={cursorNoteRef}
        className="absolute top-0 left-0 z-30 pointer-events-none hand-note text-[#d7ff4f] text-base sm:text-lg md:text-2xl font-bold whitespace-nowrap mix-blend-difference"
        style={{ opacity: isMeasured ? 1 : 0, transition: 'opacity 300ms ease', willChange: 'transform' }}
      >
        culture led creative
      </div>

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
