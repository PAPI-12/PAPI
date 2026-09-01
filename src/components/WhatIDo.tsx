import React, { useEffect, useRef } from 'react';

const SKILLS = [
  { title: 'UX/UI DESIGN', note: 'interfaces with instinct', color: '#f5f3ee' },
  { title: 'ART DIRECTION', note: 'visual systems with attitude', color: '#d7ff4f' },
  { title: 'CINEMATOGRAPHY', note: 'motion shaped by feeling', color: '#d7c4aa' },
  { title: 'GRAPHIC DESIGNER', note: 'culture-led systems & print', color: '#d7ff4f' },
  { title: 'AI CREATIVE', note: 'future-facing image craft', color: '#f5f3ee' },
];

const N = SKILLS.length;
const LAST = N - 1;

/** Glyph pool for the code effect. */
const MATRIX_GLYPHS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789<>*+-=/\\|#$%&@';


const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Deterministic per-slot glyph so letters don't strobe randomly every frame. */
const glyphFor = (seed: number) => MATRIX_GLYPHS[Math.abs(seed) % MATRIX_GLYPHS.length];

/* ── Timeline (fractions of the pinned scroll) ─────────────────────────────
   0.00 → 0.56  the five skills, each with a dwell so it is genuinely read
   0.56 → 0.62  hold on AI CREATIVE
   0.62 → 0.72  AI CREATIVE encodes into Matrix glyphs, rain builds
   0.72 → 0.80  the title browns out and dies, rain at full strength
   0.80 → 0.87  INITIALIZING terminal boots
   0.87 → 1.00  the machine speaks, three lines
   The section releases when the pin runs out of travel, so the visitor only
   moves on once the machine has finished. Nothing hijacks the scroll, so
   there is nothing that can jam or freeze.                                 */
const T_SKILLS_END = 0.56;
const T_HOLD_END = 0.62;
const T_CODE_END = 0.72;
const T_VANISH_END = 0.80;
const T_INIT_START = 0.80;
const T_INIT_END = 0.86;
/** After this the dialogue fades, leaving only the code to lead the way out. */
const T_RELEASE = 0.96;

/** Share of each skill's slot spent held at the front before advancing. */
const DWELL = 0.58;

/** Machine dialogue, revealed one line at a time. */
const ROBOT_LINES = [
  'OH, HELLO',
  'YOU CAN NOW CONTINUE TO FEATURED WORK',
  'FOLLOW THE MATRIX CODE',
];

/**
 * Front-of-stack position for a given scroll progress. Rather than sliding
 * linearly (which meant the middle skills flashed past unread) each skill owns
 * an equal slot and sits still for the first DWELL of it, then hands over.
 */
const frontAt = (p: number) => {
  const u = clamp01(p / T_SKILLS_END) * N;
  const i = Math.min(LAST, Math.floor(u));
  const f = u - i;
  const advance = f <= DWELL ? 0 : (f - DWELL) / (1 - DWELL);
  return Math.min(LAST, i + advance);
};

/** Reveal `text` progressively; returns the visible substring. */
const typed = (text: string, t: number) => text.slice(0, Math.round(text.length * clamp01(t)));

