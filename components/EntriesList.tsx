'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Row = { id: string; entry_date: string; bedtime: string|null; waketime: string|null; duration_minutes: number|null; quality: number|null; notes: string|null };

export default function EntriesList(){
  const [rows, setRows] = useState<Row[]|null>(null);

  async function load(){
    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .limit(60);
    if(error){ console.error(error); }
    setRows(data as any);
  }
  useEffect(()=>{ load(); },[]);

  if(!rows) return <div className="muted">Loading…</div>;
  if(rows.length===0) return <div className="muted">No entries yet.</div>;

  return (
    <div className="list">
      {rows.map(r=> (
        <div key={r.id} className="entry">
          <div className="rowflex between wrap">
            <div className="strong">{r.entry_date}</div>
            <div className="muted">{r.bedtime||''} → {r.waketime||''}</div>
            <div className="chip">{r.duration_minutes ? fmtHM(r.duration_minutes): '—'}</div>
            <div className="muted">{'⭐'.repeat(r.quality||0)}</div>
          </div>
          {r.notes ? <div style={{marginTop:6}}>{escapeHtml(r.notes)}</div> : null}
        </div>
      ))}
    </div>
  );
}

function fmtHM(mins:number){ const h = Math.floor(mins/60), m = mins%60; return `${h}h ${String(m).padStart(2,'0')}m`; }
function escapeHtml(s:string){ return s.replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' } as any)[c]); }
