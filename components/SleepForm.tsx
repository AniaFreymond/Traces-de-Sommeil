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
  const [bedError, setBedError] = useState('');
  const [wakeError, setWakeError] = useState('');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('0h 00m');

  useEffect(()=>{
    const mins = estimateDurationMinutes(date, bed, wake);
    setDuration(mins>0 ? fmtHM(mins) : '—');
  },[date, bed, wake]);

  const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
  const isValidTime = (v:string)=> timeRegex.test(v);

  function estimateDurationMinutes(dateStr?: string, bedStr?: string, wakeStr?: string){
    if(!dateStr || !bedStr || !wakeStr) return 0;
    if(!isValidTime(bedStr) || !isValidTime(wakeStr)) return 0;
    const [by, bm] = bedStr.split(':').map(Number);
    const [wy, wm] = wakeStr.split(':').map(Number);
    const d = new Date(dateStr + 'T00:00:00');
    const B = new Date(d); B.setHours(by,bm,0,0);
    const W = new Date(d); W.setHours(wy,wm,0,0);
    if(W <= B) W.setDate(W.getDate()+1);
    return Math.max(0, Math.round((+W - +B)/60000));
  }
  const fmtHM = (m:number)=> `${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`;

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    const bedOk = isValidTime(bed); setBedError(bedOk ? '' : 'Use HH:MM');
    const wakeOk = isValidTime(wake); setWakeError(wakeOk ? '' : 'Use HH:MM');
    if(!bedOk || !wakeOk) return;
    const user = (await supabase.auth.getUser()).data.user;
    if(!user) return alert('Please sign in.');
    const payload = { user_id: user.id, entry_date: date, bedtime: bed, waketime: wake, duration_minutes: estimateDurationMinutes(date,bed,wake), quality, notes };
    const { error } = await supabase.from('sleep_entries').insert(payload);
    if(error) return alert(error.message);
    setBed(''); setWake(''); setQuality(3); setNotes('');
    onSaved?.();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rowflex wrap">
        <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></div>
        <div className="field"><label>Bedtime</label><input type="text" placeholder="HH:MM" value={bed} onChange={e=>{ const v=e.target.value; setBed(v); setBedError(isValidTime(v)?'':'Use HH:MM'); }} inputMode="numeric" required/>{bedError && <p className="error">{bedError}</p>}</div>
        <div className="field"><label>Wake time</label><input type="text" placeholder="HH:MM" value={wake} onChange={e=>{ const v=e.target.value; setWake(v); setWakeError(isValidTime(v)?'':'Use HH:MM'); }} inputMode="numeric" required/>{wakeError && <p className="error">{wakeError}</p>}</div>
      </div>
      <label>Sleep quality</label>
      <div className="rating" aria-label="Sleep quality">
        {[1,2,3,4,5].map(i=> (
          <button
            type="button"
            key={i}
            className={i<=quality? 'star active':'star'}
            onClick={()=>setQuality(i)}
            aria-label={`${i} star${i>1?'s':''}`}
          >
            ★
          </button>
        ))}
      </div>
      <label>Notes</label>
      <textarea rows={4} placeholder="Caffeine? Exercise? Woke at night? Dreams?" value={notes} onChange={e=>setNotes(e.target.value)} />
      <div className="rowflex" style={{marginTop:10}}>
        <span className="chip">Duration {duration}</span>
        <button className="right" type="submit">Save entry</button>
      </div>
    </form>
  );
}
