'use client';

type Props = {
  theme: 'light' | 'dark' | string;
};

export default function GlowBackground({ theme }: Props){
  // Decorative dynamic background with drifting blobs and star field
  return (
    <div className="aurora" aria-hidden>
      <div className="aurora-sweep animate-hue" />
      <div className="aurora-blob iris animate-drift" />
      <div className="aurora-blob grad animate-drift-slow" />
      <div className="aurora-blob light animate-float" />
      <div className="aurora-stars" />
      <div className="aurora-noise" />
    </div>
  );
}
