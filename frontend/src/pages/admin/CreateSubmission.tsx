import { useEffect, useState, useRef } from 'react';
import { API_URL, api, useAuth } from '../../store/auth';

type User = { id: string; nickname: string };
type Goal = { id: string; title: string; target_amount?: number | null };

export default function AdminCreateSubmission(){
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<any>({ user_id:'', goal_id:'', amount:'', note:'', status:'PENDING' });
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement|null>(null);

  useEffect(()=>{
    (async ()=>{
      try {
        const u = await api('/users', {}, token!);
        setUsers((u.users||[]).map((x:any)=>({ id:x.id, nickname:x.nickname })));
      } catch {}
      try {
        const g = await api('/goals?status=ACTIVE', {}, token!);
        setGoals(g.goals||[]);
      } catch {}
    })();
  },[token]);

  async function submit(e: React.FormEvent){
    e.preventDefault(); setErr(null); setMsg(null);
    try{
      const fd = new FormData();
      fd.append('user_id', form.user_id);
      fd.append('goal_id', form.goal_id);
      if(form.amount) fd.append('amount', String(form.amount));
      if(form.note) fd.append('note', form.note);
      fd.append('status', form.status);
      if (fileRef.current?.files) Array.from(fileRef.current.files).forEach(f=> fd.append('files', f));
      const res = await fetch(`${API_URL}/submissions/admin-create`, { method:'POST', headers:{ Authorization: `Bearer ${token}` }, body: fd });
      if(!res.ok) throw new Error((await res.json()).error || 'Erro');
      setMsg('Submissão criada.'); setForm({ user_id:'', goal_id:'', amount:'', note:'', status:'PENDING' }); if(fileRef.current) fileRef.current.value='';
    }catch(e:any){ setErr(e.message); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Criar Submissão (Admin)</h1>
      <form className="card space-y-3" onSubmit={submit}>
        {err && <div className="text-red-400">{err}</div>}
        {msg && <div className="text-neon-500">{msg}</div>}
        <label className="block text-sm">
          <span className="text-slate-300">Membro</span>
          <select className="select-input" value={form.user_id} onChange={e=>setForm({...form, user_id:e.target.value})} required>
            <option value="">Selecione...</option>
            {users.map(u=> <option key={u.id} value={u.id}>{u.nickname}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Meta</span>
          <select className="select-input" value={form.goal_id} onChange={e=>setForm({...form, goal_id:e.target.value})} required>
            <option value="">Selecione...</option>
            {goals.map(g=> <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Quantia (opcional)</span>
          <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Descrição</span>
          <textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})}></textarea>
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Status inicial</span>
          <select className="select-input" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
            {['PENDING','APPROVED','REJECTED'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-300">Evidências (imagens)</span>
          <input ref={fileRef} type="file" multiple accept="image/*" />
        </label>
        <button className="btn">Criar</button>
      </form>
    </div>
  );
}

