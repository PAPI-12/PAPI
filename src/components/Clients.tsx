import React from 'react';
import { motion } from 'framer-motion';
import { ScribbleX, ScribbleUnderline, ScribbleWave } from './Scribbles';

const brands = [
  { name: "NANDO'S", color: 'text-[#f5f3ee]', scale: 1.00 },
  { name: 'AUDI', color: 'text-[#d7c4aa]', scale: 0.88 },
  { name: 'LOUIS VUITTON', color: 'text-[#d7ff4f]', scale: 0.92 },
  { name: 'CORNETTO', color: 'text-[#f5f3ee]', scale: 1.00 },
  { name: 'SARS', color: 'text-[#d7c4aa]', scale: 1.12 },
  { name: 'DEBONAIRS', color: 'text-[#d7ff4f]', scale: 0.90 },
  { name: 'TAU FOODS', color: 'text-[#f5f3ee]', scale: 0.98 },
  { name: 'VODACOM', color: 'text-[#d7ff4f]', scale: 0.94 },
];

// Estimated average advance width for the display typeface. This keeps the
// type large without ever exceeding the section's own margins.
const estimatedWidth = (name: string) =>
  [...name].reduce((total, char) => {
    if (char === ' ') return total + 0.34;
    if ("ILJ'".includes(char)) return total + 0.28;
    if ('MW'.includes(char)) return total + 0.88;
    return total + 0.62;
  }, 0);

const clampFont = (name: string, baseScale: number, mobileBase: number, desktopBase: number) => {
  const width = estimatedWidth(name);
  return {
    '--brand-mobile-max': `${Math.min(mobileBase * baseScale, 100 / width).toFixed(3)}vw`,
    '--brand-desktop-max': `${Math.min(desktopBase * baseScale, 100 / width).toFixed(3)}vw`,
  } as React.CSSProperties;
};

const Clients: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-[#171715] overflow-x-clip py-20 md:py-28 lg:py-32">
      {/* Reference-style murky background field */}
      <div className="absolute inset-0 bg-[#171715]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,243,238,0.06),transparent_48%),linear-gradient(90deg,rgba(23,23,21,0.98),transparent_14%,transparent_86%,rgba(23,23,21,0.98))]" />

      <div className="relative z-10 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto">
        <p className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-[#8f8f88] mb-14 md:mb-24 lg:mb-28">
          Clients & Partners
        </p>
      </div>

      {/* Ambient scribbles */}
      <ScribbleX className="absolute top-[18%] left-[10%] w-8 h-8 md:w-10 md:h-10 opacity-65 rotate-12 hidden sm:block" />
      <ScribbleX className="absolute top-[42%] right-[7%] w-7 h-7 opacity-55 -rotate-6 hidden md:block" />
      <ScribbleX className="absolute bottom-[8%] right-[12%] w-7 h-7 opacity-55 rotate-12 hidden lg:block" />
      <ScribbleUnderline className="absolute top-[48%] left-[15%] w-44 h-5 opacity-45 hidden md:block" />
      <ScribbleUnderline className="absolute bottom-[18%] right-[18%] w-48 h-5 opacity-45 hidden lg:block" />
      <ScribbleWave className="absolute bottom-[6%] left-[6%] w-20 h-6 opacity-55 hidden md:block" />

      {/* Stack is strictly contained inside project margins; desktop keeps the
          editorial offset rhythm while mobile remains centered and safe. */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto flex flex-col items-stretch justify-center select-none overflow-visible">
        {brands.map((brand, i) => (
          <motion.div
            key={brand.name}
            initial={{ opacity: 0, x: i % 2 === 0 ? '-4rem' : '4rem' }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ duration: 1.15, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-full text-center leading-none`}
          >
            <h3
              className={`brand-name font-display ${brand.color} block max-w-full leading-[0.82] tracking-tight whitespace-nowrap`}
              style={clampFont(brand.name, brand.scale, 15, 10.4)}
            >
              {brand.name}
            </h3>
          </motion.div>
        ))}

        {/* Handwritten signature has its own contextual wrapper instead of a
            fragile page-percentage position, so resizing cannot collide it with
            the neighbouring names. */}
        <div className="relative mt-3 md:mt-1 lg:-mt-5 mb-3 md:mb-1 lg:mb-0 flex justify-center py-2 md:py-4">
          <motion.span
            className="hand-note relative block max-w-full text-center text-[#f5f3ee] text-[clamp(1.4rem,5.2vw,4.4rem)] rotate-[-5deg] whitespace-nowrap pointer-events-none z-30"
            style={{ textShadow: '0 10px 30px rgba(0,0,0,.65)' }}
            initial={{ opacity: 0, scale: 0.86 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            animate={{
              rotate: [-5, -2, -5],
              y: [0, -5, 0],
            }}
          >
            Papi Raborife Studio
          </motion.span>
        </div>
      </div>

      <motion.span
        className="absolute top-[23%] left-1/2 -translate-x-1/2 z-20 text-[#d7ff4f] text-base md:text-2xl rotate-[-5deg] whitespace-nowrap pointer-events-none"
        animate={{ rotate: [-5, -3, -5], y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        culture led creative
      </motion.span>
      <span className="absolute bottom-[11%] left-1/2 -translate-x-1/2 z-20 hand-note text-[#d7ff4f] text-base md:text-2xl rotate-[-6deg] whitespace-nowrap pointer-events-none hidden sm:block">
        we build ideas into cultural signals
      </span>

      <div className="relative z-10 mt-14 md:mt-20 px-4 sm:px-6 lg:px-12 xl:px-24 max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10 pt-7 md:pt-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8f8f88]">
          {brands.length} Brands · Culture-Led Partnerships · JHB · SA
        </span>
        <span className="hand-note text-[#d7c4aa] text-lg md:text-xl rotate-[-3deg]">and the work keeps growing</span>
      </div>
    </section>
  );
};

export default Clients;
