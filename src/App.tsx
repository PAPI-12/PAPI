import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MouseProvider } from './context/MouseContext';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { useSmoothScroll } from './hooks/useSmoothScroll';

const Work = lazy(() => import('./pages/Work'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Cornetto = lazy(() => import('./pages/Cornetto'));
const TauFoods = lazy(() => import('./pages/TauFoods'));
const LouisVuitton = lazy(() => import('./pages/LouisVuitton'));
const Audi = lazy(() => import('./pages/Audi'));
const Nandos = lazy(() => import('./pages/Nandos'));
const Joshua = lazy(() => import('./pages/Joshua'));
const Vodacom = lazy(() => import('./pages/Vodacom'));
const Sars = lazy(() => import('./pages/Sars'));
const Resume = lazy(() => import('./pages/Resume'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const PageFallback = () => (
  <div className="min-h-screen bg-[#171715]" aria-hidden />
);

const AppContent: React.FC = () => {
  useSmoothScroll();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <div className="relative min-h-screen bg-[#171715] mix-grain">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-accent z-50 origin-left" style={{ scaleX }} />
      <CustomCursor />
      <Navbar />
      <main className="relative z-10">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/work/cornetto" element={<Cornetto />} />
            <Route path="/work/tau-foods" element={<TauFoods />} />
            <Route path="/work/louis-vuitton" element={<LouisVuitton />} />
            <Route path="/work/audi" element={<Audi />} />
            <Route path="/work/nandos" element={<Nandos />} />
            <Route path="/work/joshua" element={<Joshua />} />
            <Route path="/work/vodacom" element={<Vodacom />} />
            <Route path="/work/sars" element={<Sars />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer relative z-10 border-t border-white/10 py-8 text-center text-[11px] uppercase tracking-[0.3em] text-[#8f8f88] bg-[#171715]">
        <p>© {new Date().getFullYear()} Papi Raborife — Crafted with culture, clarity and motion. <Link to="/privacy" className="hover:text-[#d7ff4f]">Privacy</Link></p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <MouseProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <AppContent />
        </ErrorBoundary>
      </MouseProvider>
    </Router>
  );
};

export default App;
