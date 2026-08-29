import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ScribbleX, ScribbleUnderline, FloatingCross, FloatingWave } from './Scribbles';
import SplitFlapText from './SplitFlapText';
import { useHeroPhysics } from '../hooks/useHeroPhysics';

const ORBIT_COPY = 'CULTURE LED CREATIVE · ';

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
  const colorImgRef = useRef<HTMLImageElement>(null);
  const scratchRef = useRef<HTMLCanvasElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const orbitPathId = useId().replace(/:/g, '');
  const [introComplete, setIntroComplete] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, { stiffness: 360, damping: 32, mass: 0.4 });
  const springY = useSpring(targetY, { stiffness: 360, damping: 32, mass: 0.4 });

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhysicsEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setIntroComplete(true), 3800);
    return () => window.clearTimeout(t);
  }, []);

  useHeroPhysics(heroRef, introComplete && physicsEnabled);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let radius = 32;
    let raf = 0;
    let offset = 0;
    let lastStampX = -9999;
    let lastStampY = -9999;
    let scratchReady = false;

    const measureO = () => {
      const o = hero.querySelector('[data-char="O"]') as HTMLElement | null;
      if (o) {
        const r = o.getBoundingClientRect();
        radius = Math.max(14, (r.width / 2) - 3);
      } else {
        radius = 30;
      }
    };

    const paintScratchBase = () => {
      const canvas = scratchRef.current;
      const img = colorImgRef.current;
      if (!canvas) return;
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      if (w < 8 || h < 8) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.filter = 'grayscale(100%) contrast(1.3) brightness(0.35) saturate(0.3)';
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - dw) / 2, 0, dw, dh);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = '#171715';
        ctx.fillRect(0, 0, w, h);
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(23,23,21,0.5)');
      g.addColorStop(0.3, 'rgba(23,23,21,0.3)');
      g.addColorStop(1, 'rgba(23,23,21,0.88)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      scratchReady = true;
      lastStampX = -9999;
      lastStampY = -9999;
    };

    const stampScratch = (x: number, y: number) => {
      if (!scratchReady) return;
      const canvas = scratchRef.current;
      if (!canvas) return;
      const dx = x - lastStampX;
      const dy = y - lastStampY;
      if (dx * dx + dy * dy < 3) return;
      lastStampX = x;
      lastStampY = y;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
    };

    const layoutOrbit = () => {
      const orbit = orbitRef.current;
      if (!orbit) return;
      measureO();
      const pad = 16;
      const size = radius * 2 + pad;
      const c = size / 2;
      orbit.style.width = `${size}px`;
      orbit.style.height = `${size}px`;
      const svg = orbit.querySelector('svg');
      const path = orbit.querySelector('path');
      const text = orbit.querySelector('text');
      if (svg) {
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      }
      if (path) {
        path.setAttribute('d', `M ${c} ${c - radius} A ${radius} ${radius} 0 1 1 ${c - 0.01} ${c - radius}`);
      }
      if (text) {
        const font = Math.max(7, Math.min(13, (2 * Math.PI * radius) / 24));
        text.setAttribute('font-size', String(font));
      }
    };

    const centerNote = () => {
      const bounds = hero.getBoundingClientRect();
      measureO();
      layoutOrbit();
      targetX.set(bounds.width / 2);
      targetY.set(bounds.height / 2);
    };

    centerNote();
    paintScratchBase();

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      const localX = e.clientX - bounds.left;
      const localY = e.clientY - bounds.top;
      const inside = localX >= 0 && localY >= 0 && localX <= bounds.width && localY <= bounds.height;
      if (!inside) return;
      targetX.set(localX);
      targetY.set(localY);
    };

    const onResize = () => {
      centerNote();
      paintScratchBase();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    const img = colorImgRef.current;
    if (img) {
      if (img.complete) paintScratchBase();
      else img.addEventListener('load', paintScratchBase);
    }

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const cx = springX.get();
      const cy = springY.get();
      const orbit = orbitRef.current;
      if (orbit) {
        const pad = 16;
        const size = radius * 2 + pad;
        orbit.style.transform = `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0)`;
        const pathText = orbit.querySelector('textPath');
        if (pathText) {
          offset = (offset + 0.15) % 100;
          pathText.setAttribute('startOffset', `${offset}%`);
        }
      }
      stampScratch(cx, cy);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', onResize);
      img?.removeEventListener('load', paintScratchBase);
    };
  }, [targetX, targetY, springX, springY]);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative h-[100svh] min-h-[540px] flex items-center justify-center overflow-hidden bg-[#171715]"
    >
      <div className="absolute inset-0 z-0">
        <img
          ref={colorImgRef}
          src="/images/Hero image.webp"
          alt="Papi Raborife"
          className="w-full h-full object-cover object-top"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <canvas
          ref={scratchRef}
          className="absolute inset-0 h-full w-full pointer-events-none z-10"
          aria-hidden
        />
      </div>

      <FloatingCross className="absolute top-[12%] left-[7%] z-25 hidden sm:block" size={38} duration={6.5} delay={0} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[18%] right-[11%] z-25 hidden md:block" size={24} duration={5.5} delay={0.5} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[32%] left-[15%] z-25 hidden md:block" size={28} duration={7} delay={0.3} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[8%] right-[26%] z-25 hidden lg:block" size={18} duration={6} delay={0.9} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute bottom-[24%] right-[8%] z-25 hidden sm:block" size={30} duration={7.5} delay={0.2} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute bottom-[16%] left-[11%] z-25 hidden sm:block" size={22} duration={5.8} delay={1} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[48%] left-[4%] z-25 hidden lg:block" size={16} duration={6.2} delay={1.2} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[58%] right-[17%] z-25 hidden md:block" size={20} duration={6.4} delay={0.8} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute bottom-[38%] left-[22%] z-25 hidden lg:block" size={14} duration={5.2} delay={1.4} frozen={introComplete && physicsEnabled} />
      <FloatingCross className="absolute top-[70%] left-[40%] z-25 hidden xl:block" size={16} duration={6.8} delay={0.6} frozen={introComplete && physicsEnabled} />

      <FloatingWave className="absolute top-[24%] right-[15%] z-25 hidden md:block" width={140} duration={7.5} delay={0} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute top-[44%] left-[3%] z-25 hidden lg:block" width={110} duration={8.5} delay={0.4} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute bottom-[32%] right-[5%] z-25 hidden md:block" width={130} duration={7} delay={0.9} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute bottom-[14%] left-[17%] z-25 hidden sm:block" width={100} duration={8} delay={0.6} frozen={introComplete && physicsEnabled} />
      <FloatingWave className="absolute top-[62%] right-[23%] z-25 hidden lg:block" width={90} duration={6.5} delay={1.1} frozen={introComplete && physicsEnabled} />

      <ScribbleX data-hero-physics="deco" className="absolute top-[20%] left-[28%] w-6 h-6 z-25 opacity-50 rotate-12 hidden md:block" />
      <ScribbleUnderline data-hero-physics="deco" className="absolute top-[28%] right-[22%] w-28 h-3 z-25 opacity-60 rotate-3 hidden md:block" />

      <div className="relative z-20 text-center px-4 w-full max-w-[96vw]">
        <h1 className="sr-only">CRAFTING AWESOMENESS SINCE 2015</h1>
        <p className="text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.35em] uppercase mb-6 md:mb-8 text-[#9a9a93]">
          Papi Raborife
        </p>

        <div className="relative flex flex-col items-center justify-center w-full">
          <h1
            aria-hidden="true"
            className="font-display text-[#f5f3ee] text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="CRAFTING" />
          </h1>

          <h1
            className="font-display text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] max-w-full whitespace-nowrap"
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
            className="font-display text-stroke text-[clamp(2.2rem,10.8vw,10rem)] md:text-[clamp(3.5rem,8.6vw,9.5rem)] leading-[0.86] tracking-[-0.04em] whitespace-nowrap"
          >
            <HeroLetters text="SINCE 2015" />
          </h1>
        </div>
      </div>

      <div
        ref={orbitRef}
        className="absolute top-0 left-0 z-30 pointer-events-none hidden md:block"
        style={{ willChange: 'transform' }}
        aria-hidden
      >
        <svg className="overflow-visible">
          <defs>
            <path id={orbitPathId} d="M 40 4 A 36 36 0 1 1 39.99 4" />
          </defs>
          <text
            fill="#d7ff4f"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            fontWeight="700"
            letterSpacing="1.8"
          >
            <textPath href={`#${orbitPathId}`}>{ORBIT_COPY}{ORBIT_COPY}</textPath>
          </text>
        </svg>
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
