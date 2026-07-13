import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useHandTracking } from './useHandTracking';

interface GestureContextType {
  x: number;
  y: number;
  isTracking: boolean;
  isGestureModeOn: boolean;
  setIsGestureModeOn: (active: boolean) => void;
}

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const useGesture = () => {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error('useGesture must be used within a GestureProvider');
  }
  return context;
};

interface GestureLayoutProps {
  children: React.ReactNode;
}

export const GestureLayout: React.FC<GestureLayoutProps> = ({ children }) => {
  const [isGestureModeOn, setIsGestureModeOn] = useState(false);
  const { x, y, isTracking, videoRef, canvasRef } = useHandTracking(isGestureModeOn);

  // States for virtual cursor positioning and countdown progress
  const [progress, setProgress] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  
  const lastPosRef = useRef({ x: 0, y: 0 });
  const stillStartRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Monitor coordinates and calculate dwell countdown
  useEffect(() => {
    if (!isTracking) {
      setProgress(0);
      stillStartRef.current = null;
      return;
    }

    // Convert normalized coordinates [-0.5, 0.5] to client pixel coordinates
    const clientX = (x + 0.5) * window.innerWidth;
    const clientY = (0.5 - y) * window.innerHeight;

    setCursorPos({ x: clientX, y: clientY });

    // Check movement threshold (pixel distance from last position)
    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const now = performance.now();

    // If moved significantly (more than 22 pixels), reset the timer
    if (dist > 22) {
      stillStartRef.current = now;
      lastPosRef.current = { x: clientX, y: clientY };
      setProgress(0);
    } else {
      // Fingertip is remaining still
      if (stillStartRef.current === null) {
        stillStartRef.current = now;
      }
      
      const elapsed = now - stillStartRef.current;
      const newProgress = Math.min(elapsed / 5000, 1);
      setProgress(newProgress);

      // Trigger dwell click when countdown hits 5 seconds (5000ms) with 1.5s spam protection
      if (elapsed >= 5000 && now - lastClickTimeRef.current > 1500) {
        const el = document.elementFromPoint(clientX, clientY);
        if (el) {
          const htmlEl = el as HTMLElement;
          htmlEl.click();
          
          // Focus input fields for quick typing
          if (htmlEl.tagName === 'INPUT' || htmlEl.tagName === 'TEXTAREA') {
            htmlEl.focus();
          }
        }
        lastClickTimeRef.current = now;
        stillStartRef.current = now; // reset timer for next dwell
        setProgress(0);
      }
    }
  }, [x, y, isTracking]);

  return (
    <GestureContext.Provider value={{ x, y, isTracking, isGestureModeOn, setIsGestureModeOn }}>
      <div className="relative min-h-screen">
        {/* Main Content */}
        {children}

        {/* Floating Virtual Gesture Cursor */}
        {isGestureModeOn && isTracking && (
          <div
            className="fixed pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`
            }}
          >
            {/* Core Target Dot */}
            <div className="w-3 h-3 bg-purple-500 rounded-full border border-white shadow-[0_0_10px_2px_rgba(168,85,247,0.8)]" />
            
            {/* Cybernetic HUD outer rotating ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-dashed border-purple-400/40 animate-[spin_10s_linear_infinite]" />
            
            {/* Dwell loading radial ring */}
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 overflow-visible">
              {/* Background track */}
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Animated countdown progress path */}
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#c084fc"
                strokeWidth="2"
                fill="none"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - progress)}
                className="transition-all duration-100 ease-out origin-center -rotate-90"
                style={{
                  transformOrigin: '24px 24px',
                }}
              />
            </svg>

            {/* Floating digital countdown bubble */}
            {progress > 0.05 && (
              <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-black/80 border border-purple-500/30 px-1.5 py-0.5 rounded text-[8px] font-mono text-purple-400 shadow-md whitespace-nowrap">
                DWELL: {Math.ceil(5 - progress * 5)}s
              </span>
            )}
          </div>
        )}

        {/* Global Gesture Control HUD Panel */}
        <div className="fixed bottom-6 left-6 z-[999] flex flex-col gap-3 pointer-events-auto select-none">
          {isGestureModeOn && (
            <div className="w-[180px] bg-zinc-950/90 border border-purple-500/30 rounded-lg p-3 backdrop-blur-md shadow-2xl font-mono text-[10px] text-zinc-400 relative overflow-hidden before:absolute before:inset-0 before:bg-purple-500/[0.02] before:pointer-events-none animate-fade-in">
              <div className="flex justify-between items-center mb-2 border-b border-purple-500/20 pb-1">
                <span className="text-purple-400 font-bold uppercase tracking-wider">GESTURE INPUT</span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              
              {/* Webcam video frame */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
                width="160"
                height="120"
              />
              
              {/* NASA HUD visual tracking preview */}
              <div className="relative aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded overflow-hidden mb-2">
                <canvas
                  ref={canvasRef}
                  width="156"
                  height="117"
                  className="w-full h-full block object-cover"
                />
                {!isTracking && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-center px-2">
                    <span className="text-[9px] text-zinc-500 uppercase">Camera Scanning</span>
                    <span className="text-[8px] text-purple-400/70 mt-1 uppercase animate-pulse">Raise Hand</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-zinc-500">
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className={isTracking ? "text-emerald-400 font-bold animate-pulse" : "text-zinc-500"}>
                    {isTracking ? "TRACKING" : "STANDBY"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>COORD X:</span>
                  <span className="text-zinc-300 font-semibold">{isTracking ? x.toFixed(2) : "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>COORD Y:</span>
                  <span className="text-zinc-300 font-semibold">{isTracking ? y.toFixed(2) : "0.00"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsGestureModeOn(!isGestureModeOn)}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full border text-xs font-mono tracking-widest uppercase transition-all shadow-lg cursor-pointer ${
              isGestureModeOn
                ? "bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                : "bg-zinc-900/90 border-zinc-850 text-zinc-400 hover:border-purple-500/40 hover:text-purple-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isGestureModeOn ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
            {isGestureModeOn ? "GESTURE: ACTIVE" : "GESTURE: DISABLED"}
          </button>
        </div>
      </div>
    </GestureContext.Provider>
  );
};
