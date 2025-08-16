'use client';
import { useEffect, useRef } from 'react';

export default function GlowBackground({ theme }: { theme: 'light' | 'dark' | string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;

    const dpr = window.devicePixelRatio || 1;
    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    type Blob = { x: number; y: number; r: number; dx: number; dy: number; color: string };
    const colors = theme === 'dark'
      ? ['#8ec5fc', '#e0c3fc', '#fbc2eb']
      : ['#cfe8ff', '#ffe1e8', '#e3f7e8'];
    const blobs: Blob[] = colors.map((c, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 260 + Math.random() * 160,
      dx: (Math.random() * 0.4 + 0.1) * (i % 2 ? 1 : -1),
      dy: (Math.random() * 0.4 + 0.1) * (i % 2 ? -1 : 1),
      color: c,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      blobs.forEach(b => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        b.x += b.dx;
        b.y += b.dy;
        if (b.x < -b.r) b.x = window.innerWidth + b.r;
        if (b.x > window.innerWidth + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = window.innerHeight + b.r;
        if (b.y > window.innerHeight + b.r) b.y = -b.r;
      });
      frame = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, [theme]);

  return <canvas ref={canvasRef} className={`bgcanvas ${theme}`} aria-hidden />;
}
