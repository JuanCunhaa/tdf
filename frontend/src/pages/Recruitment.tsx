import { useEffect, useState } from 'react';
import { API_URL } from '../store/auth';

export default function Recruitment(){
  const [form, setForm] = useState<any>({
    nickname:'', real_name:'', discord_tag:'', age:'', country:'', focus_area:'MINERACAO', prior_clans:'', motivation:'', accepts_rules:false, portfolio_links:'', challenge_input:'', challenge_token:''
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [done, setDone] = useState<{id:string}|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [challenge, setChallenge] = useState<string>('');

  useEffect(()=>{
    fetch(`${API_URL}/applications/challenge`).then(r=>r.json()).then(d=>{ setChallenge(d.code); setForm((f:any)=>({...f, challenge_token:d.token})); }).catch(()=>{});
  },[]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try{
      const res = await fetch(`${API_URL}/applications`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        ...form,
        age: Number(form.age),
      })});
      if(!res.ok) throw new Error((await res.json()).error || 'Erro');
      const data = await res.json();
      if(files && files.length){
        for(const f of Array.from(files)){
          const fd = new FormData(); fd.append('file', f);
          await fetch(`${API_URL}/uploads/application/${data.id}`, { method:'POST', body: fd });
        }
      }
      setDone({id: data.id});
    }catch(e:any){ setError(e.message); }
  };

  if(done) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Recrutamento enviado</h1>
      <div className="card">Obrigado! Seu formulário foi recebido. Aguarde a avaliação da equipe.</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Recrutamento — Entrar no TDF</h1>
      <form className="card space-y-4" onSubmit={submit}>
        {error && <div className="text-red-400">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Nick do Minecraft" value={form.nickname} onChange={(v)=>setForm({...form,nickname:v})} required />
          <Input label="Nome real" value={form.real_name} onChange={(v)=>setForm({...form,real_name:v})} required />
          <Input label="Discord (com tag)" value={form.discord_tag} onChange={(v)=>setForm({...form,discord_tag:v})} required />
          <Input label="Idade" type="number" value={form.age} onChange={(v)=>setForm({...form,age:v})} required />
          <Input label="País" value={form.country} onChange={(v)=>setForm({...form,country:v})} required />
          <Select label="Se destaca em" value={form.focus_area} onChange={(v)=>setForm({...form,focus_area:v})} options={[{label:'Mineração',value:'MINERACAO'},{label:'Farm',value:'FARM'},{label:'Saque',value:'SAQUE'}]} />
          <Input label="Já participou de outros clãs? Quais?" value={form.prior_clans} onChange={(v)=>setForm({...form,prior_clans:v})} />
          <label className="block text-sm md:col-span-2">
            <span className="text-slate-300">Por que devemos aceitar você no clã?</span>
            <textarea value={form.motivation} onChange={(e)=>setForm({...form,motivation:e.target.value})}></textarea>
          </label>
          <Input label="Links de prints/fotos (opcional)" value={form.portfolio_links} onChange={(v)=>setForm({...form,portfolio_links:v})} />
          <div className="flex items-center gap-2 md:col-span-2 bg-slate-900/50 p-3 rounded border border-slate-700">
            <input id="rules" type="checkbox" checked={form.accepts_rules} onChange={(e)=>setForm({...form,accepts_rules:e.target.checked})} />
            <label htmlFor="rules">Confirmo que li e aceito as regras internas e metas coletivas.</label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">Digite a sequência anti‑bot: <b className="text-neon-500">{challenge||'...'}</b></label>
            <input value={form.challenge_input} onChange={(e)=>setForm({...form,challenge_input:e.target.value})} required />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Anexos (opcional)</label>
          <input type="file" multiple accept="image/*" onChange={(e)=>setFiles(e.target.files)} />
        </div>
        <button className="btn">Enviar</button>
      </form>
    </div>
  );
}

function Input({label, value, onChange, type='text', required=false}:{label:string, value:any, onChange:(v:string)=>void, type?:string, required?:boolean}){
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <input value={value} onChange={e=>onChange((e.target as HTMLInputElement).value)} type={type} required={required} />
    </label>
  );
}
function Select({label, value, onChange, options}:{label:string, value:string, onChange:(v:string)=>void, options:{label:string,value:string}[]}){
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <select className="select-input" value={value} onChange={e=>onChange((e.target as HTMLSelectElement).value)}>{options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </label>
  );
}
