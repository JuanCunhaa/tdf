import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminLogs(){
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(()=>{ api('/logs', {}, token!).then(d=>setLogs(d.logs||[])).catch(()=>{}); },[token]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Logs / Auditoria</h1>
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-stone-400"><tr><th className="text-left p-2">Data</th><th className="text-left p-2">Ator</th><th className="text-left p-2">Ação</th><th className="text-left p-2">Entidade</th></tr></thead>
          <tbody>
            {logs.map((l:any)=>(
              <tr key={l.id} className="border-t border-stone-700">
                <td className="p-2">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-2">{l.actor?.nickname} ({l.actor?.role})</td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">{l.entity} {l.entity_id?`#${l.entity_id}`:''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

