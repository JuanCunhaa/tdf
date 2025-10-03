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

      <div className="grid md:grid-cols-3 gap-4">
        <CardLink title="Formulários" to="/admin/forms" desc="Revisar recrutamento" />
        <CardLink title="Membros" to="/admin/members" desc="Gerenciar cargos e status" />
        <CardLink title="Criar conta" to="/admin/create-user" desc="Criar membros/admins" />
        <CardLink title="Metas" to="/admin/goals" desc="Criar/arquivar metas" />
        <CardLink title="Submissões" to="/admin/submissions" desc="Aprovar/recusar comprovações" />
        <CardLink title="Logs" to="/admin/logs" desc="Auditoria e histórico" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl mb-2">Últimos formulários</h2>
          <Link className="btn" to="/admin/forms">Gerenciar</Link>
        </div>
        <ul className="space-y-2">
          {apps.slice(0,5).map(a => <li key={a.id} className="text-sm">{a.nickname} — {a.discord_tag} <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</span></li>)}
          {!apps.length && <li className="text-slate-400">Sem pendências.</li>}
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

function CardLink({title, to, desc}:{title:string; to:string; desc:string}){
  return (
    <Link to={to} className="block p-4 rounded border border-slate-700 bg-slate-800/50 hover:shadow-glow transition">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-slate-400">{desc}</div>
    </Link>
  );
}
