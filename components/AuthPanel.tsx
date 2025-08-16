'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export default function AuthPanel(){
  const [mode, setMode] = useState<'password'|'magic'>('password');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [message, setMessage] = useState('');

  function switchMode(next: 'password' | 'magic'){
    setMode(next);
    setMessage('');
  }

  async function signUp(e: React.FormEvent){
    e.preventDefault(); setMessage('Creating account…');
    if(signUpPassword !== signUpConfirm){ setMessage('Passwords do not match.'); return; }
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { emailRedirectTo: SITE_URL || undefined }
    });
    setMessage(error ? 'Error: '+error.message : 'Check your email to confirm your account.');
  }

  async function signIn(e: React.FormEvent){
    e.preventDefault(); setMessage('Signing in…');
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword
    });
    setMessage(error ? 'Error: '+error.message : 'Signed in!');
  }

  async function forgotPassword(){
    setMessage('Sending reset email…');
    const { error } = await supabase.auth.resetPasswordForEmail(signInEmail, {
      redirectTo: SITE_URL ? `${SITE_URL}/update-password` : undefined
    });
    setMessage(error ? 'Error: '+error.message : 'Check your email for the reset link.');
  }

  async function sendMagicLink(e: React.FormEvent){
    e.preventDefault(); setMessage('Sending magic link…');
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: SITE_URL || undefined }
    });
    setMessage(error ? 'Error: '+error.message : 'Check your email for the sign-in link.');
  }

  return (
    <div>
      <section className="card" style={{maxWidth:500, margin:'0 auto'}}>
        <h3 style={{margin:'4px 0'}}>Sign in</h3>
        {mode==='password' ? (
          <form onSubmit={signIn} style={{marginTop:8}}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={signInEmail}
              onChange={e=>setSignInEmail(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="password"
              value={signInPassword}
              onChange={e=>setSignInPassword(e.target.value)}
              style={{marginTop:8}}
            />
            <div className="rowflex" style={{marginTop:8}}>
              <button type="submit">Sign in</button>
              <button type="button" className="ghost" onClick={forgotPassword}>Forgot?</button>
            </div>
          </form>
        ) : (
          <form onSubmit={sendMagicLink} className="rowflex" style={{gap:12, flexWrap:'wrap', marginTop:8}}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={magicEmail}
              onChange={e=>setMagicEmail(e.target.value)}
              style={{flex:'1 1 260px'}}
            />
            <button type="submit">Send magic link</button>
          </form>
        )}
        <div className="rowflex" style={{gap:6, marginTop:14}}>
          <button className={mode==='password'?'':'ghost'} onClick={()=>switchMode('password')}>Email & Password</button>
          <button className={mode==='magic'?'':'ghost'} onClick={()=>switchMode('magic')}>Magic Link</button>
        </div>
      </section>

      <section className="card" style={{maxWidth:500, margin:'24px auto 0'}}>
        <form onSubmit={signUp}>
          <h3 style={{margin:'4px 0'}}>Create account</h3>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={signUpEmail}
            onChange={e=>setSignUpEmail(e.target.value)}
            style={{marginTop:8}}
          />
          <input
            type="password"
            required
            placeholder="new password"
            value={signUpPassword}
            onChange={e=>setSignUpPassword(e.target.value)}
            style={{marginTop:8}}
          />
          <input
            type="password"
            required
            placeholder="confirm password"
            value={signUpConfirm}
            onChange={e=>setSignUpConfirm(e.target.value)}
            style={{marginTop:8}}
          />
          <button type="submit" style={{marginTop:8}}>Sign up</button>
        </form>
      </section>

      <p className="muted" style={{textAlign:'center', marginTop:8}}>{message}</p>
    </div>
  );
}
