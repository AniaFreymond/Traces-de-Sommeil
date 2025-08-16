'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import GlowBackground from '../components/GlowBackground';
import SleepForm from '../components/SleepForm';
import EntriesList from '../components/EntriesList';
import AuthPanel from '../components/AuthPanel';

export default function Page(){
  const [session, setSession] = useState<any>(null);
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    try {
      const attr = (document?.documentElement?.dataset?.theme as 'light'|'dark'|undefined);
      if (attr) {
        setTheme(attr);
      } else if (typeof window !== 'undefined' && window.matchMedia) {
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    } catch {}
  }, []);

  useEffect(()=>{
    supabase.auth.getSession().then(({ data })=> setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=> setSession(s));
    return ()=>{ sub.subscription.unsubscribe(); };
  },[]);

  const toggleTheme = ()=>{
    const next = theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = next;
    }
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  };

  const blockWidth = session?.user ? 680 : 600;

  return (
    <main>
      <GlowBackground theme={theme} />
      <div className="container">
        <header className="bar" style={{maxWidth:blockWidth, margin:'0 auto 24px'}}>
          <h1 style={{margin:0, fontSize:'1.8rem', flex:1}}>Dream Logs</h1>
          <div className="rowflex">
            <button className="iconbtn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{color: theme==='dark' ? '#ffd54f' : undefined}}>{theme==='dark' ? '☀' : '☾'}</button>
            {session?.user ? (
              <>
                <span className="muted" style={{marginLeft:8}}>{session.user.email}</span>
                <button className="ghost" onClick={async()=>{ await supabase.auth.signOut(); }} style={{marginLeft:8}}>Sign out</button>
              </>
            ): null}
          </div>
        </header>

        {session?.user ? (
          <>
            <section className="card" style={{maxWidth:blockWidth, margin:'0 auto'}}>
              <h2>Log your sleep</h2>
              <SleepForm onSaved={() => { setRefreshKey(k => k + 1); }} />
            </section>
            <section className="card" style={{maxWidth:blockWidth, margin:'24px auto 0'}}>
              <h2>Your entries</h2>
              <EntriesList refreshKey={refreshKey} />
            </section>
          </>
        ) : (
          <div style={{maxWidth:blockWidth, margin:'0 auto'}}>
            <AuthPanel />
          </div>
        )}

      </div>
    </main>
  );
}
