'use client';

type Props = {
  theme: 'light' | 'dark' | string;
};

export default function GlowBackground({ theme }: Props){
  if(theme === 'light'){
    // Pastel prism background for light mode with shifting hues
    return <div className="prism-bg animate-hueShift" aria-hidden />;
  }

  // Original aurora background kept for dark mode
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
