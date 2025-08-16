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

    const speed = 0.006;   
    const spread = 1.0;       

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
      {theme === 'dark' && <div className="glow-grid" />}
    </div>
  );
}
