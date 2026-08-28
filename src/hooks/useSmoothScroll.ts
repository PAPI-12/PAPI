import { useEffect } from 'react';

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);

export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let current = window.scrollY;
    let target = window.scrollY;
    let raf = 0;
    let running = true;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      target = clamp(target + e.deltaY * 0.75, 0, maxScroll());
    };

    const onScroll = () => {
      if (Math.abs(window.scrollY - current) > 120) {
        current = window.scrollY;
        target = window.scrollY;
      }
    };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const max = maxScroll();
      target = clamp(target, 0, max);
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.3) current = target;
      if (Math.abs(window.scrollY - current) > 0.2) {
        window.scrollTo(0, current);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}
