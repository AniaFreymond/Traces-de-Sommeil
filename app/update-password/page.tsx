'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function UpdatePassword(){
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('Enter a new password.');

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    if(password !== confirm){ setMsg('Passwords do not match.'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    setMsg(error ? 'Error: '+error.message : 'Password updated. You can return to the app.');
  }

  return (
    <main className="container">
      <section className="card" style={{maxWidth:560, margin:'40px auto'}}>
        <h2>Reset password</h2>
        <form onSubmit={onSubmit}>
          <input type="password" required placeholder="new password" value={password} onChange={e=>setPassword(e.target.value)} style={{marginTop:8}}/>
          <input type="password" required placeholder="confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={{marginTop:8}}/>
          <button type="submit" style={{marginTop:10}}>Update password</button>
        </form>
        <p className="muted" style={{marginTop:8}}>{msg}</p>
      </section>
    </main>
  );
}
