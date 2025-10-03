import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminGoals(){
  const { token } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ title:'', description:'', type:'OTHER', target_amount:'', unit:'', visibility:'CLAN', scope:'USER' });
  const [msg, setMsg] = useState<string|null>(null);
  const [selected, setSelected] = useState<any|null>(null);
  const [detail, setDetail] = useState<any|null>(null);

  async function load(){ const d = await api('/goals?status=ACTIVE', {}, token!); setGoals(d.goals||[]); }
  useEffect(()=>{ load(); },[token]);

  async function create(){ await api('/goals', { method:'POST', body: JSON.stringify({ ...form, target_amount: form.target_amount? Number(form.target_amount): undefined }) }, token!); setForm({ title:'', description:'', type:'OTHER', target_amount:'', unit:'', visibility:'CLAN', scope:'USER' }); setMsg('Meta criada.'); load(); setTimeout(()=>setMsg(null), 1000); }
  async function archive(id:string){ await api(`/goals/${id}`, { method:'PATCH', body: JSON.stringify({ status:'ARCHIVED' }) }, token!); load(); }
  async function openDetail(g:any){ setSelected(g); try{ const d = await api(`/goals/${g.id}/detail`, {}, token!); setDetail(d); } catch { setDetail(null); } }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Metas</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h2 className="text-xl">Criar</h2>
          {msg && <div className="text-neon-500">{msg}</div>}
          <Input label="Título" value={form.title} onChange={(v)=>setForm({...form,title:v})} />
          <Input label="Descrição" value={form.description} onChange={(v)=>setForm({...form,description:v})} />
          <Select label="Tipo" value={form.type} onChange={(v)=>setForm({...form,type:v})} options={["FARM","BUILD","RANK","EVENT","OTHER"]} />
          <Input label="Target (opcional)" value={form.target_amount} onChange={(v)=>setForm({...form,target_amount:v})} type="number" />
          <Input label="Unidade (opcional)" value={form.unit} onChange={(v)=>setForm({...form,unit:v})} />
          <Select label="Visibilidade" value={form.visibility} onChange={(v)=>setForm({...form,visibility:v})} options={["PUBLIC","CLAN"]} />
          <Select label="Escopo" value={form.scope} onChange={(v)=>setForm({...form,scope:v})} options={["USER","CLAN"]} />
          <button className="btn" onClick={create}>Criar</button>
        </div>
        <div className="card">
          <h2 className="text-xl mb-2">Ativas</h2>
          <ul className="space-y-2 max-h-[28rem] overflow-auto">
            {goals.map(g => (
              <li key={g.id} className="border-b border-stone-700 pb-2">
                <div className="font-semibold">{g.title} <span className="text-xs text-slate-400">[{g.scope}{g.is_daily? ' • diaria':''}]</span></div>
                <div className="text-sm text-stone-400">{g.description}</div>
                <div className="mt-2 flex gap-2">
                  <button className="btn" onClick={()=>archive(g.id)}>Arquivar</button>
                  <button className="btn" onClick={()=>openDetail(g)}>Ver detalhes</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {selected && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Detalhes: {selected.title}</h2>
            <button className="btn-outline" onClick={()=>{ setSelected(null); setDetail(null); }}>Fechar</button>
          </div>
          {!detail && <div className="text-slate-400">Carregando...</div>}
          {detail && (
            <div className="mt-3 text-sm space-y-3">
              {selected.scope === 'CLAN' ? (
                <>
                  <div>Total aprovado: <span className="font-semibold">{detail.totalApproved}</span> {selected.unit || ''}</div>
                  <div>
                    <div className="font-semibold mb-1">Ranking de contribuicoes</div>
                    <ul className="list-decimal list-inside space-y-1">
                      {(detail.ranking||[]).map((r:any,i:number)=> (
                        <li key={i}>{r.nickname} - {r.count} contribs ({r.amount}{selected.unit||''})</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Contribuicoes</div>
                    <ul className="space-y-1 max-h-80 overflow-auto">
                      {(detail.contributions||[]).map((c:any)=> (
                        <li key={c.id} className="border-b border-slate-700 py-1">
                          <div className="flex justify-between items-center">
                            <span>[{c.status}] {c.submittedBy?.nickname} - {c.amount ?? '-'} {selected.unit||''}</span>
                            <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 space-x-2">
                            {c.status === 'PENDING' && (
                              <>
                                <button className="btn" onClick={async()=>{ await api(`/submissions/${c.id}/approve`, { method:'POST' }, token!); const d = await api(`/goals/${selected.id}/detail`, {}, token!); setDetail(d); }}>Aprovar</button>
                                <button className="btn bg-red-700 hover:bg-red-600" onClick={async()=>{ const reason = prompt('Motivo da recusa (opcional):')||''; await api(`/submissions/${c.id}/reject`, { method:'POST', body: JSON.stringify({ reason }) }, token!); const d = await api(`/goals/${selected.id}/detail`, {}, token!); setDetail(d); }}>Recusar</button>
                              </>
                            )}
                            <button className="btn bg-slate-700 hover:bg-slate-600" onClick={async()=>{ if(confirm('Excluir esta contribuição?')){ await fetch(`${API_URL}/submissions/${c.id}`, { method:'DELETE', headers: { Authorization: `Bearer ${token}` } }); const d = await api(`/goals/${selected.id}/detail`, {}, token!); setDetail(d); } }}>Excluir</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold mb-1">Progresso (hoje)</div>
                  <ul className="grid md:grid-cols-3 gap-2 max-h-96 overflow-auto">
                    {(detail.users||[]).map((u:any)=> (
                      <li key={u.user_id} className="p-2 rounded border border-slate-700 bg-slate-800/50 flex items-center justify-between">
                        <span>{u.nickname}</span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-700">{u.todayStatus || 'NENHUM'}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Input({label, value, onChange, type='text'}:{label:string, value:any, onChange:(v:string)=>void, type?:string}){
  return (
    <label className="block text-sm">
      <span className="text-stone-300">{label}</span>
      <input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={value} onChange={e=>onChange((e.target as HTMLInputElement).value)} type={type} />
    </label>
  );
}
function Select({label, value, onChange, options}:{label:string, value:string, onChange:(v:string)=>void, options:string[]}){
  return (
    <label className="block text-sm">
      <span className="text-stone-300">{label}</span>
      <select className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={value} onChange={e=>onChange((e.target as HTMLSelectElement).value)}>{options.map(o=> <option key={o} value={o}>{o}</option>)}</select>
    </label>
  );
}
