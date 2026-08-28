import React from 'react';
import { motion } from 'framer-motion';

export const ScribbleX = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="4" x2="36" y2="36" stroke="#D7FF4F" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="36" y1="4" x2="4" y2="36" stroke="#D7FF4F" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const ScribbleUnderline = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 120 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10 Q40 4 70 10 Q95 15 116 8" stroke="#D7C4AA" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const ScribbleWave = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14 Q30 2 60 14 T118 10" stroke="#D7C4AA" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

export const FloatingCross = ({
  className,
  size = 28,
  duration = 6,
  delay = 0,
}: {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
}) => (
  <motion.div
    className={`pointer-events-none select-none ${className || ''}`}
    style={{ width: size, height: size }}
    animate={{ y: [0, -12, 0, 10, 0], rotate: [0, 14, 0, -12, 0], scale: [1, 1.08, 1] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <ScribbleX className="w-full h-full" />
  </motion.div>
);

export const FloatingWave = ({
  className,
  width = 120,
  duration = 7,
  delay = 0,
}: {
  className?: string;
  width?: number;
  duration?: number;
  delay?: number;
}) => (
  <motion.div
    className={`pointer-events-none select-none ${className || ''}`}
    style={{ width }}
    animate={{ x: [0, 14, 0, -10, 0], opacity: [0.45, 0.9, 0.45] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <ScribbleWave className="w-full h-auto" />
  </motion.div>
);
