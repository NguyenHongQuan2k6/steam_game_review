import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu } from 'lucide-react';
import { useGesture } from '../components/GestureLayout';

const SPOTLIGHT_R = 260;

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
}

const RevealLayer: React.FC<RevealLayerProps> = ({ image, cursorX, cursorY }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const revealDivRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas mask
  useEffect(() => {
    const canvas = canvasRef.current;
    const revealDiv = revealDivRef.current;
    if (!canvas || !revealDiv) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // If cursor is off-screen (initial or fallback state), don't draw anything
    if (cursorX === -999 && cursorY === -999) {
      revealDiv.style.maskImage = 'none';
      revealDiv.style.webkitMaskImage = 'none';
      return;
    }

    // Create Radial Gradient
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
    gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.40)');
    gradient.addColorStop(0.88, 'rgba(255, 255, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    // Draw Spotlight
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    // Convert Canvas to Data URL and set as mask image
    try {
      const dataUrl = canvas.toDataURL();
      const maskVal = `url(${dataUrl})`;
      revealDiv.style.maskImage = maskVal;
      revealDiv.style.webkitMaskImage = maskVal;
      revealDiv.style.maskSize = '100% 100%';
      revealDiv.style.webkitMaskSize = '100% 100%';
    } catch (err) {
      console.error("Mask rendering failed:", err);
    }
  }, [cursorX, cursorY, dimensions]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      <div
        ref={revealDivRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ backgroundImage: `url(${image})` }}
      />
    </>
  );
};

export const NyxoraHero: React.FC = () => {
  const navigate = useNavigate();
  
  // Consume Global Gesture Context
  const { x, y, isTracking, isGestureModeOn } = useGesture();

  const mouseRef = useRef({ x: -999, y: -999 });
  const smoothRef = useRef({ x: -999, y: -999 });
  const gestureRef = useRef({ x: 0, y: 0, isTracking: false, isActive: false });
  const rafRef = useRef<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synchronize context changes to ref for animation loop performance
  useEffect(() => {
    gestureRef.current = { x, y, isTracking, isActive: isGestureModeOn };
  }, [x, y, isTracking, isGestureModeOn]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      // If first move, snap the smooth pos to avoid jumpy transition from offscreen
      if (smoothRef.current.x === -999) {
        smoothRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation frame loop for easing/smoothing
    const updatePosition = () => {
      const g = gestureRef.current;
      if (g.isActive && g.isTracking) {
        // Convert normalized [-0.5, 0.5] coordinates to client pixels
        const targetX = (g.x + 0.5) * window.innerWidth;
        const targetY = (0.5 - g.y) * window.innerHeight;

        if (smoothRef.current.x === -999) {
          smoothRef.current = { x: targetX, y: targetY };
        } else {
          smoothRef.current.x += (targetX - smoothRef.current.x) * 0.12;
          smoothRef.current.y += (targetY - smoothRef.current.y) * 0.12;
        }
        setCursorPos({ x: smoothRef.current.x, y: smoothRef.current.y });
      } else if (mouseRef.current.x !== -999) {
        if (smoothRef.current.x === -999) {
          smoothRef.current = { ...mouseRef.current };
        } else {
          smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * 0.1;
          smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * 0.1;
        }
        setCursorPos({ x: smoothRef.current.x, y: smoothRef.current.y });
      }
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white tracking-[-0.02em] font-sans overflow-hidden select-none">
      {/* Navigation Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-[2px]">
        {/* Left Side: Empty placeholder to keep navbar alignment */}
        <div className="w-10 h-10"></div>

        {/* Center pill (desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-2 items-center gap-1">
          <Link to="/sentiment" className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium">Sentiment Scanner</Link>
          <Link to="/enterprise" className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium">Enterprise Hub</Link>
          <a href="/new/model-tester.html" className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium">Model Tester</a>
        </div>

        {/* Right (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Action buttons removed */}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-lg flex flex-col justify-center p-8 gap-6 animate-fade-in">
          <button onClick={() => setMobileMenuOpen(false)} className="absolute top-5 right-5 text-white/70 text-2xl font-bold">×</button>
          <Link to="/sentiment" onClick={() => setMobileMenuOpen(false)} className="text-left text-2xl font-cinzel hover:text-purple-400 transition-colors">Sentiment Scanner</Link>
          <Link to="/enterprise" onClick={() => setMobileMenuOpen(false)} className="text-left text-2xl font-cinzel hover:text-purple-400 transition-colors">Enterprise Hub</Link>
          <a href="/new/model-tester.html" className="text-left text-2xl font-cinzel hover:text-purple-400 transition-colors">Model Tester</a>
        </div>
      )}

      {/* Hero Section Container */}
      <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: '100dvh' }}>
        {/* Layer 1: Base image (surface world) */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url('${import.meta.env.BASE_URL}surface_world.png')` }}
        />

        {/* Layer 2: Reveal layer (hidden realm) */}
        <RevealLayer image={`${import.meta.env.BASE_URL}hidden_realm.png`} cursorX={cursorPos.x} cursorY={cursorPos.y} />

        {/* Layer 3: Heading */}
        <div className="absolute top-[14%] left-0 right-0 z-50 flex flex-col items-center text-center px-5 pointer-events-none select-none">
          <h1 className="text-white leading-[0.95] flex flex-col">
            <span
              className="block font-cinzel font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: '-0.03em', animationDelay: '0.25s' }}
            >
              Realms unseen
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
            >
              wait beneath the veil
            </span>
          </h1>
        </div>

        {/* Layer 4: Bottom-left paragraph */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.7s' }}
        >
          <p className="text-sm text-white/80 leading-relaxed drop-shadow-md">
            Every kingdom hides a shadow realm beneath it — a place of forgotten magic, lost bloodlines, and doors that only open for those who dare to look.
          </p>
        </div>

        {/* Layer 5: Bottom-right block */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.85s' }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed drop-shadow-md">
            Choose your class, gather your party, and trace the rift between worlds. What you find beneath the surface will decide the fate of both realms.
          </p>
          <button
            onClick={() => navigate('/sentiment')}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#7c3aed]/30 flex items-center gap-2 group pointer-events-auto"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Interactive Ambient Spotlight Reveal Helper Tip on first load */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 text-[10px] sm:text-xs text-white/30 pointer-events-none select-none tracking-widest uppercase text-center animate-pulse">
          Move your cursor to tear open the rift
        </div>
      </section>
    </div>
  );
};
