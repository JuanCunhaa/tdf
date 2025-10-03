import { useEffect, useState } from 'react';
import { API_URL, api, useAuth } from '../../store/auth';

export default function UserGoals(){
  const { token } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [selected, setSelected] = useState<any|null>(null);
  const [files, setFiles] = useState<FileList| null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(()=>{ api('/goals?status=ACTIVE', {}, token!).then(d=>setGoals(d.goals||[])); },[token]);

  async function submit(){
    if(!selected) return;
    setErr(null); setMsg(null);
    try{
      const fd = new FormData();
      fd.append('goal_id', selected.id);
      if(amount) fd.append('amount', amount);
      if(note) fd.append('note', note);
      if(files) Array.from(files).forEach(f=> fd.append('files', f));
      const res = await fetch(`${API_URL}/submissions`, { method:'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if(!res.ok) throw new Error((await res.json()).error || 'Erro');
      setMsg('Enviado! Aguarde revisão.'); setSelected(null); setFiles(null); setAmount(''); setNote('');
    }catch(e:any){ setErr(e.message); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Metas</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl mb-2">Ativas</h2>
          <ul className="space-y-2">
            {goals.map((g:any)=> (
              <li key={g.id} className={`p-2 rounded border ${selected?.id===g.id? 'border-emerald-700':'border-stone-700'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{g.title}</div>
                    <div className="text-sm text-stone-300">{g.description}</div>
                  </div>
                  <button className="btn" onClick={()=>setSelected(g)}>Enviar comprovação</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-xl mb-2">Enviar comprovação</h2>
          {!selected && <div className="text-stone-400">Selecione uma meta na lista.</div>}
          {selected && (
            <div className="space-y-3">
              {msg && <div className="text-emerald-400">{msg}</div>}
              {err && <div className="text-red-400">{err}</div>}
              <div className="text-sm">Meta: <span className="font-semibold">{selected.title}</span></div>
              {selected.target_amount && <label className="block text-sm">Quantia atingida<input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={amount} onChange={e=>setAmount(e.target.value)} type="number" /></label>}
              <label className="block text-sm">Descrição<textarea className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={note} onChange={e=>setNote(e.target.value)} /></label>
              <div>
                <label className="block text-sm mb-1">Evidências (imagens)</label>
                <input type="file" multiple accept="image/*" onChange={(e)=>setFiles(e.target.files)} />
              </div>
              <button className="btn" onClick={submit}>Enviar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

