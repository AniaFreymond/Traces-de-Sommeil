'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function SleepForm({ onSaved }:{ onSaved?: ()=>void }){
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');

  const [date, setDate] = useState(`${yyyy}-${mm}-${dd}`);
  const [bed, setBed] = useState('');
  const [wake, setWake] = useState('');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('0h 00m');
  const [error, setError] = useState('');

  useEffect(()=>{
    const mins = estimateDurationMinutes(date, bed, wake);
    setDuration(isNaN(mins) ? '—' : fmtHM(mins));
  },[date, bed, wake]);

  function parseTime(str: string){
    const m = /^([0-1]\d|2[0-3]):([0-5]\d)$/.exec(str);
    return m ? { h: Number(m[1]), m: Number(m[2]) } : null;
  }
  function estimateDurationMinutes(dateStr: string, bedStr: string, wakeStr: string){
    const b = parseTime(bedStr); const w = parseTime(wakeStr);
    if(!b || !w) return NaN;
    const d = new Date(dateStr + 'T00:00:00');
    const B = new Date(d); B.setHours(b.h,b.m,0,0);
    const W = new Date(d); W.setHours(w.h,w.m,0,0);
    if(W <= B) W.setDate(W.getDate()+1);
    return Math.round((+W - +B)/60000);
  }
  const fmtHM = (m:number)=> `${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`;

  function validate(){
    if(!parseTime(bed) || !parseTime(wake)){
      setError('Use HH:MM (24h)');
      return false;
    }
    const mins = estimateDurationMinutes(date, bed, wake);
    if(!(mins>0)){
      setError('Wake time must be after bedtime');
      return false;
    }
    setError('');
    return true;
  }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    if(!validate()) return;
    const user = (await supabase.auth.getUser()).data.user;
    if(!user) return alert('Please sign in.');
    const payload = { user_id: user.id, entry_date: date, bedtime: bed, waketime: wake, duration_minutes: estimateDurationMinutes(date,bed,wake), quality, notes };
    console.log('saving entry', payload);
    const { error: err } = await supabase.from('sleep_entries').insert(payload);
    if(err) return alert(err.message);
    setBed(''); setWake(''); setQuality(3); setNotes('');
    onSaved?.();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rowflex wrap">
        <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></div>
        <div className="field"><label>Bedtime</label><input type="text" placeholder="23:15" value={bed} onChange={e=>setBed(e.target.value)} pattern="^([0-1]\d|2[0-3]):([0-5]\d)$" required/></div>
        <div className="field"><label>Wake time</label><input type="text" placeholder="07:30" value={wake} onChange={e=>setWake(e.target.value)} pattern="^([0-1]\d|2[0-3]):([0-5]\d)$" required/></div>
      </div>
      {error && <p className="error">{error}</p>}
      <label>Sleep quality: <b>{quality}</b></label>
      <input type="range" min={1} max={5} step={1} value={quality} onChange={e=>setQuality(Number(e.target.value))} />
      <label>Notes</label>
      <textarea rows={4} placeholder="Caffeine? Exercise? Woke at night? Dreams?" value={notes} onChange={e=>setNotes(e.target.value)} />
      <div className="rowflex" style={{marginTop:10}}>
        <span className="chip"><ClockIcon /> {duration}</span>
        <button className="right" type="submit">Save entry</button>
      </div>
    </form>
  );
}

function ClockIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
