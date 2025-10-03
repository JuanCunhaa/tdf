import { useEffect, useState } from 'react';
import { api, useAuth } from '../../store/auth';

export default function AdminGoals(){
  const { token } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ title:'', description:'', type:'OTHER', target_amount:'', unit:'', visibility:'CLAN' });
  const [msg, setMsg] = useState<string|null>(null);

  async function load(){ const d = await api('/goals?status=ACTIVE', {}, token!); setGoals(d.goals||[]); }
  useEffect(()=>{ load(); },[token]);

  async function create(){ await api('/goals', { method:'POST', body: JSON.stringify({ ...form, target_amount: form.target_amount? Number(form.target_amount): undefined }) }, token!); setForm({ title:'', description:'', type:'OTHER', target_amount:'', unit:'', visibility:'CLAN' }); setMsg('Meta criada.'); load(); setTimeout(()=>setMsg(null), 1000); }
  async function archive(id:string){ await api(`/goals/${id}`, { method:'PATCH', body: JSON.stringify({ status:'ARCHIVED' }) }, token!); load(); }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Metas</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h2 className="text-xl">Criar</h2>
          {msg && <div className="text-emerald-400">{msg}</div>}
          <Input label="Título" value={form.title} onChange={(v)=>setForm({...form,title:v})} />
          <Input label="Descrição" value={form.description} onChange={(v)=>setForm({...form,description:v})} />
          <Select label="Tipo" value={form.type} onChange={(v)=>setForm({...form,type:v})} options={["FARM","BUILD","RANK","EVENT","OTHER"]} />
          <Input label="Target (opcional)" value={form.target_amount} onChange={(v)=>setForm({...form,target_amount:v})} type="number" />
          <Input label="Unidade (opcional)" value={form.unit} onChange={(v)=>setForm({...form,unit:v})} />
          <Select label="Visibilidade" value={form.visibility} onChange={(v)=>setForm({...form,visibility:v})} options={["PUBLIC","CLAN"]} />
          <button className="btn" onClick={create}>Criar</button>
        </div>
        <div className="card">
          <h2 className="text-xl mb-2">Ativas</h2>
          <ul className="space-y-2 max-h-[28rem] overflow-auto">
            {goals.map(g => (
              <li key={g.id} className="border-b border-stone-700 pb-2">
                <div className="font-semibold">{g.title}</div>
                <div className="text-sm text-stone-400">{g.description}</div>
                <div className="mt-2 flex gap-2">
                  <button className="btn" onClick={()=>archive(g.id)}>Arquivar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
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

