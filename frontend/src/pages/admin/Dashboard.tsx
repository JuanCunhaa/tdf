import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';
import { Link } from 'react-router-dom';

export default function AdminDashboard(){
  const { token } = useAuth();
  const [sum, setSum] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  useEffect(()=>{
    api('/admin/summary', {}, token!).then(setSum).catch(()=>{});
    api('/applications?status=PENDING', {}, token!).then(d=>setApps(d.applications||[])).catch(()=>{});
  },[token]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Admin — Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Membros" value={sum?.members} />
        <Stat label="Formulários pendentes" value={sum?.pendingForms} />
        <Stat label="Metas ativas" value={sum?.activeGoals} />
        <Stat label="Submissões pendentes" value={sum?.pendingSubs} />
      </div>
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl mb-2">Últimos formulários</h2>
          <Link className="btn" to="/admin/forms">Gerenciar</Link>
        </div>
        <ul className="space-y-2">
          {apps.slice(0,5).map(a => <li key={a.id} className="text-sm">{a.nickname} — {a.discord_tag} <span className="text-xs text-stone-500">{new Date(a.created_at).toLocaleString()}</span></li>)}
          {!apps.length && <li className="text-stone-400">Sem pendências.</li>}
        </ul>
      </div>
    </div>
  );
}

function Stat({label, value}:{label:string, value:any}){
  return (
    <div className="card text-center">
      <div className="text-stone-400 text-sm">{label}</div>
      <div className="text-3xl font-bold">{value ?? '-'}</div>
    </div>
  );
}

