import { useState } from 'react';
import { api, useAuth } from '../store/auth';

export default function ChangePassword(){
  const { token, login, role, nickname } = useAuth();
  const [form, setForm] = useState({ currentPassword:'', newPassword:'' });
  const [msg, setMsg] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  async function submit(e: React.FormEvent){
    e.preventDefault(); setError(null);
    try{ await api('/auth/change-password', { method:'POST', body: JSON.stringify(form) }, token!);
      // refresh mustChangePassword flag
      login({ token: token!, role: role!, nickname: nickname!, mustChangePassword: false });
      setMsg('Senha alterada com sucesso.');
      setTimeout(()=> location.href = '/app', 800);
    }catch(e:any){ setError(e.message); }
  }
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Trocar senha (primeiro acesso)</h1>
      <form className="card space-y-3" onSubmit={submit}>
        {msg && <div className="text-neon-500">{msg}</div>}
        {error && <div className="text-red-400">{error}</div>}
        <label className="block text-sm">
          <span>Senha atual</span>
          <input type="password" className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={form.currentPassword} onChange={e=>setForm({...form, currentPassword:e.target.value})} required />
        </label>
        <label className="block text-sm">
          <span>Nova senha</span>
          <input type="password" className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={form.newPassword} onChange={e=>setForm({...form, newPassword:e.target.value})} required />
        </label>
        <button className="btn w-full">Salvar</button>
      </form>
    </div>
  );
}
