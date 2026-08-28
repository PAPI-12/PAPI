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

const WhatIDo: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      itemRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = '1';
          el.style.filter = 'none';
          el.style.transform = 'none';
        }
      });
      if (innerRef.current) innerRef.current.style.opacity = '1';
      return;
    }

    const pinnedStage = innerRef.current;
    if (!pinnedStage) return;

    const ctx = gsap.context(() => {
      const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];

      items.forEach((el, i) => {
        gsap.set(el, {
          opacity: i === 0 ? 1 : 0.18,
          scale: i === 0 ? 1.03 : 0.97,
          color: i === 0 ? SKILLS[i].color : DIM,
          willChange: 'transform, opacity',
        });
      });
      gsap.set(dotRefs.current, { scaleY: 0.25, backgroundColor: 'rgba(245,243,238,0.25)' });
      gsap.set(dotRefs.current[0], { scaleY: 1, backgroundColor: '#d7ff4f' });

      // Fade in before pinning for a seamless overlap with the ABOUT section.
      gsap.fromTo(
        pinnedStage,
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: true },
        },
      );

      const setActive = (i: number) => {
        if (counterRef.current) counterRef.current.textContent = `0${i + 1}`;
        dotRefs.current.forEach((d, j) => {
          if (!d) return;
          gsap.to(d, { scaleY: j === i ? 1 : 0.25, backgroundColor: j === i ? '#d7ff4f' : 'rgba(245,243,238,0.25)', duration: 0.35, overwrite: 'auto' });
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 0.72 },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: '+=300%',
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Brief hold at the start.
      tl.to({}, { duration: 0.25 });

      // Five equal segments. Active = full color/full opacity/slight scale;
      // inactive = ~18% opacity, darker tint.
      SKILLS.forEach((skill, i) => {
        if (i === 0) return;
        const pos = `seg${i}`;
        tl.call(() => setActive(i), undefined, pos);
        items.forEach((el, j) => {
          if (j === i) {
            tl.to(el, { opacity: 1, scale: 1.03, color: skill.color }, pos);
          } else {
            tl.to(el, { opacity: 0.18, scale: 0.97, color: DIM }, pos);
          }
        });
      });

      tl.to({}, { duration: 0.35 });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative overflow-hidden bg-[#171715]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 70% at 50% 50%, rgba(215,255,79,0.05), transparent 60%)' }}
      />

      <div
        ref={innerRef}
        className="relative h-[100svh] min-h-[520px] flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-24 overflow-hidden"
      >
        {/* Top meta — part of flow-safe absolute area, not overlapping stack */}
        <div className="absolute top-20 md:top-28 left-4 sm:left-6 lg:left-12 xl:left-24 right-4 sm:right-6 lg:right-12 xl:right-24 max-w-[1600px] mx-auto flex items-center justify-between gap-4 z-20">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88]">What I Do</p>
          <p className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-[#8f8f88]">
            <span ref={counterRef} className="text-[#d7ff4f]">01</span> — 05
          </p>
        </div>

        {/* Centered heading stack */}
        <div className="max-w-[1600px] w-full mx-auto relative z-10 flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 select-none text-center">
            {SKILLS.map((skill, i) => (
              <div
                key={skill.title}
                ref={(el) => { itemRefs.current[i] = el; }}
                className="flex flex-col items-center md:flex-row md:items-baseline md:justify-center gap-0 md:gap-8 w-full max-w-full overflow-hidden"
              >
                <h3 className="font-display text-[10vw] sm:text-[9vw] md:text-[6.6vw] lg:text-[5.6vw] leading-[0.93] tracking-[-0.04em] whitespace-pre-line md:whitespace-nowrap break-words max-w-full">
                  {skill.title}
                </h3>
                <span className="hand-note text-[#8f8f88] text-sm sm:text-base md:text-2xl md:pb-1 shrink-0">
                  {skill.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress rail */}
        <div className="absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-center z-20 hidden md:flex" aria-hidden>
          {SKILLS.map((s, i) => (
            <span
              key={s.title}
              ref={(el) => { dotRefs.current[i] = el; }}
              className="block w-[3px] h-6 rounded-full origin-center"
              style={{ backgroundColor: 'rgba(245,243,238,0.25)' }}
            />
          ))}
        </div>

        <p className="hand-note absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 text-[#d7c4aa] text-xs sm:text-sm md:text-xl rotate-[-2deg] whitespace-nowrap z-20">
          scroll to move through the practice
        </p>
      </div>
    </div>
  );
};

export default WhatIDo;
