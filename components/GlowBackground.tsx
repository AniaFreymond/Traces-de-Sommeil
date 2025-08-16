'use client';
import { useEffect, useRef } from 'react';

type Props = {
  base?: { a: string; b: string; c: string };
  avgQuality?: number | null;
  theme: 'light' | 'dark' | string;
  showOrbs?: boolean;
};

export default function GlowBackground({ theme, showOrbs=false }: Props){
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
      <div className="glow-waves">
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
          <g className="wave-group">
            <path d="M0 100 Q 30 70 60 100 T120 100 T180 100 T240 100 T300 100 T360 100 T420 100 T480 100 T540 100 T600 100 T660 100 T720 100 T780 100 T840 100 T900 100 T960 100 T1020 100 T1080 100 T1140 100 T1200 100" />
            <path d="M0 120 Q 30 90 60 120 T120 120 T180 120 T240 120 T300 120 T360 120 T420 120 T480 120 T540 120 T600 120 T660 120 T720 120 T780 120 T840 120 T900 120 T960 120 T1020 120 T1080 120 T1140 120 T1200 120" />
          </g>
        </svg>
      </div>
      {showOrbs && (
        <>
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />
        </>
      )}
      {theme === 'dark' && <div className="glow-grid" />}
    </div>
  );
}
