'use client';
import { useEffect, useRef } from 'react';

type Props = {
  base?: { a: string; b: string; c: string };  
  avgQuality?: number | null;                   
  theme: 'light' | 'dark' | string;
};

export default function GlowBackground({ theme }: Props){
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const el = ref.current!;
    let raf = 0;
    let t = 0;

    const speed = 0.012;
    const spread = 0.8;

    const step = () => {
      t += speed;
      const hue = (t * 360) % 360; // continuous hue rotation
      el.style.setProperty('--h', String(hue));
      el.style.setProperty('--spread', String(spread));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [theme]); // restart animation styles if theme changes

  return (
    <div
      ref={ref}
      className={`glow glow-full ${theme === 'dark' ? 'glow-dark' : 'glow-light'}`}
      aria-hidden
    >
      {/* animated waveforms */}
      <svg className="waves" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <defs>
          <path id="wavePath" d="M0 100 Q 50 50 100 100 T 200 100 T 300 100 T 400 100 T 500 100 T 600 100 T 700 100 T 800 100 T 900 100 T 1000 100" />
        </defs>
        <g className="wave-group">
          <use href="#wavePath" />
          <use href="#wavePath" x="1000" />
        </g>
        <g className="wave-group slow">
          <use href="#wavePath" />
          <use href="#wavePath" x="1000" />
        </g>
      </svg>
      {theme === 'dark' && <div className="glow-grid" />}
    </div>
  );
}
