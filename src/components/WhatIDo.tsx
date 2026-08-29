import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SKILLS = [
  { title: 'UX/UI DESIGN', note: 'interfaces with instinct', color: '#f5f3ee' },
  { title: 'ART DIRECTION', note: 'visual systems with attitude', color: '#d7ff4f' },
  { title: 'CINEMATOGRAPHY', note: 'motion shaped by feeling', color: '#d7c4aa' },
  { title: 'GRAPHIC DESIGNER', note: 'culture-led systems & print', color: '#d7ff4f' },
  { title: 'AI CREATIVE', note: 'future-facing image craft', color: '#f5f3ee' },
];

const DIM = '#52524b';
const DIM_RGB = { r: 82, g: 82, b: 75 };
const MATRIX = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789#$*<>¦';

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const SKILL_RGB = SKILLS.map((s) => hexToRgb(s.color));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rgbToCss = (r: number, g: number, b: number) => `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

const glyph = (i: number, salt: number) => MATRIX[(i * 17 + Math.floor(salt * 47)) % MATRIX.length];

const WhatIDo: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const noteRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const finishCardRef = useRef<HTMLDivElement>(null);
  const activeIndex = useRef(0);
  const matrixAlpha = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const rain = rainRef.current;
    if (!root || !stage) return;

    const items = itemRefs.current;
    const notes = noteRefs.current;
    const dots = dotRefs.current;
    const originals = SKILLS.map((s) => s.title.split(''));

    const paint = (raw: number, code: number, vanished: number, popup: number) => {
      const n = SKILLS.length;
      const idx = Math.round(Math.min(n - 1, Math.max(0, raw)));
      if (idx !== activeIndex.current) {
        activeIndex.current = idx;
        if (counterRef.current) counterRef.current.textContent = `0${idx + 1}`;
      }
      matrixAlpha.current = Math.max(code, vanished);

      if (stackRef.current) {
        const hide = smoothstep(vanished);
        stackRef.current.style.opacity = String(1 - hide);
        stackRef.current.style.transform = `translate3d(0, ${hide * -32}px, 0)`;
      }
      if (headerRef.current) {
        headerRef.current.style.opacity = String(1 - smoothstep(vanished * 1.2));
      }

      for (let i = 0; i < n; i++) {
        const dist = Math.abs(raw - i);
        const active = smoothstep(1 - Math.min(dist, 1));
        const item = items[i];
        const note = notes[i];
        const dot = dots[i];
        const rgb = SKILL_RGB[i];
        const lime = mix(0, 1, code * (1 - vanished));

        if (item) {
          const scale = mix(0.85, 1.08, active * (1 - code * 0.45) * (1 - vanished));
          const op = mix(0.15, 1, Math.max(active, code * 0.9));
          item.style.opacity = String(op);
          item.style.transform = `scale(${scale})`;
          item.style.zIndex = String(Math.round(1 + active * 10));
          item.style.color = rgbToCss(
            mix(mix(DIM_RGB.r, rgb.r, active), 215, lime),
            mix(mix(DIM_RGB.g, rgb.g, active), 255, lime),
            mix(mix(DIM_RGB.b, rgb.b, active), 79, lime),
          );

          const letters = item.querySelectorAll('[data-ch]');
          letters.forEach((node, li) => {
            const el = node as HTMLElement;
            const orig = originals[i][li] === ' ' ? '\u00A0' : originals[i][li];
            if (i === 4 && code > 0.05 && vanished < 0.3) {
              el.textContent = glyph(i * 37 + li, code * 15 + raw);
            } else {
              el.textContent = orig;
            }
          });
        }

        if (note) {
          const vis = smoothstep(1 - Math.min(dist * 1.2, 1)) * (1 - code) * (1 - vanished);
          note.style.opacity = String(vis);
          note.style.transform = `translate3d(-50%, ${(1 - vis) * 10}px, 0)`;
        }

        if (dot) {
          const on = (active > 0.5 || code > 0.3) && vanished < 0.55;
          dot.style.opacity = String(1 - vanished);
          dot.style.transform = `scaleY(${mix(0.25, 1, active)})`;
          dot.style.backgroundColor = on ? '#d7ff4f' : 'rgba(245,243,238,0.25)';
        }
      }

      if (finishCardRef.current) {
        finishCardRef.current.style.opacity = String(smoothstep(popup));
        finishCardRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${mix(0.92, 1, smoothstep(popup))})`;
        finishCardRef.current.style.pointerEvents = popup > 0.5 ? 'auto' : 'none';
      }
    };

    let rainRaf = 0;
    const cols: { x: number; y: number; speed: number; chars: string[] }[] = [];
    const setupRain = () => {
      if (!rain) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rain.width = Math.floor(w * dpr);
      rain.height = Math.floor(h * dpr);
      rain.style.width = `${w}px`;
      rain.style.height = `${h}px`;
      cols.length = 0;
      const colW = 22;
      for (let x = 12; x < w; x += colW) {
        cols.push({
          x,
          y: Math.random() * h,
          speed: 1.6 + Math.random() * 3.5,
          chars: Array.from({ length: 16 }, (_, i) => glyph(i, x)),
        });
      }
    };
    setupRain();

    const drawRain = () => {
      rainRaf = requestAnimationFrame(drawRain);
      if (!rain) return;
      const ctx = rain.getContext('2d');
      if (!ctx) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const a = matrixAlpha.current;
      if (a < 0.02) return;
      ctx.font = '13px "JetBrains Mono", monospace';
      cols.forEach((c) => {
        c.y += c.speed * (0.8 + a * 2.2);
        if (c.y > h + 80) c.y = -80;
        c.chars.forEach((_, i) => {
          const yy = c.y - i * 16;
          if (yy < -20 || yy > h + 20) return;
          ctx.globalAlpha = a * (1 - i / c.chars.length) * 0.75;
          ctx.fillStyle = i === 0 ? '#f5f3ee' : '#d7ff4f';
          ctx.fillText(glyph(i, c.y * 0.05 + a), c.x, yy);
        });
      });
      ctx.globalAlpha = 1;
    };
    rainRaf = requestAnimationFrame(drawRain);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      paint(0, 0, 0, 1);
      return () => cancelAnimationFrame(rainRaf);
    }

    paint(0, 0, 0, 0);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: '+=480%',
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const n = SKILLS.length;
          const skillEnd = 0.55;
          const matrixStart = 0.55;
          const matrixEnd = 0.72;
          const vanishEnd = 0.84;
          const popupEnd = 1.0;

          if (p <= skillEnd) {
            paint(clamp01(p / skillEnd) * (n - 1), 0, 0, 0);
            return;
          }
          if (p <= matrixEnd) {
            const mc = smoothstep((p - matrixStart) / (matrixEnd - matrixStart));
            paint(n - 1, mc, 0, 0);
            return;
          }
          if (p <= vanishEnd) {
            const vanished = smoothstep((p - matrixEnd) / (vanishEnd - matrixEnd));
            paint(n - 1, 1, vanished, 0);
            return;
          }
          const popup = smoothstep((p - vanishEnd) / (popupEnd - vanishEnd));
          paint(n - 1, 1, 1, popup);
        },
      });
    }, root);

    const onResize = () => {
      setupRain();
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rainRaf);
      ctx.revert();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative z-10 overflow-hidden bg-[#171715]">
      <div
        ref={stageRef}
        className="relative h-[100svh] min-h-[520px] flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-24"
        style={{
          boxShadow: '0 -40px 80px rgba(0,0,0,0.45)',
          borderTop: '1px solid rgba(245,243,238,0.08)',
        }}
      >
        <canvas ref={rainRef} className="pointer-events-none absolute inset-0 z-[2]" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(90% 60% at 50% 42%, rgba(215,255,79,0.045), transparent 62%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7ff4f]/35 to-transparent"
        />

        <div
          ref={headerRef}
          className="absolute top-20 md:top-28 left-4 sm:left-6 lg:left-12 xl:left-24 right-4 sm:right-6 lg:right-12 xl:right-24 max-w-[1600px] mx-auto flex items-center justify-between gap-4 z-20"
        >
          <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88]">What I Do</p>
          <p className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-[#8f8f88]">
            <span ref={counterRef} className="text-[#d7ff4f]">01</span> — 05
          </p>
        </div>

        <div ref={stackRef} className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center will-change-transform">
          <div className="flex flex-col items-center w-full select-none">
            {SKILLS.map((skill, i) => (
              <div key={skill.title} className="flex h-[1.22em] w-full items-center justify-center">
                <h3
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="font-display text-center text-[10.6vw] sm:text-[9.4vw] md:text-[7vw] lg:text-[6vw] leading-[0.92] tracking-[-0.04em] whitespace-normal md:whitespace-nowrap max-w-full origin-center will-change-transform"
                  style={{ color: i === 0 ? skill.color : DIM }}
                >
                  {Array.from(skill.title).map((ch, li) => (
                    <span key={li} data-ch>
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  ))}
                </h3>
              </div>
            ))}
          </div>

          <div className="relative mt-3 md:mt-5 h-8 sm:h-9 md:h-12 w-full">
            {SKILLS.map((skill, i) => (
              <p
                key={skill.note}
                ref={(el) => { noteRefs.current[i] = el; }}
                className="hand-note pointer-events-none absolute left-1/2 top-0 whitespace-nowrap text-[#d7c4aa] text-[15px] sm:text-lg md:text-[1.7rem] lg:text-[1.9rem] leading-none"
                style={{
                  opacity: i === 0 ? 1 : 0,
                  transform: 'translate3d(-50%, 0, 0)',
                }}
              >
                {skill.note}
              </p>
            ))}
          </div>
        </div>

        <div
          ref={finishCardRef}
          className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none px-6"
          style={{ opacity: 0, transform: 'translate3d(-50%, -50%, 0) scale(0.92)' }}
        >
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#d7ff4f] mb-3">Follow The Code</p>
          <h2 className="text-[7vw] sm:text-[5vw] md:text-[4vw] font-display text-[#f5f3ee] tracking-tight mb-6">
            Continue into selected work
          </h2>
          <div className="inline-block px-8 py-4 rounded-full border border-[#d7ff4f]/40 bg-[#171715]/90 backdrop-blur-md text-xs font-bold uppercase tracking-[0.3em] text-[#d7ff4f]">
            Scroll to Enter
          </div>
        </div>

        <div className="absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 flex-col gap-2 items-center z-20 hidden md:flex" aria-hidden>
          {SKILLS.map((s, i) => (
            <span
              key={s.title}
              ref={(el) => { dotRefs.current[i] = el; }}
              className="block w-[3px] h-6 rounded-full origin-center"
              style={{ backgroundColor: i === 0 ? '#d7ff4f' : 'rgba(245,243,238,0.25)', transform: i === 0 ? 'scaleY(1)' : 'scaleY(0.25)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;
