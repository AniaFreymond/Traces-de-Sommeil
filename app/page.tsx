'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GlowBackground from '@/components/GlowBackground';
import SleepForm from '@/components/SleepForm';
import EntriesList from '@/components/EntriesList';
import AuthPanel from '@/components/AuthPanel';
import '@/styles/globals.css';

export default function Page(){
  const [session, setSession] = useState<any>(null);
  const [avgQuality, setAvgQuality] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>(()=> document.documentElement.dataset.theme || 'light');

  useEffect(()=>{
    supabase.auth.getSession().then(({ data })=> setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=> setSession(s));
    return ()=>{ sub.subscription.unsubscribe(); };
  },[]);

  async function refreshAvg(){
    const user = (await supabase.auth.getUser()).data.user;
    if(!user){ setAvgQuality(null); return; }
    const { data } = await supabase.from('sleep_entries')
      .select('quality')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(14);
    if(!data || data.length===0){ setAvgQuality(null); return; }
    const avg = data.reduce((a,b)=>a+(b.quality||0),0)/data.length;
    setAvgQuality(avg);
  }
  useEffect(()=>{ refreshAvg(); }, [session]);

  const palette = useMemo(()=>({ a:'#cce7ff', b:'#ffd6e8', c:'#d9ffe5' }),[]);
  const toggleTheme = ()=>{
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <main>
      <GlowBackground base={palette} avgQuality={avgQuality} theme={theme} />
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
              <h2>Log your sleep</h2>
              <SleepForm onSaved={refreshAvg} />
            </section>
            <section className="card">
              <h2>Your entries</h2>
              <EntriesList />
            </section>
          </div>
        ) : (
          <section className="card">
            <h2>Welcome 👋</h2>
            <p className="muted">Sign in with <b>email & password</b> or use a <b>magic link</b>. No servers required.</p>
            <AuthPanel />
          </section>
        )}

        <p className="footer">Vercel-ready • Supabase sync • Dynamic glow ✨</p>
      </div>
    </main>
  );
}
