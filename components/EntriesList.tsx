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

type ActionStyle = 'icons' | 'text';

export default function EntriesList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[]|null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionStyle, setActionStyle] = useState<ActionStyle>(() => {
    if (typeof localStorage === 'undefined') return 'icons';
    return (localStorage.getItem('entries_action_style') as ActionStyle) || 'icons';
  });

  useEffect(() => {
    try { localStorage.setItem('entries_action_style', actionStyle); } catch {}
  }, [actionStyle]);

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
      {/* Small control to switch Icons/Text */}
      <div className="actions-style">
        <span className="muted" style={{fontSize:13}}>Actions:</span>
        <div className="segmented">
          <button
            className={`seg ${actionStyle==='icons'?'on':''}`}
            onClick={()=>setActionStyle('icons')}
            type="button"
          >Icons</button>
          <button
            className={`seg ${actionStyle==='text'?'on':''}`}
            onClick={()=>setActionStyle('text')}
            type="button"
          >Text</button>
        </div>
      </div>

      <div className="sleek-list">
        {rows.map(r=> (
          <article key={r.id} className="entry sleek">
            <div className="entry-head">
              <div className="entry-date">{fmtDate(r.entry_date)}</div>
              <div className="entry-actions">
                {actionStyle === 'icons' ? (
                  <>
                    <button className="iconbtn" onClick={()=>openEdit(r)} aria-label="Edit">
                      <EditIcon />
                    </button>
                    <button
                      className="iconbtn danger"
                      onClick={()=>onDelete(r.id)}
                      disabled={loadingId===r.id}
                      aria-label="Delete"
                    >
                      {loadingId===r.id ? <span aria-hidden>...</span> : <TrashIcon />}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="textbtn" onClick={()=>openEdit(r)}>Edit</button>
                    <button
                      className="textbtn danger"
                      onClick={()=>onDelete(r.id)}
                      disabled={loadingId===r.id}
                    >{loadingId===r.id ? 'Deleting…' : 'Delete'}</button>
                  </>
                )}
              </div>
            </div>

            <div className="entry-meta">
              <span className="muted">{r.bedtime||'—'} → {r.waketime||'—'}</span>
              <span className="chip">{r.duration_minutes ? fmtHM(r.duration_minutes) : '—'}</span>
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
          <button className="iconbtn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </header>

        <div className="rowflex wrap" style={{gap:12}}>
          <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></div>
          <div className="field"><label>Bedtime</label><input type="text" value={bed} onChange={e=>setBed(e.target.value)} placeholder="23:15" pattern="^([0-1]\d|2[0-3]):([0-5]\d)$" /></div>
          <div className="field"><label>Wake time</label><input type="text" value={wake} onChange={e=>setWake(e.target.value)} placeholder="07:30" pattern="^([0-1]\d|2[0-3]):([0-5]\d)$" /></div>
        </div>

        <label style={{marginTop:10}}>Sleep quality: <b>{quality}</b></label>
        <input type="range" min={1} max={5} step={1} value={quality} onChange={e=>setQuality(Number(e.target.value))} />

        <label>Notes</label>
        <textarea rows={4} placeholder="Caffeine? Exercise? Woke at night?" value={notes} onChange={e=>setNotes(e.target.value)} />

        <div className="rowflex between" style={{marginTop:14}}>
          <span className="chip"><ClockIcon /> {fmtHM(duration)}</span>
          <div className="rowflex" style={{gap:8}}>
            <button className="ghost" onClick={onClose}>Cancel</button>
            <button onClick={()=> onSave({ entry_date: date, bedtime: bed, waketime: wake, quality, notes })}>Save</button>
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
  function parseTime(str:string){
    const m = /^([0-1]\d|2[0-3]):([0-5]\d)$/.exec(str);
    return m ? { h:Number(m[1]), m:Number(m[2]) } : null;
  }
  function estimateDurationMinutes(dateStr?: string, bedStr?: string, wakeStr?: string){
    if(!dateStr) return 0;
    const b = bedStr?parseTime(bedStr):null; const w = wakeStr?parseTime(wakeStr):null;
    if(!b || !w) return 0;
    const d = new Date(dateStr + 'T00:00:00');
    const B = new Date(d); B.setHours(b.h,b.m,0,0);
    const W = new Date(d); W.setHours(w.h,w.m,0,0);
    if (W <= B) W.setDate(W.getDate()+1);
    return Math.max(0, Math.round((+W - +B)/60000));
  }
  function renderStars(n:number){
    return Array.from({length:5}).map((_,i)=>(
      <StarIcon key={i} filled={i < n} />
    ));
  }

function StarIcon({filled}:{filled:boolean}){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27" />
    </svg>
  );
}

function EditIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function TrashIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M15 6V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2" />
    </svg>
  );
}
function CloseIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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
