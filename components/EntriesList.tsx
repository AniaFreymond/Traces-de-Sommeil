'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Row = {
  id: string;
  entry_date: string;
  bedtime: string|null;
  waketime: string|null;
  duration_minutes: number|null;
  quality: number|null;
  notes: string|null;
};

const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
const isValidTime = (v:string)=> timeRegex.test(v);

export default function EntriesList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[]|null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function load(){
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRows([]); return; }
    const { data, error } = await supabase
      .from('sleep_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(60);
    if (error) console.error(error);
    setRows(data as Row[]);
  }
  useEffect(()=>{ load(); }, [refreshKey]);

  async function onDelete(id: string){
    if (!confirm('Delete this entry?')) return;
    setLoadingId(id);
    const { error } = await supabase.from('sleep_entries').delete().eq('id', id);
    setLoadingId(null);
    if (error) return alert(error.message);
    setRows(prev => prev ? prev.filter(r => r.id !== id) : prev);
  }

  function openEdit(row: Row){ setEditing(row); }
  function closeEdit(){ setEditing(null); }

  async function onSaveEdit(updated: Partial<Row>){
    if (!editing) return;
    const patch: Partial<Row> = {
      entry_date: updated.entry_date!,
      bedtime: updated.bedtime ?? null,
      waketime: updated.waketime ?? null,
      duration_minutes: estimateDurationMinutes(updated.entry_date!, updated.bedtime||'', updated.waketime||''),
      quality: Number(updated.quality ?? 3),
      notes: (updated.notes ?? '').trim() || null
    };
    setLoadingId(editing.id);
    const { error } = await supabase.from('sleep_entries').update(patch).eq('id', editing.id);
    setLoadingId(null);
    if (error) return alert(error.message);
    setRows(prev => prev ? prev.map(r => r.id === editing.id ? { ...r, ...patch } as Row : r) : prev);
    closeEdit();
  }

  if (!rows) return <div className="muted">Loading…</div>;
  if (rows.length === 0) return <div className="muted">No entries yet.</div>;

  return (
    <>
      <div className="sleek-list">
        {rows.map(r=> (
          <article key={r.id} className="entry sleek">
            <div className="entry-head">
              <div className="entry-date">{fmtDate(r.entry_date)}</div>
              <div className="entry-actions">
                <button className="textbtn" onClick={()=>openEdit(r)}>Edit</button>
                <button
                  className="textbtn danger"
                  onClick={()=>onDelete(r.id)}
                  disabled={loadingId===r.id}
                >{loadingId===r.id ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>

            <div className="entry-meta">
              <span className="muted">{r.bedtime||'—'} → {r.waketime||'—'}</span>
              <span className="chip">Duration {r.duration_minutes ? fmtHM(r.duration_minutes) : '—'}</span>
              <span className="stars" title={`${r.quality ?? 0} / 5`}>
                {renderStars(r.quality ?? 0)}
              </span>
            </div>

            {r.notes ? <p className="entry-notes">{escapeHtml(r.notes)}</p> : null}
          </article>
        ))}
      </div>

      {editing && (
        <EditModal
          row={editing}
          onClose={closeEdit}
          onSave={onSaveEdit}
        />
      )}
    </>
  );
}

/* ---------- Edit Modal ---------- */

function EditModal({ row, onClose, onSave }:{
  row: Row; onClose: ()=>void; onSave: (u: Partial<Row>)=>void;
}){
  const [date, setDate] = useState(row.entry_date);
  const [bed, setBed] = useState(row.bedtime || '');
  const [wake, setWake] = useState(row.waketime || '');
  const [bedError, setBedError] = useState('');
  const [wakeError, setWakeError] = useState('');
  const [quality, setQuality] = useState(row.quality ?? 3);
  const [notes, setNotes] = useState(row.notes || '');

  useEffect(()=>{
    const onEsc = (e: KeyboardEvent)=> { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return ()=> window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const duration = estimateDurationMinutes(date, bed, wake);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Edit entry" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <header className="rowflex between" style={{marginBottom:8}}>
          <h3>Edit entry</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="rowflex wrap" style={{gap:12}}>
          <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></div>
          <div className="field"><label>Bedtime</label><input type="text" placeholder="HH:MM" value={bed} onChange={e=>{ const v=e.target.value; setBed(v); setBedError(isValidTime(v)?'':'Use HH:MM'); }} inputMode="numeric" />{bedError && <p className="error">{bedError}</p>}</div>
          <div className="field"><label>Wake time</label><input type="text" placeholder="HH:MM" value={wake} onChange={e=>{ const v=e.target.value; setWake(v); setWakeError(isValidTime(v)?'':'Use HH:MM'); }} inputMode="numeric" />{wakeError && <p className="error">{wakeError}</p>}</div>
        </div>

        <label style={{marginTop:10}}>Sleep quality</label>
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
        <textarea rows={4} placeholder="Caffeine? Exercise? Woke at night?" value={notes} onChange={e=>setNotes(e.target.value)} />

        <div className="rowflex between" style={{marginTop:14}}>
          <span className="chip">Duration {duration>0 ? fmtHM(duration) : '—'}</span>
          <div className="rowflex" style={{gap:8}}>
            <button className="ghost" onClick={onClose}>Cancel</button>
            <button onClick={()=>{ const bOk=isValidTime(bed); const wOk=isValidTime(wake); setBedError(bOk?'':'Use HH:MM'); setWakeError(wOk?'':'Use HH:MM'); if(bOk && wOk) onSave({ entry_date: date, bedtime: bed, waketime: wake, quality, notes }); }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string){
  const d = new Date(iso + 'T00:00:00');
  return isNaN(+d) ? iso : d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}
function fmtHM(mins:number){ const h = Math.floor(mins/60), m = mins%60; return `${h}h ${String(m).padStart(2,'0')}m`; }
function escapeHtml(s:string){ return s.replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' } as any)[c]); }
function estimateDurationMinutes(dateStr?: string, bedStr?: string, wakeStr?: string){
  if(!dateStr || !bedStr || !wakeStr) return 0;
  if(!isValidTime(bedStr) || !isValidTime(wakeStr)) return 0;
  const [bh,bm] = bedStr.split(':').map(Number);
  const [wh,wm] = wakeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  const B = new Date(d); B.setHours(bh||0,bm||0,0,0);
  const W = new Date(d); W.setHours(wh||0,wm||0,0,0);
  if (W <= B) W.setDate(W.getDate()+1);
  return Math.max(0, Math.round((+W - +B)/60000));
}
function renderStars(n:number){
  const full = '★'.repeat(Math.max(0, Math.min(5, n)));
  const empty = '☆'.repeat(Math.max(0, 5 - Math.min(5, n)));
  return <span aria-hidden>{full}{empty}</span>;
}
