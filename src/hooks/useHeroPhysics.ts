import { useEffect, type RefObject } from 'react';

type Body = {
  el: HTMLElement;
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
  dirty: boolean;
};

const FRICTION = 0.42;
const BOUNCE = 0.85;
const MAX_SPEED = 1400;
const MAX_ROT = 35;

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
  b.dirty = true;
  b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.homeRot + b.rot}deg)`;
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
    let running = true;
    let visible = true;
    let resizeTimer = 0;

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
        const w = r.width;
        const h = r.height;
        next.push({
          el,
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
          dirty: false,
        });
      }
      bodies = next;
    };

    measure();

    const scheduleMeasure = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { if (running) measure(); }, 160);
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
      if (e.pointerType === 'touch' || !visible) return;
      const mx = e.clientX;
      const my = e.clientY;
      if (mx < boxLeft || my < boxTop || mx > boxLeft + heroW || my > boxTop + heroH) return;

      const dx = e.movementX;
      const dy = e.movementY;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.2) return;

      const speedMultiplier = Math.min(Math.max(dist * 1.8, 12), 95);
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        const r = b.el.getBoundingClientRect();
        const pad = 32;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const toMouseDist = Math.hypot(mx - cx, my - cy);
        if (toMouseDist < r.width / 2 + pad) {
          b.vx += (dx / (dist || 1)) * speedMultiplier * 25 + (cx - mx) * 1.5;
          b.vy += (dy / (dist || 1)) * speedMultiplier * 25 + (cy - my) * 1.5;
          b.vr += clamp(dx * 0.45 - dy * 0.3, -35, 35);
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const integrate = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(integrate);
      if (!visible) {
        lastT = now;
        return;
      }

      const dt = lastT ? clamp((now - lastT) / 1000, 0.008, 0.024) : 1 / 60;
      lastT = now;
      const n = bodies.length;

      for (let i = 0; i < n; i++) {
        const b = bodies[i];
        const hw = b.w * 0.5;
        const hh = b.h * 0.5;

        const springK = 18;
        b.vx += -b.x * springK * dt;
        b.vy += -b.y * springK * dt;
        b.vr += -b.rot * (springK * 1.2) * dt;

        const drag = Math.max(0, 1 - FRICTION * dt);
        b.vx *= drag;
        b.vy *= drag;
        b.vr *= Math.max(0, 1 - (FRICTION + 0.3) * dt);

        const spd = Math.hypot(b.vx, b.vy);
        if (spd > MAX_SPEED) {
          const s = MAX_SPEED / spd;
          b.vx *= s;
          b.vy *= s;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot = clamp(b.rot + b.vr * dt, -MAX_ROT, MAX_ROT);

        let px = b.homeX + b.x;
        let py = b.homeY + b.y;
        const minX = hw + 4;
        const maxX = heroW - hw - 4;
        const minY = hh + 4;
        const maxY = heroH - hh - 4;

        if (px < minX) { px = minX; b.vx = Math.abs(b.vx) * BOUNCE; }
        else if (px > maxX) { px = maxX; b.vx = -Math.abs(b.vx) * BOUNCE; }
        if (py < minY) { py = minY; b.vy = Math.abs(b.vy) * BOUNCE; }
        else if (py > maxY) { py = maxY; b.vy = -Math.abs(b.vy) * BOUNCE; }

        b.x = px - b.homeX;
        b.y = py - b.homeY;
        applyTransform(b);
      }
    };

    raf = requestAnimationFrame(integrate);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.removeEventListener('scroll', syncBox);
      window.removeEventListener('pointermove', onPointerMove);
      io.disconnect();
      bodies.forEach((b) => { b.el.style.transform = ''; });
    };
  }, [heroRef, enabled]);
}
