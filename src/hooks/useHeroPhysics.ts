import { useEffect, type RefObject } from 'react';

type Body = {
  el: HTMLElement;
  kind: 'letter' | 'deco';
  homeX: number;
  homeY: number;
  homeRot: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  hitW: number;
  hitH: number;
  mass: number;
  dirty: boolean;
};

const IDLE_MS = 1500;
const SPRING = 20;
const FRICTION = 2.4;
const ANGULAR_SPRING = 28;
const BOUNCE = 0.62;
const MAX_SPEED = 2200;
const MAX_VR = 240;
const MAX_ROT = 18;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const hasFinePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  window.matchMedia('(hover: hover)').matches;

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

const readRotation = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  const m = new DOMMatrixReadOnly(t);
  return Math.atan2(m.b, m.a) * (180 / Math.PI);
};

const applyTransform = (b: Body) => {
  const still =
    Math.abs(b.x) < 0.25 &&
    Math.abs(b.y) < 0.25 &&
    Math.abs(b.rot) < 0.15 &&
    Math.abs(b.vx) < 4 &&
    Math.abs(b.vy) < 4 &&
    Math.abs(b.vr) < 0.4;

  if (still) {
    b.x = 0;
    b.y = 0;
    b.rot = 0;
    b.vx = 0;
    b.vy = 0;
    b.vr = 0;
    if (b.dirty) {
      b.el.style.transform = '';
      b.dirty = false;
    }
    return;
  }

  b.dirty = true;
  b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.homeRot + b.rot}deg)`;
};

const pointHits = (px: number, py: number, cx: number, cy: number, hw: number, hh: number) =>
  Math.abs(px - cx) <= hw && Math.abs(py - cy) <= hh;

const segmentHits = (
  x0: number, y0: number, x1: number, y1: number,
  cx: number, cy: number, hw: number, hh: number,
) => {
  if (pointHits(x1, y1, cx, cy, hw, hh) || pointHits(x0, y0, cx, cy, hw, hh)) return true;
  const steps = 4;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (pointHits(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, cx, cy, hw, hh)) return true;
  }
  return false;
};

export function useHeroPhysics(
  heroRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !enabled || prefersReducedMotion() || !hasFinePointer()) return;

    let bodies: Body[] = [];
    let heroW = 0;
    let heroH = 0;
    let boxLeft = 0;
    let boxTop = 0;
    let raf = 0;
    let lastT = 0;
    let lastHit = 0;
    let running = true;
    let visible = true;
    let resizeTimer = 0;

    const mouse = {
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      inside: false,
      moved: false,
    };

    const syncBox = () => {
      const r = hero.getBoundingClientRect();
      boxLeft = r.left;
      boxTop = r.top;
      heroW = r.width;
      heroH = r.height;
      return r;
    };

    const measure = () => {
      const box = syncBox();
      const els = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero-physics]')).filter((el) => {
        if (el.offsetWidth < 2 || el.offsetHeight < 2) return false;
        return getComputedStyle(el).display !== 'none';
      });

      const next: Body[] = [];
      for (const el of els) {
        el.style.transform = '';
        const r = el.getBoundingClientRect();
        const kind: Body['kind'] = el.dataset.heroPhysics === 'deco' ? 'deco' : 'letter';
        const w = r.width;
        const h = r.height;
        next.push({
          el,
          kind,
          homeX: r.left - box.left + w / 2,
          homeY: r.top - box.top + h / 2,
          homeRot: readRotation(el),
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          rot: 0,
          vr: 0,
          w,
          h,
          hitW: Math.max(w * 0.52, 22),
          hitH: Math.max(h * 0.42, 28),
          mass: kind === 'deco' ? 0.65 : 1,
          dirty: false,
        });
      }
      bodies = next;
    };

    measure();

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(() => { if (running) measure(); }).catch(() => {});

    const scheduleMeasure = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { if (running) measure(); }, 120);
    };

    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('orientationchange', scheduleMeasure, { passive: true });
    window.addEventListener('scroll', syncBox, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) syncBox();
    }, { rootMargin: '80px' });
    io.observe(hero);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      syncBox();
      const x = e.clientX - boxLeft;
      const y = e.clientY - boxTop;
      const inside = x >= -12 && y >= -12 && x <= heroW + 12 && y <= heroH + 12;

      mouse.px = mouse.moved ? mouse.x : x;
      mouse.py = mouse.moved ? mouse.y : y;
      mouse.vx = x - mouse.px;
      mouse.vy = y - mouse.py;
      mouse.x = x;
      mouse.y = y;
      mouse.inside = inside;
      mouse.moved = true;

      if (!inside) return;

      const speed = Math.hypot(mouse.vx, mouse.vy);
      if (speed < 0.2) return;

      const now = performance.now();
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const cx = b.homeX + b.x;
        const cy = b.homeY + b.y;
        const pad = 10 + Math.min(speed * 0.35, 28);
        if (!segmentHits(mouse.px, mouse.py, x, y, cx, cy, b.hitW + pad, b.hitH + pad)) continue;

        const nx = cx - x;
        const ny = cy - y;
        const dist = Math.hypot(nx, ny) || 1;
        const push = clamp(speed * 0.55, 2.5, 42) / b.mass;
        b.vx += (mouse.vx / speed) * push * 1.15 + (nx / dist) * (push * 0.35);
        b.vy += (mouse.vy / speed) * push * 1.15 + (ny / dist) * (push * 0.35);
        b.vr += clamp((nx * mouse.vy - ny * mouse.vx) * 0.08, -14, 14);
        lastHit = now;
      }
    };

    const onPointerLeave = () => {
      mouse.inside = false;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const integrate = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(integrate);
      if (!visible) return;

      const dt = lastT ? clamp((now - lastT) / 1000, 0.008, 0.032) : 1 / 60;
      lastT = now;
      const idle = now - lastHit > IDLE_MS;
      const n = bodies.length;

      for (let i = 0; i < n; i++) {
        const b = bodies[i];
        const hw = b.w * 0.5;
        const hh = b.h * 0.5;

        if (idle) {
          b.vx += -b.x * SPRING * dt;
          b.vy += -b.y * SPRING * dt;
          b.vr += -b.rot * ANGULAR_SPRING * dt;
        }

        const drag = Math.max(0, 1 - FRICTION * dt);
        b.vx *= drag;
        b.vy *= drag;
        b.vr *= Math.max(0, 1 - (FRICTION + 0.8) * dt);

        const spd = Math.hypot(b.vx, b.vy);
        if (spd > MAX_SPEED) {
          const s = MAX_SPEED / spd;
          b.vx *= s;
          b.vy *= s;
        }
        b.vr = clamp(b.vr, -MAX_VR, MAX_VR);

        b.x += b.vx * dt * 60;
        b.y += b.vy * dt * 60;
        b.rot = clamp(b.rot + b.vr * dt * 60, -MAX_ROT, MAX_ROT);

        let px = b.homeX + b.x;
        let py = b.homeY + b.y;
        const minX = hw + 2;
        const maxX = heroW - hw - 2;
        const minY = hh + 2;
        const maxY = heroH - hh - 2;

        if (px < minX) { px = minX; b.vx = Math.abs(b.vx) * BOUNCE; }
        else if (px > maxX) { px = maxX; b.vx = -Math.abs(b.vx) * BOUNCE; }
        if (py < minY) { py = minY; b.vy = Math.abs(b.vy) * BOUNCE; }
        else if (py > maxY) { py = maxY; b.vy = -Math.abs(b.vy) * BOUNCE; }

        b.x = px - b.homeX;
        b.y = py - b.homeY;
      }

      if (!idle) {
        for (let i = 0; i < n; i++) {
          const a = bodies[i];
          if (Math.hypot(a.vx, a.vy) < 8 && Math.hypot(a.x, a.y) < 8) continue;
          for (let j = i + 1; j < n; j++) {
            const b = bodies[j];
            const dx = a.homeX + a.x - (b.homeX + b.x);
            const dy = a.homeY + a.y - (b.homeY + b.y);
            const minX = (a.hitW + b.hitW) * 0.7;
            const minY = (a.hitH + b.hitH) * 0.55;
            if (Math.abs(dx) >= minX || Math.abs(dy) >= minY) continue;
            const ox = (minX - Math.abs(dx)) * Math.sign(dx || 1);
            const oy = (minY - Math.abs(dy)) * Math.sign(dy || 1);
            if (Math.abs(ox) < Math.abs(oy)) {
              a.x += ox * 0.5;
              b.x -= ox * 0.5;
              const rv = a.vx - b.vx;
              if (rv * Math.sign(dx || 1) < 0) {
                a.vx *= -0.35;
                b.vx *= -0.35;
              }
            } else {
              a.y += oy * 0.5;
              b.y -= oy * 0.5;
              const rv = a.vy - b.vy;
              if (rv * Math.sign(dy || 1) < 0) {
                a.vy *= -0.35;
                b.vy *= -0.35;
              }
            }
          }
        }
      }

      for (let i = 0; i < n; i++) applyTransform(bodies[i]);
    };

    raf = requestAnimationFrame(integrate);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('scroll', syncBox);
      io.disconnect();
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
      bodies.forEach((b) => { b.el.style.transform = ''; });
    };
  }, [heroRef, enabled]);
}
