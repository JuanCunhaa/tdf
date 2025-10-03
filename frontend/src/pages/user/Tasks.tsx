import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function UserTasks(){
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  async function load(){
    const d = await api('/assignments/my', {}, token!);
    setItems(d.items||[]);
  }
  useEffect(()=>{ load(); },[token]);

  async function submit(aid: string, explanation: string, evidence_url: string){
    setLoading(true);
    try{
      await api(`/assignments/${aid}/submit`, { method:'POST', body: JSON.stringify({ explanation, evidence_url }) }, token!);
      await load();
    }finally{ setLoading(false); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Submissões</h1>
      <div className="card">
        <ul className="space-y-3">
          {items.map((it:any)=> (
            <li key={it.id} className="border-b border-slate-700 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{it.assignment.title}</div>
                  <div className="text-sm text-slate-300">{it.assignment.description}</div>
                  <div className="text-xs text-slate-400 mt-1">Status: {translateStatus(it.status)}</div>
                </div>
                {it.status === 'OPEN' && (
                  <button className="btn" onClick={()=>setOpen({...open, [it.assignment_id]: !(open[it.assignment_id])})}>Concluir</button>
                )}
              </div>
              {it.status === 'OPEN' && open[it.assignment_id] && (
                <MiniForm onSubmit={(e,u)=>submit(it.assignment_id, e, u)} loading={loading} />
              )}
            </li>
          ))}
          {!items.length && <li className="text-slate-400">Sem submissões pendentes.</li>}
        </ul>
      </div>
    </div>
  );
}

function MiniForm({ onSubmit, loading }:{ onSubmit:(explanation:string, url:string)=>void; loading:boolean; }){
  const [explanation, setExplanation] = useState('');
  const [url, setUrl] = useState('');
  return (
    <div className="mt-3 p-3 rounded border border-slate-700 bg-slate-800/50">
      <label className="block text-sm"><span className="text-slate-300">Explique</span><textarea value={explanation} onChange={e=>setExplanation(e.target.value)} required /></label>
      <label className="block text-sm mt-2"><span className="text-slate-300">Link da print (obrigatório)</span><input type="url" value={url} onChange={e=>setUrl(e.target.value)} required placeholder="https://..." /></label>
      <button disabled={loading} className="btn mt-2" onClick={()=>onSubmit(explanation, url)}>{loading? 'Enviando...' : 'Enviar'}</button>
    </div>
  );
}

function translateStatus(s:string){
  switch(s){
    case 'OPEN': return 'Aberta';
    case 'SUBMITTED': return 'Aguardando aprovação';
    case 'APPROVED': return 'Aprovada';
    case 'REJECTED': return 'Recusada';
    default: return s;
  }
}

