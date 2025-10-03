import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminSubmissions(){
  const { token } = useAuth();
  const [subs, setSubs] = useState<any[]>([]);

  async function load(){ const d = await api('/submissions?status=PENDING', {}, token!); setSubs(d.submissions||[]); }
  useEffect(()=>{ load(); },[token]);

  async function approve(id:string){ await api(`/submissions/${id}/approve`, { method:'POST' }, token!); load(); }
  async function reject(id:string){ await api(`/submissions/${id}/reject`, { method:'POST' }, token!); load(); }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Submissões de Metas</h1>
      <div className="card">
        <ul className="space-y-2 max-h-[30rem] overflow-auto">
          {subs.map(s => (
            <li key={s.id} className="border-b border-stone-700 pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{s.goal?.title}</div>
                  <div className="text-sm text-stone-400">Por {s.submittedBy?.nickname} — {new Date(s.created_at).toLocaleString()}</div>
                </div>
                <div className="space-x-2">
                  <button className="btn" onClick={()=>approve(s.id)}>Aprovar</button>
                  <button className="btn bg-red-700 hover:bg-red-600" onClick={()=>reject(s.id)}>Rejeitar</button>
                </div>
              </div>
            </li>
          ))}
          {!subs.length && <li className="text-stone-400">Sem pendências.</li>}
        </ul>
      </div>
    </div>
  );
}

