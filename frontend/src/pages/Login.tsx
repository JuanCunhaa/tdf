import { useState } from 'react';
import { useAuth, api } from '../store/auth';

export default function Login(){
  const { login } = useAuth();
  const [mode, setMode] = useState<'user'|'admin'>('user');
  const [form, setForm] = useState<any>({ nickname:'', email:'', password:'' });
  const [error, setError] = useState<string|null>(null);

  async function submit(e: React.FormEvent){
    e.preventDefault(); setError(null);
    try{
      if(mode==='user'){
        const r = await api('/auth/login-user', { method:'POST', body: JSON.stringify({ nickname: form.nickname, password: form.password }) });
        login({ token: r.token, role: r.role, nickname: r.nickname, mustChangePassword: r.mustChangePassword });
      }else{
        const r = await api('/auth/login-admin', { method:'POST', body: JSON.stringify({ email: form.email, password: form.password }) });
        login({ token: r.token, role: r.role, nickname: r.nickname, mustChangePassword: r.mustChangePassword });
      }
      location.href = '/';
    }catch(e:any){ setError(e.message); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Login</h1>
      <div className="card">
        <div className="flex gap-2 mb-4">
          <button className={`btn ${mode==='user'?'bg-emerald-600':''}`} onClick={()=>setMode('user')}>Usuário</button>
          <button className={`btn ${mode==='admin'?'bg-emerald-600':''}`} onClick={()=>setMode('admin')}>Admin</button>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          {error && <div className="text-red-400">{error}</div>}
          {mode==='user'? (
            <label className="block text-sm">
              <span className="text-stone-300">Nickname</span>
              <input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={form.nickname} onChange={e=>setForm({...form, nickname:e.target.value})} required />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="text-stone-300">E-mail (admin)</span>
              <input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
            </label>
          )}
          <label className="block text-sm">
            <span className="text-stone-300">Senha</span>
            <input type="password" className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          </label>
          <button className="btn w-full">Entrar</button>
        </form>
      </div>
    </div>
  );
}

