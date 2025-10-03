import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminAssignments(){
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ title:'', description:'', assignees: [] as string[] });
  const [err, setErr] = useState<string|null>(null);
  const [msg, setMsg] = useState<string|null>(null);
  const [pending, setPending] = useState<any[]>([]);

  async function load(){
    const u = await api('/users', {}, token!);
    setUsers(u.users||[]);
    const a = await api('/assignments', {}, token!);
    setList(a.assignments||[]);
    const p = await api('/assignments/submissions?status=SUBMITTED', {}, token!);
    setPending(p.submissions||[]);
  }
  useEffect(()=>{ load(); },[token]);

  function toggleAssignee(id:string){
    setForm((f:any)=> ({ ...f, assignees: f.assignees.includes(id) ? f.assignees.filter((x:string)=>x!==id) : [...f.assignees, id] }));
  }

  async function create(){
    setErr(null); setMsg(null);
    try{ await api('/assignments', { method:'POST', body: JSON.stringify(form) }, token!); setForm({ title:'', description:'', assignees: [] }); setMsg('Criado.'); load(); }catch(e:any){ setErr(e.message); }
  }

  async function approve(id:string){ await api(`/assignments/submissions/${id}/approve`, { method:'POST' }, token!); load(); }
  async function reject(id:string){ const reason = prompt('Motivo?')||''; await api(`/assignments/submissions/${id}/reject`, { method:'POST', body: JSON.stringify({ reason }) }, token!); load(); }
  async function removeSub(id:string){ if(!confirm('Apagar esta submissão?')) return; await api(`/assignments/submissions/${id}`, { method:'DELETE' }, token!); load(); }
  async function removeAssignment(id:string){ if(!confirm('Apagar esta tarefa e todas as submissões relacionadas?')) return; await api(`/assignments/${id}`, { method:'DELETE' }, token!); load(); }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Tarefas/Submissões</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h2 className="text-xl">Criar</h2>
          {err && <div className="text-red-400">{err}</div>}
          {msg && <div className="text-neon-500">{msg}</div>}
          <label className="block text-sm"><span className="text-slate-300">Título</span><input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></label>
          <label className="block text-sm"><span className="text-slate-300">Descrição</span><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></label>
          <div className="text-sm text-slate-300">Atribuir a:</div>
          <div className="max-h-48 overflow-auto border border-slate-700 rounded p-2">
            {users.map(u => (
              <label key={u.id} className="block text-sm">
                <input type="checkbox" className="checkbox" checked={form.assignees.includes(u.id)} onChange={()=>toggleAssignee(u.id)} /> {u.nickname}
              </label>
            ))}
          </div>
          <button className="btn" onClick={create}>Criar</button>
        </div>

        <div className="card">
          <h2 className="text-xl mb-2">Pendentes de aprovação</h2>
          <ul className="space-y-2 max-h-80 overflow-auto">
            {pending.map((s:any)=> (
              <li key={s.id} className="border-b border-slate-700 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{s.assignment.title}</div>
                    <div className="text-xs text-slate-400">Por {s.user.nickname}</div>
                    <div className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{s.explanation}</div>
                    <a className="text-neon-500 text-xs" href={s.evidence_url} target="_blank">Ver evidência</a>
                  </div>
                  <div className="space-x-2">
                    <button className="btn" onClick={()=>approve(s.id)}>Aprovar</button>
                    <button className="btn bg-red-700 hover:bg-red-600" onClick={()=>reject(s.id)}>Rejeitar</button>
                    <button className="btn bg-slate-700 hover:bg-slate-600" onClick={()=>removeSub(s.id)}>Apagar</button>
                  </div>
                </div>
              </li>
            ))}
            {!pending.length && <li className="text-slate-400">Nada pendente.</li>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl mb-2">Lista</h2>
        <ul className="space-y-2">
          {list.map((a:any)=> (
            <li key={a.id} className="border-b border-slate-700 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-slate-300">{a.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">OPEN {a.counts?.OPEN||0} • SUBMITTED {a.counts?.SUBMITTED||0} • APPR {a.counts?.APPROVED||0}</div>
                  <button className="btn mt-2 bg-slate-700 hover:bg-slate-600" onClick={()=>removeAssignment(a.id)}>Apagar tarefa</button>
                </div>
              </div>
            </li>
          ))}
          {!list.length && <li className="text-slate-400">Sem registros.</li>}
        </ul>
      </div>
    </div>
  );
}
