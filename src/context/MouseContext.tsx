import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMotionValue, MotionValue } from 'framer-motion';

interface MouseContextType {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  cursorSize: 'normal' | 'large';
  setCursorSize: (size: 'normal' | 'large') => void;
}

const dummyMotionValue = { get: () => 0, set: () => {}, onChange: () => () => {} } as unknown as MotionValue<number>;

const MouseContext = createContext<MouseContextType>({
  mouseX: dummyMotionValue,
  mouseY: dummyMotionValue,
  cursorSize: 'normal',
  setCursorSize: () => {},
});

export const MouseProvider = ({ children }: { children: ReactNode }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [cursorSize, setCursorSize] = useState<'normal' | 'large'>('normal');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <MouseContext.Provider value={{ mouseX, mouseY, cursorSize, setCursorSize }}>
      {children}
    </MouseContext.Provider>
  );
};

export const useMouse = () => useContext(MouseContext);

