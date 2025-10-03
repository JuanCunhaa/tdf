import { useEffect, useState } from 'react';
import { API_URL, api, useAuth } from '../../store/auth';

export default function UserGoals(){
  const { token } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [selected, setSelected] = useState<any|null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
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
      if(evidenceUrl) fd.append('evidence_url', evidenceUrl);
      const res = await fetch(`${API_URL}/submissions`, { method:'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if(!res.ok) throw new Error((await res.json()).error || 'Erro');
      setMsg('Enviado! Aguarde revisão.'); setSelected(null); setEvidenceUrl(''); setAmount(''); setNote('');
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
              <li key={g.id} className={`p-2 rounded border ${selected?.id===g.id? 'border-neon-700':'border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{g.title}</div>
                    <div className="text-sm text-stone-300">{g.description}</div>
                    {g.target_amount != null && (
                      <div className="text-xs text-slate-400 mt-1">
                        {g.scope === 'CLAN' ? (
                          <>Progresso do clã: {g.progress?.clan || 0} / {g.target_amount} {g.unit || ''} {g.progress?.clanComplete ? 'ok' : ''}</>
                        ) : (
                          <>Seu progresso: {g.progress?.mine || 0} / {g.target_amount} {g.unit || ''} {g.progress?.mineComplete ? 'ok' : ''}</>
                        )}
                      </div>
                    )}
                  </div>
                  <button className="btn" onClick={()=>setSelected(g)}>Concluir meta</button>
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
              {msg && <div className="text-neon-500">{msg}</div>}
              {err && <div className="text-red-400">{err}</div>}
              <div className="text-sm">Meta: <span className="font-semibold">{selected.title}</span></div>
              {selected.target_amount && <label className="block text-sm">Quantia atingida<input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={amount} onChange={e=>setAmount(e.target.value)} type="number" /></label>}
              <label className="block text-sm">Descrição<textarea className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={note} onChange={e=>setNote(e.target.value)} /></label>
              <label className="block text-sm">Link da print (obrigatório)
                <input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" type="url" placeholder="https://..." value={evidenceUrl} onChange={e=>setEvidenceUrl(e.target.value)} required />
              </label>
              <button className="btn" onClick={submit}>Enviar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

