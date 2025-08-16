import '../styles/globals.css';
export const metadata = { title: 'Sleep Journal', description: 'Dreamy futuristic sleep journal with Supabase sync' };

const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `(()=>{try{const k='theme';const s=localStorage.getItem(k);const m=s|| (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');document.documentElement.dataset.theme=m;}catch{}})();`
    }}
  />
);

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        {children}
      </body>
    </html>
  );
}
