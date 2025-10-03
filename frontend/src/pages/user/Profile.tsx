import { useEffect, useState } from 'react';
import { API_URL, api, useAuth } from '../../store/auth';

export default function UserProfile(){
  const { token } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [discord, setDiscord] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string|null>(null);

  useEffect(()=>{ api('/auth/me', {}, token!).then(d=>{ setUser(d.user); setDiscord(d.user.discord_tag||''); setEmail(d.user.email||''); }); },[token]);

  async function save(){
    const d = await api('/users/me', { method:'PATCH', body: JSON.stringify({ discord_tag: discord, email }) }, token!);
    setMsg('Perfil atualizado.'); setTimeout(()=>setMsg(null), 1200);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    const fd = new FormData(); fd.append('file', f);
    await fetch(`${API_URL}/uploads/avatar`, { method:'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    setMsg('Avatar enviado.'); setTimeout(()=>setMsg(null), 1200);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-3xl">Perfil</h1>
      {user && (
        <div className="card space-y-3">
          {msg && <div className="text-neon-500">{msg}</div>}
          <div className="text-sm">Nickname: <b>{user.nickname}</b></div>
          <label className="block text-sm">Discord<input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={discord} onChange={e=>setDiscord(e.target.value)} /></label>
          <label className="block text-sm">E-mail<input type="email" className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <div>
            <label className="block text-sm mb-1">Skin/Avatar</label>
            <input type="file" accept="image/*" onChange={uploadAvatar} />
          </div>
          <button className="btn" onClick={save}>Salvar</button>
        </div>
      )}
    </div>
  );
}
