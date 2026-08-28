import React from 'react';
import { motion } from 'framer-motion';
import CTAButton from '../components/CTAButton';
import TimedWordFlip from '../components/TimedWordFlip';
import WhatIDo from '../components/WhatIDo';
import { ScribbleX } from '../components/Scribbles';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#171715] pt-24 md:pt-32">
      <section className="relative px-4 sm:px-6 lg:px-12 xl:px-24 py-10 md:py-20 overflow-hidden">
        <ScribbleX className="absolute top-16 md:top-20 right-4 md:right-10 w-6 h-6 md:w-8 md:h-8 opacity-60" />
        <div className="absolute inset-y-0 right-0 w-[46%] md:w-[38%] lg:w-[34%] hidden md:block pointer-events-none">
          <div className="relative h-full w-full">
            <img
              src="/images/about-hero.webp"
              alt="Papi Raborife"
              className="absolute inset-0 h-full w-full object-cover object-top grayscale contrast-[1.05] brightness-[0.85]"
              style={{ maskImage: 'linear-gradient(to left, black 55%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 55%, transparent 100%)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171715] via-transparent to-[#171715]/40" />
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative max-w-[1600px] mx-auto">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-5 md:mb-10 text-[#8f8f88]">About Me</p>
          <div className="relative md:max-w-[62%]">
            {/* The headings with timed, synchronized, non-jitter transitions on load */}
            <h1 className="text-[11vw] md:text-[6vw] font-display leading-[0.84] text-[#f5f3ee] max-w-6xl">
              I'M A{' '}
              <TimedWordFlip
                startWord="FUUUUUUCKEN"
                targetWord="SELECTIVELY"
                delayMs={1000}
                settledClassName="text-[#d7ff4f]"
                flippingClassName="text-[#d7ff4f]"
              />{' '}
              SKILLED{' '}
              <TimedWordFlip
                startWord="DOPEASS"
                targetWord="PRODUCT"
                delayMs={1000}
                settledClassName="text-[#d7c4aa]"
                flippingClassName="text-[#d7ff4f]"
              />{' '}
              DESIGNER WITH A STRONG FOCUS ON PRODUCING HIGH QUALITY &amp; IMPACTFUL{' '}
              <span className="text-[#d7ff4f]">DIGITAL EXPERIENCES.</span>
            </h1>
            <motion.div className="mt-6 md:mt-12 inline-block" style={{ transform: 'rotate(-4deg)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <span className="hand-note text-[#d7c4aa] text-lg md:text-3xl">design that moves people</span>
            </motion.div>
          </div>
          <div className="md:hidden mt-8 -mx-4 sm:-mx-6">
            <img
              src="/images/about-hero.webp"
              alt="Papi Raborife"
              className="w-full h-[52vw] object-cover object-top grayscale contrast-[1.05] brightness-[0.85]"
            />
          </div>
        </motion.div>
      </section>

      <WhatIDo />

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24">
        <div className="max-w-[1600px] mx-auto">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-8 md:mb-16 text-[#8f8f88]">Experience</p>
          <div className="space-y-6 md:space-y-12">
            {[
              { year: 'NOW', role: 'UI/UX Designer', company: 'Bald Agency' },
              { year: '2025', role: 'AI Creative', company: 'Monkey and Donkey Creative Agency' },
              { year: '2023–25', role: 'UI/UX Designer', company: 'Tau Foods' },
              { year: '2022', role: 'Mid-Senior Art Director & Digital Designer', company: 'Ogilvy Joburg' },
              { year: '2020–21', role: 'Mid Art Director & Digital Designer', company: 'The Niche Guys' },
              { year: '2019–20', role: 'Mid Art Director & Digital Designer', company: 'M&C Saatchi Abel' },
              { year: '2016–19', role: 'Junior Art Director, Digital Designer', company: 'FCB Joburg' },
              { year: '2015', role: 'Junior Graphic Designer', company: 'Umuzi Academy' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-8 pb-6 md:pb-8 border-b border-white/10">
                <span className="text-[#d7ff4f] font-bold text-xs md:text-base w-14 md:w-20">{item.year}</span>
                <h3 className="text-base md:text-2xl font-display text-[#f5f3ee]">{item.role}</h3>
                <span className="text-[#8f8f88] text-xs md:text-base md:ml-auto">{item.company}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-14 md:py-24 bg-[#1d1d1a]">
        <div className="max-w-[1600px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="hand-note text-[#d7c4aa] text-2xl md:text-4xl mb-5 md:mb-6">ready to collaborate?</p>
            <CTAButton to="/resume">VIEW RESUME</CTAButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
