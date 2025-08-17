'use client';

type Props = {
  theme: 'light' | 'dark' | string;
};

export default function GlowBackground({ theme }: Props){
  // Pastel gradient with subtle hue rotation shown only in light mode
  if(theme !== 'light') return null;
  return <div className="morning-glow" aria-hidden />;
}