const WhatIDo: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const titleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const noteRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const initRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const cards = cardRefs.current;
    const titles = titleRefs.current;
    const notes = noteRefs.current;
    const dots = dotRefs.current;
    const originals = SKILLS.map((s) => Array.from(s.title));

    /** 0 = no rain, 1 = full rain. Read by the canvas loop. */
    let rainAlpha = 0;
    let activeIdx = -1;
    let lastCounter = -1;

    /* ── Stack painting ─────────────────────────────────────────────── */

    const paint = (p: number) => {
      // Front of the stack, with a dwell on each skill so all five are read.
      const front = frontAt(p);

      const codeT =
        p <= T_HOLD_END ? 0 : smoothstep((p - T_HOLD_END) / (T_CODE_END - T_HOLD_END));
      const vanishT =
        p <= T_CODE_END ? 0 : smoothstep((p - T_CODE_END) / (T_VANISH_END - T_CODE_END));
      // Raw (un-eased) vanish, used for the power-down so the die-out reads as
      // a failing supply rather than a smooth fade.
      const vanishRaw = clamp01((p - T_CODE_END) / (T_VANISH_END - T_CODE_END));
      const initT =
        p <= T_INIT_START ? 0 : clamp01((p - T_INIT_START) / (T_INIT_END - T_INIT_START));
      const speakT =
        p <= T_INIT_END ? 0 : clamp01((p - T_INIT_END) / (T_RELEASE - T_INIT_END));
      // Terminal dissolves on the way out so the last thing on screen is the
      // code itself, which then scrolls away with the stage into Featured Work.
      const releaseT =
        p <= T_RELEASE ? 0 : smoothstep((p - T_RELEASE) / (1 - T_RELEASE));

      rainAlpha = Math.max(codeT * 0.85, vanishT);

      const idx = Math.min(LAST, Math.round(front));
      if (idx !== lastCounter) {
        lastCounter = idx;
        if (counterRef.current) counterRef.current.textContent = `0${idx + 1}`;
      }
      activeIdx = idx;

      for (let i = 0; i < N; i++) {
        const card = cards[i];
        const title = titles[i];
        if (!card) continue;

        // Depth: > 0 means still stacked behind, 0 = front, < 0 = passed.
        const depth = i - front;
        const isLast = i === LAST;

        let scale: number;
        let opacity: number;

        if (depth >= 0) {
          // Behind the front: medium size, low opacity, rising toward the user.
          scale = 1 / (1 + depth * 0.42);
          opacity = Math.max(0, 1 - depth * 0.52);
        } else {
          // Already passed: rushes toward the viewer, growing to fill the
          // section as it goes, and fades out as it overflows the frame.
          const d = -depth;
          scale = 1 + d * 0.95;
          opacity = Math.max(0, 1 - d * 1.15);
        }

        // The final card does not fly past — it stays front and centre to be
        // encoded, then dissolves.
        if (isLast) {
          scale = Math.min(scale, 1);
          opacity = depth >= 0 ? Math.max(0, 1 - depth * 0.52) : 1;
          // Power-down: the supply gutters a few times before it dies, and the
          // glyphs swell slightly as the last of the charge dumps out.
          if (vanishRaw > 0) {
            const gutter = Math.sin(vanishRaw * 34) * 0.5 + 0.5;
            const brownout = (1 - vanishRaw) * (0.55 + gutter * 0.45);
            opacity *= Math.max(0, brownout);
            // Swells to fill the section as the charge dumps out, so it dies
            // large rather than shrinking away.
            scale *= 1 + vanishRaw * 0.42;
          }
        }

        // Cards far off the stack are removed from the compositor entirely.
        const shown = opacity > 0.004 && depth < 3.4;
        card.style.visibility = shown ? 'visible' : 'hidden';
        if (!shown) continue;

        card.style.opacity = opacity.toFixed(3);
        card.style.transform = `translate3d(-50%, -50%, 0) scale(${scale.toFixed(4)})`;
        // Nearer cards paint on top.
        card.style.zIndex = String(100 - Math.round(depth * 10));

        if (title) {
          // Encode only the final title, and only during the code phase.
          if (isLast && codeT > 0.001) {
            const letters = title.children;
            const total = letters.length;
            for (let li = 0; li < total; li++) {
              const el = letters[li] as HTMLElement;
              const orig = originals[i][li];
              if (orig === ' ') continue;
              // Letters convert left-to-right as codeT advances.
              const threshold = li / total;
              if (codeT > threshold) {
                // Slow, readable churn rather than per-frame noise.
                const tick = Math.floor(codeT * 26) + li * 7;
                el.textContent = glyphFor(tick);
                el.style.color = '#4ade80';
              } else {
                el.textContent = orig;
                el.style.color = '';
              }
            }
            title.style.textShadow = `0 0 ${(12 * codeT).toFixed(1)}px rgba(74,222,128,${(0.5 * codeT).toFixed(2)})`;
          } else if (isLast) {
            const letters = title.children;
            for (let li = 0; li < letters.length; li++) {
              const el = letters[li] as HTMLElement;
              el.textContent = originals[i][li];
              el.style.color = '';
            }
            title.style.textShadow = 'none';
          }
        }
      }

      // Bottom copy follows the front card and fades out with the code phase.
      for (let i = 0; i < N; i++) {
        const note = notes[i];
        if (!note) continue;
        const dist = Math.abs(front - i);
        const vis = smoothstep(1 - Math.min(dist * 1.25, 1)) * (1 - codeT);
        const shown = vis > 0.004;
        note.style.visibility = shown ? 'visible' : 'hidden';
        if (!shown) continue;
        note.style.opacity = vis.toFixed(3);
        note.style.transform = `translate3d(-50%, ${((1 - vis) * 10).toFixed(1)}px, 0)`;
      }

      for (let i = 0; i < N; i++) {
        const dot = dots[i];
        if (!dot) continue;
        const on = i === activeIdx;
        dot.style.transform = `scaleY(${on ? 1 : 0.25})`;
        dot.style.backgroundColor = on ? '#d7ff4f' : 'rgba(245,243,238,0.25)';
        dot.style.opacity = String(1 - vanishT);
      }

      if (headerRef.current) {
        headerRef.current.style.opacity = (1 - smoothstep(vanishT * 1.2)).toFixed(3);
      }

      if (cueRef.current) {
        const o = 1 - smoothstep(Math.max(codeT, vanishT) * 1.3);
        cueRef.current.style.opacity = o.toFixed(3);
        cueRef.current.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      }

      /* ── Terminal boot, then the machine speaks ─────────────────── */

      const term = termRef.current;
      if (term) {
        const live = initT > 0 || speakT > 0;
        term.style.visibility = live ? 'visible' : 'hidden';
        term.style.opacity = live ? (1 - releaseT).toFixed(3) : '0';
      }

      if (initRef.current) {
        if (initT > 0 && speakT <= 0) {
          // Dots accrue as it boots, then the whole line reports OK.
          const dots = Math.min(5, Math.floor(initT * 7));
          initRef.current.textContent = `INITIALIZING${'.'.repeat(dots)}`;
          initRef.current.style.opacity = '1';
        } else if (speakT > 0) {
          initRef.current.textContent = 'INITIALIZING..... OK';
          initRef.current.style.opacity = '0.45';
        } else {
          initRef.current.style.opacity = '0';
        }
      }

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${(speakT > 0 ? 1 : initT).toFixed(3)})`;
        barRef.current.style.opacity = initT > 0 ? '1' : '0';
      }

      // Three lines, each typed within its own third of the speaking phase.
      for (let i = 0; i < ROBOT_LINES.length; i++) {
        const el = lineRefs.current[i];
        if (!el) continue;
        const slot = 1 / ROBOT_LINES.length;
        const t = clamp01((speakT - i * slot) / (slot * 0.75));
        if (t <= 0) {
          el.style.visibility = 'hidden';
          continue;
        }
        el.style.visibility = 'visible';
        const txt = typed(ROBOT_LINES[i], t);
        if (el.dataset.txt !== txt) {
          el.dataset.txt = txt;
          el.textContent = txt;
        }
        // Caret only on the line currently being written.
        el.dataset.caret = t < 1 ? 'true' : 'false';
      }
    };

    /* ── Matrix rain ────────────────────────────────────────────────── */

    const canvas = rainRef.current;
    const rctx = canvas?.getContext('2d') ?? null;
    let columns: { x: number; y: number; speed: number; len: number; seed: number }[] = [];
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    const FONT_SIZE = 16;
    const ROW = 18;

    const setupRain = () => {
      if (!canvas || !rctx) return;
      cw = stage.clientWidth;
      ch = stage.clientHeight;
      if (cw < 8 || ch < 8) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const spacing = 26;
      const count = Math.ceil(cw / spacing);
      columns = [];
      for (let i = 0; i < count; i++) {
        columns.push({
          x: i * spacing + 6,
          y: Math.random() * ch,
          speed: 90 + Math.random() * 190,
          len: 8 + Math.floor(Math.random() * 12),
          seed: Math.floor(Math.random() * 1000),
        });
      }
    };

    /* ── Frame loop ─────────────────────────────────────────────────── */

    let raf = 0;
    let running = true;
    let onScreen = false;
    let lastT = 0;
    let lastProgress = -1;
    let rainDrawn = false;

    const readProgress = () => {
      const rect = root.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return 0;
      return clamp01(-rect.top / travel);
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!onScreen || document.hidden) { lastT = 0; return; }

      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
      lastT = now;

      const p = readProgress();
      // Only repaint the stack when the scroll position actually changed.
      if (Math.abs(p - lastProgress) > 0.0002) {
        lastProgress = p;
        paint(p);
      }

      // Rain
      if (rctx) {
        if (rainAlpha > 0.01) {
          rainDrawn = true;
          rctx.clearRect(0, 0, cw, ch);
          rctx.font = `${FONT_SIZE}px "JetBrains Mono", ui-monospace, monospace`;
          rctx.textBaseline = 'top';

          for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            col.y += col.speed * dt;
            if (col.y - col.len * ROW > ch) {
              col.y = -Math.random() * ch * 0.5;
              col.speed = 90 + Math.random() * 190;
              col.len = 8 + Math.floor(Math.random() * 12);
            }
            for (let k = 0; k < col.len; k++) {
              const y = col.y - k * ROW;
              if (y < -ROW || y > ch) continue;
              const fade = 1 - k / col.len;
              rctx.globalAlpha = rainAlpha * fade * 0.85;
              rctx.fillStyle = k === 0 ? '#eafff0' : '#4ade80';
              rctx.fillText(glyphFor(col.seed + k + Math.floor(col.y / ROW)), col.x, y);
            }
          }
          rctx.globalAlpha = 1;
        } else if (rainDrawn) {
          rctx.clearRect(0, 0, cw, ch);
          rainDrawn = false;
        }
      }
    };

    /* ── Wiring ─────────────────────────────────────────────────────── */

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setupRain();
    paint(0);

    if (reduce) {
      // No pinned choreography and no tall spacer: present the skills as a
      // simple readable list instead.
      root.style.height = 'auto';
      const stageEl = stageRef.current;
      if (stageEl) {
        stageEl.style.position = 'static';
        stageEl.style.height = 'auto';
        stageEl.style.overflow = 'visible';
        stageEl.style.paddingTop = '6rem';
        stageEl.style.paddingBottom = '4rem';
      }
      // Both the stack wrapper and its inner host are absolutely positioned
      // for the pinned layout; return them to normal flow.
      const listOuter = cards[0]?.parentElement?.parentElement;
      if (listOuter) {
        listOuter.style.position = 'static';
        listOuter.style.padding = '0';
      }
      const listHost = cards[0]?.parentElement;
      if (listHost) {
        listHost.style.height = 'auto';
        listHost.style.display = 'flex';
        listHost.style.flexDirection = 'column';
        listHost.style.alignItems = 'center';
        listHost.style.justifyContent = 'center';
        listHost.style.gap = '0.35rem';
      }
      cards.forEach((c) => {
        if (!c) return;
        c.style.position = 'relative';
        c.style.left = 'auto';
        c.style.top = 'auto';
        c.style.visibility = 'visible';
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
      notes.forEach((nEl) => { if (nEl) nEl.style.visibility = 'hidden'; });
      if (cueRef.current) cueRef.current.style.visibility = 'hidden';
      // Terminal moves into normal flow beneath the list; leaving it absolutely
      // centred would stack it straight on top of the skills.
      if (termRef.current) {
        const t = termRef.current;
        t.style.position = 'static';
        t.style.visibility = 'visible';
        t.style.opacity = '1';
        t.style.paddingTop = '2.5rem';
      }
      if (initRef.current) initRef.current.textContent = 'INITIALIZING..... OK';
      ROBOT_LINES.forEach((line, i) => {
        const el = lineRefs.current[i];
        if (!el) return;
        el.style.visibility = 'visible';
        el.textContent = line;
      });
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = !!entry?.isIntersecting;
        if (onScreen) { lastT = 0; setupRain(); }
      },
      { rootMargin: '15% 0px' },
    );
    io.observe(root);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setupRain();
        lastProgress = -1;
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, []);

  return (
    // Tall spacer drives the pin; the stage inside is what stays on screen.
    <div ref={rootRef} className="relative z-10 h-[560svh] bg-[#171715]">
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] min-h-[520px] overflow-hidden bg-[#171715]"
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

        {/* Matrix rain sits behind the type but above the ambient wash. */}
        <canvas ref={rainRef} className="pointer-events-none absolute inset-0 z-[2]" aria-hidden />

        <div
          ref={headerRef}
          className="absolute top-20 md:top-28 left-4 sm:left-6 lg:left-12 xl:left-24 right-4 sm:right-6 lg:right-12 xl:right-24 flex items-center justify-between gap-4 z-20"
        >
          <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88]">What I Do</p>
          <p className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-[#8f8f88]">
            <span ref={counterRef} className="text-[#d7ff4f]">01</span> — 0{N}
          </p>
        </div>

        {/* Skill stack. Every card occupies the same centre point; depth is
            expressed purely through scale + opacity, so nothing reflows. */}
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6 lg:px-12">
          <div className="relative w-full h-full">
            {SKILLS.map((skill, i) => (
              <div
                key={skill.title}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="absolute left-1/2 top-1/2 w-full select-none will-change-transform"
                style={{ transform: 'translate3d(-50%, -50%, 0)', visibility: 'hidden' }}
              >
                <h3
                  ref={(el) => { titleRefs.current[i] = el; }}
                  className="font-display text-center text-[9.6vw] sm:text-[9.2vw] md:text-[9vw] lg:text-[8.5vw] leading-[0.95] tracking-[-0.04em] whitespace-nowrap"
                  style={{ color: skill.color }}
                >
                  {Array.from(skill.title).map((ch, li) => (
                    <span key={li}>{ch === ' ' ? '\u00A0' : ch}</span>
                  ))}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Copy for the front-most skill. */}
        {/* Skill copy, parked directly beneath the stack rather than floating
            near the bottom edge, so title and caption read as one unit. */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 mt-[6.2vw] md:mt-[5.8vw] lg:mt-[5.4vw] h-10">
          {SKILLS.map((skill, i) => (
            <p
              key={skill.note}
              ref={(el) => { noteRefs.current[i] = el; }}
              className="hand-note absolute left-1/2 top-0 whitespace-nowrap text-[#d7c4aa] text-[15px] sm:text-lg md:text-[1.7rem] lg:text-[1.9rem] leading-none"
              style={{ transform: 'translate3d(-50%, 0, 0)', visibility: 'hidden' }}
            >
              {skill.note}
            </p>
          ))}
        </div>

        <div className="absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 flex-col gap-2 items-center z-20 hidden md:flex" aria-hidden>
          {SKILLS.map((s, i) => (
            <span
              key={s.title}
              ref={(el) => { dotRefs.current[i] = el; }}
              className="block w-[3px] h-6 rounded-full origin-center"
              style={{
                backgroundColor: i === 0 ? '#d7ff4f' : 'rgba(245,243,238,0.25)',
                transform: i === 0 ? 'scaleY(1)' : 'scaleY(0.25)',
              }}
            />
          ))}
        </div>

        {/* Scroll hint sits just under the caption so there is no dead black
            band between the content and the bottom of the section. */}
        <p
          ref={cueRef}
          className="hand-note absolute left-1/2 top-1/2 mt-[10.5vw] md:mt-[9.4vw] lg:mt-[8.6vw] -translate-x-1/2 text-[#d7c4aa] text-xs sm:text-sm md:text-xl rotate-[-2deg] whitespace-nowrap z-20"
        >
          scroll to move through the practice
        </p>

        {/* Machine terminal. Occupies the exact centre the stack vacated. */}
        <div
          ref={termRef}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 md:gap-6 px-6"
          style={{ visibility: 'hidden', opacity: 0, transition: 'opacity 200ms linear' }}
          aria-live="polite"
        >
          <div className="flex w-full max-w-[min(34rem,82vw)] flex-col items-center gap-2">
            <p
              ref={initRef}
              className="font-mono text-center text-[#4ade80] text-[2.6vw] sm:text-[1.5vw] md:text-[0.95vw] lg:text-[0.8vw] tracking-[0.34em] whitespace-nowrap"
              style={{ opacity: 0 }}
            />
            {/* Boot progress. */}
            <span className="block h-px w-full overflow-hidden bg-[#4ade80]/15" aria-hidden>
              <span
                ref={barRef}
                className="block h-full w-full origin-left bg-[#4ade80]"
                style={{ transform: 'scaleX(0)', opacity: 0 }}
              />
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-4">
            {ROBOT_LINES.map((line, i) => (
              <p
                key={line}
                ref={(el) => { lineRefs.current[i] = el; }}
                data-caret="false"
                className={`robot-line text-center whitespace-nowrap ${
                  i === 0
                    ? 'font-display text-[#f5f3ee] text-[7vw] sm:text-[5vw] md:text-[3.4vw] lg:text-[2.9vw] leading-none tracking-[-0.02em]'
                    : i === 1
                      ? 'font-display text-[#d7ff4f] text-[3.1vw] sm:text-[2.7vw] md:text-[2.1vw] lg:text-[1.75vw] leading-none tracking-[0.01em]'
                      : 'font-mono text-[#4ade80] text-[2.4vw] sm:text-[1.7vw] md:text-[1.05vw] lg:text-[0.9vw] tracking-[0.4em]'
                }`}
                style={{ visibility: 'hidden' }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WhatIDo;
