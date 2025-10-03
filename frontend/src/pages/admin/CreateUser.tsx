import { useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminCreateUser(){
  const { token } = useAuth();
  const [form, setForm] = useState({ nickname:'', discord_tag:'', email:'', role:'MEMBER' });
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function submit(e: React.FormEvent){
    e.preventDefault(); setErr(null); setMsg(null);
    try{
      const d = await api('/users', { method:'POST', body: JSON.stringify({ ...form, email: form.email || null }) }, token!);
      setMsg(`Conta criada. Senha temporária: ${d.temporaryPassword}`);
      setForm({ nickname:'', discord_tag:'', email:'', role:'MEMBER' });
    }catch(e:any){ setErr(e.message); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Criar Conta</h1>
      <form className="card space-y-3" onSubmit={submit}>
        {err && <div className="text-red-400">{err}</div>}
        {msg && <div className="text-neon-500">{msg}</div>}
        <label className="block text-sm"><span className="text-slate-300">Nickname</span><input value={form.nickname} onChange={e=>setForm({...form, nickname:e.target.value})} required /></label>
        <label className="block text-sm"><span className="text-slate-300">Discord</span><input value={form.discord_tag} onChange={e=>setForm({...form, discord_tag:e.target.value})} required /></label>
        <label className="block text-sm"><span className="text-slate-300">E-mail (opcional)</span><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></label>
        <label className="block text-sm"><span className="text-slate-300">Cargo</span>
          <select className="select-input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            {['LEADER','ELITE','ADMIN','MEMBER'].map(r=> <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <button className="btn">Criar</button>
      </form>
    </div>
  );
}

