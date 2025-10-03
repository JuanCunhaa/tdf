import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function UserDashboard(){
  const { token, nickname } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  useEffect(()=>{
    api('/notifications', {}, token!).then(d=>setNotifs(d.notifications||[])).catch(()=>{});
    api('/submissions/mine', {}, token!).then(d=>setSubs(d.submissions||[])).catch(()=>{});
  },[token]);
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
          <h2 className="text-xl mb-2">Suas submissões</h2>
          <ul className="text-sm space-y-2 max-h-64 overflow-auto">
            {subs.map((s)=> <li key={s.id}>[{s.status}] {s.goal?.title} <span className="text-xs text-stone-500">{new Date(s.created_at).toLocaleString()}</span></li>)}
            {!subs.length && <li className="text-stone-400">Sem submissões ainda.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
