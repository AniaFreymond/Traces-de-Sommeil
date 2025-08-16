'use client';
import React from 'react';

type Props = { theme: 'light' | 'dark' | string };

export default function GlowBackground({ theme }: Props){
  return (
    <div className="aurora" aria-hidden>
      <div className="aurora-sweep animate-hue" />
      <div className="blob iris ring-iris animate-drift" />
      <div className="blob gradient animate-drift-slow" />
      <div className="blob light animate-float" />
      <div className="bg-stars" style={{opacity: theme==='dark' ? 0.3 : 0.15}} />
      <div className="bg-noise" />
    </div>
  );
}
