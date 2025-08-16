'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import PastelBackground from '../components/PastelBackground';
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

  return (
    <main>
      <PastelBackground />
      <div className="container">
        <header className="bar">
          <div className="brand">
            <span className="dot" />
            <span>Sleep Journal</span>
            <span className="muted">• pastel & calming</span>
          </div>
          <div className="rowflex">
            <button className="ghost" onClick={toggleTheme}>Toggle Theme</button>
            {session?.user ? (
              <>
                <span className="muted" style={{marginLeft:8}}>{session.user.email}</span>
                <button className="ghost" onClick={async()=>{ await supabase.auth.signOut(); }} style={{marginLeft:8}}>Sign out</button>
              </>
            ): null}
          </div>
        </header>

        {session?.user ? (
          <div className="grid">
            <section className="card">
              <h2>Record your rest</h2>
              <SleepForm onSaved={() => setRefreshKey(k => k + 1)} />
            </section>
            <section className="card">
              <h2>Your history</h2>
              <EntriesList refreshKey={refreshKey} />
            </section>
          </div>
          ) : (
          <section className="card">
            <h2>Welcome</h2>
            <p className="muted">Sign in with <b>email & password</b> or use a <b>magic link</b>. No servers required.</p>
            <AuthPanel />
          </section>
        )}
      </div>
    </main>
  );
}
