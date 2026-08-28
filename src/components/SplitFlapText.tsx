import React, { useEffect, useState } from 'react';

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&/0123456789';

// Approximate advance widths (in em) for Inter Black uppercase so each tile
// reserves exactly the space its *target* letter needs. This prevents the
// word from reflowing while letters are scrambling — the core cause of the
// old "glitchy" feel.
const WIDTH: Record<string, number> = {
  A: 0.72, B: 0.72, C: 0.72, D: 0.78, E: 0.62, F: 0.6, G: 0.78, H: 0.78,
  I: 0.32, J: 0.5, K: 0.72, L: 0.58, M: 0.92, N: 0.78, O: 0.82, P: 0.68,
  Q: 0.82, R: 0.72, S: 0.66, T: 0.62, U: 0.76, V: 0.72, W: 0.98, X: 0.68,
  Y: 0.66, Z: 0.62, '0': 0.62, '1': 0.42, '2': 0.62, '3': 0.62, '4': 0.66,
  '5': 0.62, '6': 0.62, '7': 0.6, '8': 0.62, '9': 0.62, '&': 0.92, '/': 0.42,
  ' ': 0.34,
};
const widthOf = (ch: string) => WIDTH[ch] ?? 0.62;
const display = (ch: string) => (ch === ' ' ? ' ' : ch);

type Props = {
  target: string;
  startDelay?: number;
  step?: number;
  className?: string;
  settledClassName?: string;
  flippingClassName?: string;
  inView?: boolean;
};

const SplitFlapText: React.FC<Props> = ({
  target,
  startDelay = 200,
  step = 110,
  className = '',
  settledClassName = 'text-[#d7c4aa]',
  flippingClassName = 'text-[#d7ff4f]',
  inView = true,
}) => {
  const length = target.length;
  const [chars, setChars] = useState<string[]>(() => target.split(''));
  const [flipping, setFlipping] = useState<boolean[]>(() => Array(length).fill(false));
  const [settled, setSettled] = useState<boolean[]>(() => Array(length).fill(false));
  const [visible, setVisible] = useState<boolean>(inView);

  // Gate visibility so off-screen instances never flash a scrambled state,
  // and so the on-screen reveal reads as a clean fade-into-flip.
  useEffect(() => {
    if (inView) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
  }, [inView]);

  useEffect(() => {
    if (!inView) return;

    // Fresh start each time we enter view (also keeps Strict Mode honest).
    setChars(Array(length).fill('X'));
    setFlipping(Array(length).fill(false));
    setSettled(Array(length).fill(false));

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < length; i++) {
      const base = startDelay + i * step;
      const ch = target[i];

      if (ch === ' ') {
        timers.push(
          setTimeout(() => {
            setChars((c) => c.map((v, j) => (j === i ? ' ' : v)));
            setSettled((s) => s.map((v, j) => (j === i ? true : v)));
          }, base),
        );
        continue;
      }

      timers.push(
        setTimeout(() => {
          setFlipping((f) => f.map((v, j) => (j === i ? true : v)));
        }, base),
      );

      const steps = 6;
      for (let s = 0; s < steps; s++) {
        timers.push(
          setTimeout(() => {
            setChars((c) =>
              c.map((v, j) => {
                if (j !== i) return v;
                if (s === steps - 1) return target[i];
                return POOL[Math.floor(Math.random() * POOL.length)];
              }),
            );
          }, base + 60 + s * 55),
        );
      }

      timers.push(
        setTimeout(() => {
          setFlipping((f) => f.map((v, j) => (j === i ? false : v)));
          setSettled((s) => s.map((v, j) => (j === i ? true : v)));
        }, base + 60 + steps * 55 + 40),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [inView, target, startDelay, step, length]);

  return (
    <span
      className={className}
      style={{
        perspective: '600px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 240ms ease',
      }}
      aria-label={target}
    >
      {chars.map((c, i) => {
        const t = target[i];
        return (
          <span
            key={i}
            data-flipping={flipping[i] ? 'true' : 'false'}
            className="splitflap-tile relative inline-block align-baseline"
            style={{ width: `${widthOf(t)}em` }}
          >
            <span aria-hidden className="invisible">
              {display(t)}
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                settled[i] ? settledClassName : flippingClassName
              }`}
            >
              {display(c)}
            </span>
          </span>
        );
      })}
      <span className="sr-only">{target}</span>
    </span>
  );
};

export default SplitFlapText;
