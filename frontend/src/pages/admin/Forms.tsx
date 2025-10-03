import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminForms(){
  const { token } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [view, setView] = useState<any|null>(null);
  const [error, setError] = useState<string|null>(null);

  async function load(){ const d= await api('/applications?status=PENDING', {}, token!); setApps(d.applications||[]); }
  useEffect(()=>{ load(); },[token]);

  async function open(id:string){ const d = await api(`/applications/${id}`, {}, token!); setView(d.application); }
  async function accept(id:string){ setError(null); try{ const r= await api(`/applications/${id}/accept`, { method:'POST' }, token!); alert(`Aceito! Senha temporária: ${r.temporaryPassword}`); setView(null); load(); }catch(e:any){ setError(e.message);} }
  async function reject(id:string){ const reason = prompt('Motivo:')||''; await api(`/applications/${id}/reject`, { method:'POST', body: JSON.stringify({ reason }) }, token!); setView(null); load(); }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Formulários</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl mb-2">Pendentes</h2>
          <ul className="space-y-2 max-h-[28rem] overflow-auto">
            {apps.map((a)=> (
              <li key={a.id} className="flex items-center justify-between border-b border-stone-700 py-2">
                <div>
                  <div className="font-semibold">{a.nickname}</div>
                  <div className="text-sm text-stone-400">{a.discord_tag} — {new Date(a.created_at).toLocaleString()}</div>
                </div>
                <button className="btn" onClick={()=>open(a.id)}>Ver completo</button>
              </li>
            ))}
            {!apps.length && <li className="text-stone-400">Sem pendências.</li>}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-xl mb-2">Detalhes</h2>
          {error && <div className="text-red-400">{error}</div>}
          {!view && <div className="text-slate-400">Selecione um formulário.</div>}
          {view && (
            <div className="space-y-3 text-sm">
              <Row label="Nick">{view.nickname}</Row>
              <Row label="Nome real">{view.real_name}</Row>
              <Row label="Discord">{view.discord_tag}</Row>
              <Row label="Idade">{view.age}</Row>
              <Row label="País">{view.country}</Row>
              <Row label="Horas por dia">{view.daily_play_hours ?? '-'}</Row>
              <Row label="Área de destaque">{view.focus_area}</Row>
              {view.prior_clans && <Row label="Clãs anteriores">{view.prior_clans}</Row>}
              <Row label="Motivação"><div className="whitespace-pre-wrap">{view.motivation}</div></Row>
              {view.portfolio_links && <Row label="Links">{view.portfolio_links}</Row>}
              <div className="flex gap-2 mt-3">
                <button className="btn" onClick={()=>accept(view.id)}>Aceitar</button>
                <button className="btn bg-red-700 hover:bg-red-600" onClick={()=>reject(view.id)}>Rejeitar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({label, children}:{label:string, children:any}){
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-slate-400">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}
