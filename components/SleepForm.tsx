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
  const [bedError, setBedError] = useState<string|null>(null);
  const [wakeError, setWakeError] = useState<string|null>(null);

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const isValidTime = (s:string)=> timePattern.test(s);

  useEffect(()=>{
    const mins = estimateDurationMinutes(date, bed, wake);
    setDuration(fmtHM(mins));
  },[date, bed, wake]);

  function estimateDurationMinutes(dateStr?: string, bedStr?: string, wakeStr?: string){
    if(!dateStr || !isValidTime(bedStr||'') || !isValidTime(wakeStr||'')) return 0;
    const [by, bm] = (bedStr as string).split(':').map(Number);
    const [wy, wm] = (wakeStr as string).split(':').map(Number);
    const d = new Date(dateStr + 'T00:00:00');
    const B = new Date(d); B.setHours(by,bm,0,0);
    const W = new Date(d); W.setHours(wy,wm,0,0);
    if(W <= B) W.setDate(W.getDate()+1);
    return Math.max(0, Math.round((+W - +B)/60000));
  }
  const fmtHM = (m:number)=> `${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`;

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    if(!isValidTime(bed) || !isValidTime(wake)){
      setBedError(!isValidTime(bed) ? 'Enter time as HH:MM' : null);
      setWakeError(!isValidTime(wake) ? 'Enter time as HH:MM' : null);
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if(!user) return alert('Please sign in.');
    const payload = { user_id: user.id, entry_date: date, bedtime: bed, waketime: wake, duration_minutes: estimateDurationMinutes(date,bed,wake), quality, notes };
    const { error } = await supabase.from('sleep_entries').insert(payload);
    if(error) return alert(error.message);
    setBed(''); setWake(''); setQuality(3); setNotes(''); setBedError(null); setWakeError(null);
    onSaved?.();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rowflex wrap">
        <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></div>
        <div className="field"><label>Bedtime</label><input placeholder="HH:MM" type="text" value={bed} onChange={e=>{setBed(e.target.value); setBedError(e.target.value && !isValidTime(e.target.value) ? 'Enter time as HH:MM' : null);}} required/>{bedError && <div className="error">{bedError}</div>}</div>
        <div className="field"><label>Wake time</label><input placeholder="HH:MM" type="text" value={wake} onChange={e=>{setWake(e.target.value); setWakeError(e.target.value && !isValidTime(e.target.value) ? 'Enter time as HH:MM' : null);}} required/>{wakeError && <div className="error">{wakeError}</div>}</div>
      </div>
      <label>Sleep quality: <b>{quality}</b></label>
      <input type="range" min={1} max={5} step={1} value={quality} onChange={e=>setQuality(Number(e.target.value))} />
      <label>Notes</label>
      <textarea rows={4} placeholder="Caffeine? Exercise? Woke at night? Dreams?" value={notes} onChange={e=>setNotes(e.target.value)} />
      <div className="rowflex" style={{marginTop:10}}>
        <span className="chip">Duration: {duration}</span>
        <button className="right" type="submit">Save entry</button>
      </div>
    </form>
  );
}
