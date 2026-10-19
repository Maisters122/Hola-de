/**
 * LoadingScreen.tsx
 * Ultra-High-Fidelity Pure Black Loading Screen.
 *
 * All red lines around the percentage have been completely removed as requested.
 * Everything else remains pristine:
 * 1. 100% Pure Black OLED Background (#000000).
 * 2. Ultra-fluid number interpolation on the percentage display (60/120 FPS).
 * 3. Traveling wave animation across the glowing red letters "C A R G A N D O".
 * 4. Smooth fade-out transition.
 */

import React, { useEffect, useRef } from 'react';
import { CircuitId } from '../game/circuits/ICircuit';
import { TireCompoundType } from '../game/physics/TireCompound';
import { RaceDifficulty, RaceLapOption } from '../game/career/CareerTypes';

export interface LoadingScreenProps {
  circuitId: CircuitId;
  mode: 'career' | 'practice' | 'multiplayer' | 'free_camera';
  compound?: TireCompoundType;
  laps?: RaceLapOption | number;
  difficulty?: RaceDifficulty;
  progress: number; // 0 to 100
  stageText: string;
  isFadingOut?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  isFadingOut = false,
}) => {
  const numberSpanRef = useRef<HTMLSpanElement | null>(null);

  // Keep target progress in a ref so the animation loop reads it without restarting
  const targetProgressRef = useRef(progress);
  useEffect(() => {
    targetProgressRef.current = progress;
  }, [progress]);

  // Buttery-smooth number interpolation loop (60/120 FPS)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let smoothProgress = targetProgressRef.current;
    let lastReportedNumber = -1;

    const update = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const target = Math.min(100, Math.max(0, targetProgressRef.current));
      const diff = target - smoothProgress;
      if (Math.abs(diff) < 0.04) {
        smoothProgress = target;
      } else {
        smoothProgress += diff * (1 - Math.exp(-6.0 * dt));
      }

      const currentInt = Math.round(smoothProgress);
      if (currentInt !== lastReportedNumber) {
        lastReportedNumber = currentInt;
        if (numberSpanRef.current) {
          numberSpanRef.current.textContent = String(currentInt);
        }
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  const letters = ['C', 'A', 'R', 'G', 'A', 'N', 'D', 'O'];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-black transition-opacity duration-1000 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Dynamic Keyframes for smooth GPU-accelerated wave animation across CARGANDO */}
      <style>{`
        @keyframes cargandoWave {
          0%, 100% {
            opacity: 0.35;
            transform: translateY(0px);
          }
          50% {
            opacity: 1.0;
            transform: translateY(-2px);
          }
        }
      `}</style>

      {/* Central Visual Stage */}
      <div className="relative flex items-center justify-center w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] md:w-[520px] md:h-[520px]">
        {/* Central Information: Crisp High-Tech Typography (Zero Glare, Pure Contrast) */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          {/* Main Percentage: Crisp modern geometric typography */}
          <div
            className="flex items-baseline justify-center tracking-tight text-white leading-none font-bold select-none"
            style={{
              fontFamily: "'Orbitron', 'Chakra Petch', sans-serif",
              fontSize: 'clamp(3.6rem, 8.8vw, 5.4rem)',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.95)',
              letterSpacing: '-0.02em',
            }}
          >
            <span ref={numberSpanRef}>{Math.round(progress)}</span>
            <span className="font-bold ml-1 text-[0.68em] text-white/95">
              %
            </span>
          </div>

          {/* Crisp Animated CARGANDO Letters (Living wave travelling seamlessly from left to right) */}
          <div
            className="flex items-center justify-center mt-3 sm:mt-4 md:mt-5 select-none"
            style={{
              fontFamily: "'Orbitron', 'Chakra Petch', sans-serif",
              fontSize: 'clamp(0.85rem, 2.0vw, 1.2rem)',
              fontWeight: 700,
              letterSpacing: '0.45em',
              paddingLeft: '0.45em',
            }}
          >
            {letters.map((char, index) => (
              <span
                key={index}
                className="inline-block"
                style={{
                  color: '#ff2828',
                  animation: 'cargandoWave 1.6s ease-in-out infinite',
                  animationDelay: `${index * 0.12}s`,
                  willChange: 'transform, opacity',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
