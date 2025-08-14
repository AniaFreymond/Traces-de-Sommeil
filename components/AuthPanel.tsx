'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPanel(){
  const [mode, setMode] = useState<'password'|'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  async function signUp(e: React.FormEvent){
    e.preventDefault(); setMessage('Creating account…');
    if(password !== confirm){ setMessage('Passwords do not match.'); return; }
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? 'Error: '+error.message : 'Check your email to confirm your account.');
  }
  async function signIn(e: React.FormEvent){
    e.preventDefault(); setMessage('Signing in…');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? 'Error: '+error.message : 'Signed in!');
  }
  async function forgotPassword(){
    setMessage('Sending reset email…');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/update-password' });
    setMessage(error ? 'Error: '+error.message : 'Check your email for the reset link.');
  }
  async function sendMagicLink(e: React.FormEvent){
    e.preventDefault(); setMessage('Sending magic link…');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    setMessage(error ? 'Error: '+error.message : 'Check your email for the sign-in link.');
  }

  return (
    <div>
      <div className="rowflex" style={{gap:6, margin:'8px 0 14px'}}>
        <button className={mode==='password'?'':'ghost'} onClick={()=>setMode('password')}>Email & Password</button>
        <button className={mode==='magic'?'':'ghost'} onClick={()=>setMode('magic')}>Magic Link</button>
      </div>

      {mode==='password' ? (
        <div className="rowflex wrap" style={{gap:18}}>
          <form onSubmit={signIn} style={{flex:'1 1 280px'}}>
            <h3 style={{margin:'4px 0'}}>Sign in</h3>
            <input type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} style={{marginTop:8}}/>
            <input type="password" required placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} style={{marginTop:8}}/>
            <div className="rowflex" style={{marginTop:8}}>
              <button type="submit">Sign in</button>
              <button type="button" className="ghost" onClick={forgotPassword}>Forgot?</button>
            </div>
          </form>
          <form onSubmit={signUp} style={{flex:'1 1 280px'}}>
            <h3 style={{margin:'4px 0'}}>Create account</h3>
            <input type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} style={{marginTop:8}}/>
            <input type="password" required placeholder="new password" value={password} onChange={e=>setPassword(e.target.value)} style={{marginTop:8}}/>
            <input type="password" required placeholder="confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={{marginTop:8}}/>
            <button type="submit" style={{marginTop:8}}>Sign up</button>
          </form>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="rowflex" style={{gap:12, flexWrap:'wrap', marginTop:8}}>
          <input type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} style={{flex:'1 1 260px'}}/>
          <button type="submit">Send magic link</button>
        </form>
      )}

      <p className="muted" style={{marginTop:8}}>{message}</p>
    </div>
  );
}
