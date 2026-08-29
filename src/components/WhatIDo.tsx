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

const WhatIDo: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const noteRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);
  const activeIndex = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const items = itemRefs.current;
    const notes = noteRefs.current;
    const dots = dotRefs.current;

    const paint = (raw: number) => {
      const n = SKILLS.length;
      const idx = Math.round(Math.min(n - 1, Math.max(0, raw)));
      if (idx !== activeIndex.current) {
        activeIndex.current = idx;
        if (counterRef.current) counterRef.current.textContent = `0${idx + 1}`;
      }

      for (let i = 0; i < n; i++) {
        const dist = Math.abs(raw - i);
        const active = smoothstep(1 - Math.min(dist, 1));
        const item = items[i];
        const note = notes[i];
        const dot = dots[i];
        const rgb = SKILL_RGB[i];

        if (item) {
          item.style.opacity = String(mix(0.18, 1, active));
          item.style.transform = `scale(${mix(0.985, 1.03, active)})`;
          item.style.color = rgbToCss(
            mix(DIM_RGB.r, rgb.r, active),
            mix(DIM_RGB.g, rgb.g, active),
            mix(DIM_RGB.b, rgb.b, active),
          );
        }

        if (note) {
          const vis = smoothstep(1 - Math.min(dist * 1.2, 1));
          note.style.opacity = String(vis);
          note.style.transform = `translate3d(-50%, ${(1 - vis) * 8}px, 0)`;
        }

        if (dot) {
          dot.style.transform = `scaleY(${mix(0.25, 1, active)})`;
          dot.style.backgroundColor = active > 0.5 ? '#d7ff4f' : 'rgba(245,243,238,0.25)';
        }
      }

      if (cueRef.current) {
        const end = smoothstep((raw - (n - 1.25)) / 0.4);
        cueRef.current.textContent =
          end > 0.55 ? 'continue into selected work' : 'scroll to move through the practice';
      }
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      paint(0);
      notes.forEach((el) => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'translate3d(-50%, 0, 0)';
      });
      return;
    }

    paint(0);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: '+=320%',
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const n = SKILLS.length;
          const p = self.progress;
          const hold = 0.08;
          const t = clamp01((p - hold) / (1 - hold * 2));
          paint(t * (n - 1));
        },
      });
    }, root);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(90% 60% at 50% 42%, rgba(215,255,79,0.045), transparent 62%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d7ff4f]/35 to-transparent"
        />

        <div className="absolute top-20 md:top-28 left-4 sm:left-6 lg:left-12 xl:left-24 right-4 sm:right-6 lg:right-12 xl:right-24 max-w-[1600px] mx-auto flex items-center justify-between gap-4 z-20">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88]">What I Do</p>
          <p className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-[#8f8f88]">
            <span ref={counterRef} className="text-[#d7ff4f]">01</span> — 05
          </p>
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center">
          <div className="flex flex-col items-center w-full select-none">
            {SKILLS.map((skill, i) => (
              <h3
                key={skill.title}
                ref={(el) => { itemRefs.current[i] = el; }}
                className="font-display text-center text-[10.6vw] sm:text-[9.4vw] md:text-[7vw] lg:text-[6vw] leading-[0.92] tracking-[-0.04em] whitespace-normal md:whitespace-nowrap max-w-full origin-center py-[0.06em]"
                style={{ color: i === 0 ? skill.color : DIM }}
              >
                {skill.title}
              </h3>
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

        <p
          ref={cueRef}
          className="hand-note absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 text-[#d7c4aa] text-xs sm:text-sm md:text-xl rotate-[-2deg] whitespace-nowrap z-20"
        >
          scroll to move through the practice
        </p>
      </div>
    </div>
  );
};

export default WhatIDo;
