import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminMembers(){
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);

  async function load(){ const d = await api('/users', {}, token!); setUsers(d.users||[]); }
  useEffect(()=>{ load(); },[token]);

  async function setRole(id:string, role:string){ setError(null); try{ await api(`/users/${id}/role`, { method:'PATCH', body: JSON.stringify({ role }) }, token!); load(); }catch(e:any){ setError(e.message); } }
  async function setStatus(id:string, status:string){ setError(null); try{ await api(`/users/${id}/status`, { method:'PATCH', body: JSON.stringify({ status }) }, token!); load(); }catch(e:any){ setError(e.message); } }
  async function resetPass(id:string){ const r = await api(`/users/${id}/reset-password`, { method:'POST' }, token!); alert(`Nova senha temporária: ${r.temporaryPassword}`); }
  async function deactivate(id:string){ if(confirm('Desativar usuário?')){ await api(`/users/${id}`, { method:'DELETE' }, token!); load(); } }

  function exportCSV(){ location.href = '/api/users/export.csv'; }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Membros</h1>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-stone-400">
            <tr><th className="text-left p-2">Nick</th><th className="text-left p-2">Cargo</th><th className="text-left p-2">Status</th><th className="text-left p-2">Ações</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-stone-700">
                <td className="p-2">{u.nickname}</td>
                <td className="p-2">
                  <select className="bg-stone-800 border border-stone-700 rounded" value={u.role} onChange={e=>setRole(u.id, e.target.value)}>
                    {['LEADER','ELITE','ADMIN','MEMBER'].map(r=> <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <select className="bg-stone-800 border border-stone-700 rounded" value={u.status} onChange={e=>setStatus(u.id, e.target.value)}>
                    {['ACTIVE','INACTIVE','BANNED'].map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-2 space-x-2">
                  <button className="btn" onClick={()=>resetPass(u.id)}>Resetar senha</button>
                  <button className="btn bg-red-700 hover:bg-red-600" onClick={()=>deactivate(u.id)}>Desativar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <button className="btn" onClick={exportCSV}>Exportar CSV</button>
      </div>
    </div>
  );
}

