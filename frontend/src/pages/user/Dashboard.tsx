import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function UserDashboard(){
  const { token, nickname } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);

  async function loadAll(){
    api('/notifications', {}, token!).then(d=>setNotifs(d.notifications||[])).catch(()=>{});
    api('/submissions/mine', {}, token!).then(d=>setSubs(d.submissions||[])).catch(()=>{});
    api('/assignments/my', {}, token!).then(d=>setTasks(d.items||[])).catch(()=>{});
  }
  useEffect(()=>{ loadAll(); },[token]);

  async function submitTask(aid: string, explanation: string, evidence_url: string){
    setSending(true);
    try{
      await api(`/assignments/${aid}/submit`, { method:'POST', body: JSON.stringify({ explanation, evidence_url }) }, token!);
      const d = await api('/assignments/my', {}, token!);
      setTasks(d.items||[]);
      setOpen((o)=>({ ...o, [aid]: false }));
    } finally { setSending(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Bem-vindo, {nickname}</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl mb-2">Notificações</h2>
          <ul className="text-sm space-y-2 max-h-64 overflow-auto">
            {notifs.map((n)=> <li key={n.id}><span className="text-neon-600">{n.title}:</span> {n.message} <span className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</span></li>)}
            {!notifs.length && <li className="text-stone-400">Sem notificações ainda.</li>}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-xl mb-2">Suas submissões (Metas)</h2>
          <ul className="text-sm space-y-2 max-h-64 overflow-auto">
            {subs.map((s)=> <li key={s.id}>[{s.status}] {s.goal?.title} <span className="text-xs text-stone-500">{new Date(s.created_at).toLocaleString()}</span></li>)}
            {!subs.length && <li className="text-stone-400">Sem submissões de metas ainda.</li>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl mb-2">Submissões atribuídas a você</h2>
        <ul className="space-y-3">
          {tasks.map((it:any)=> (
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
                <MiniForm loading={sending} onSubmit={(exp,url)=>submitTask(it.assignment_id, exp, url)} />
              )}
            </li>
          ))}
          {!tasks.length && <li className="text-slate-400">Sem submissões atribuídas.</li>}
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

