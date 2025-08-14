'use client';
import { useEffect, useRef } from 'react';

type Props = {
  base: { a: string; b: string; c: string };
  avgQuality: number | null; // 1..5
  theme: 'light' | 'dark' | string;
};

// A therapeutic, dynamic glow that:
//  • softly animates with rAF (hue drift)
//  • adapts intensity to avg sleep quality (lower quality => calmer, slower)
//  • respects theme (switches blend modes)
export default function GlowBackground({ base, avgQuality, theme }: Props){
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const el = ref.current!;
    let raf = 0; let t = 0;

    // Speed and spread scale with average quality (defaults calm if null)
    const q = Math.min(5, Math.max(1, avgQuality ?? 2.8));
    const speed = 0.0008 + (q-1)*0.00025; // faster if quality higher
    const spread = 0.5 + (q-1)*0.07;      // larger subtle movement

    function step(){
      t += speed;
      const hue = (t*300) % 300; // slow hue drift
      el.style.setProperty('--h', String(hue));
      el.style.setProperty('--spread', String(spread));
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return ()=> cancelAnimationFrame(raf);
  }, [avgQuality]);

  return (
    <div ref={ref} className={`glow ${theme==='dark'?'glow-dark':'glow-light'}`} aria-hidden />
  );
}
