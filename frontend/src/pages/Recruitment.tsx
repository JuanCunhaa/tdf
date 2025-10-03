import { useState } from 'react';
import { API_URL } from '../store/auth';

export default function Recruitment(){
  const [form, setForm] = useState<any>({
    nickname:'', discord_tag:'', age:'', region:'', mc_experience:'', highest_rank:'', preferences:'', weekly_hours:'', prior_clan:false, why_left_prior_clan:'', why_join_us:'', accepts_rules:false, portfolio_links:'', attention_word:''
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [done, setDone] = useState<{id:string}|null>(null);
  const [error, setError] = useState<string|null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try{
      const res = await fetch(`${API_URL}/applications`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        ...form,
        age: Number(form.age), weekly_hours: Number(form.weekly_hours),
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
          <Input label="Discord (com tag)" value={form.discord_tag} onChange={(v)=>setForm({...form,discord_tag:v})} required />
          <Input label="Idade" type="number" value={form.age} onChange={(v)=>setForm({...form,age:v})} required />
          <Input label="Região/País" value={form.region} onChange={(v)=>setForm({...form,region:v})} required />
          <Input label="Experiência no Minecraft" value={form.mc_experience} onChange={(v)=>setForm({...form,mc_experience:v})} required />
          <Input label="Maior rank já atingido" value={form.highest_rank} onChange={(v)=>setForm({...form,highest_rank:v})} required />
          <Input label="Preferência de jogo (CSV)" value={form.preferences} onChange={(v)=>setForm({...form,preferences:v})} required />
          <Input label="Disponibilidade semanal (horas)" type="number" value={form.weekly_hours} onChange={(v)=>setForm({...form,weekly_hours:v})} required />
          <Select label="Já participou de outro clã?" value={form.prior_clan? 'yes':'no'} onChange={(v)=>setForm({...form,prior_clan:v==='yes'})} options={[{label:'Não', value:'no'},{label:'Sim', value:'yes'}]} />
          {form.prior_clan && <Input label="Por que saiu?" value={form.why_left_prior_clan} onChange={(v)=>setForm({...form,why_left_prior_clan:v})} />}
          <Input label="Motivo para entrar no TDF" value={form.why_join_us} onChange={(v)=>setForm({...form,why_join_us:v})} required />
          <Input label="Links de prints/fotos (opcional)" value={form.portfolio_links} onChange={(v)=>setForm({...form,portfolio_links:v})} />
          <div className="flex items-center gap-2">
            <input id="rules" type="checkbox" checked={form.accepts_rules} onChange={(e)=>setForm({...form,accepts_rules:e.target.checked})} />
            <label htmlFor="rules">Aceito seguir regras internas e metas coletivas</label>
          </div>
          <Input label="Digite a palavra RANKUP" value={form.attention_word} onChange={(v)=>setForm({...form,attention_word:v})} required />
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
      <span className="text-stone-300">{label}</span>
      <input className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={value} onChange={e=>onChange((e.target as HTMLInputElement).value)} type={type} required={required} />
    </label>
  );
}
function Select({label, value, onChange, options}:{label:string, value:string, onChange:(v:string)=>void, options:{label:string,value:string}[]}){
  return (
    <label className="block text-sm">
      <span className="text-stone-300">{label}</span>
      <select className="w-full mt-1 px-3 py-2 rounded bg-stone-800 border border-stone-700" value={value} onChange={e=>onChange((e.target as HTMLSelectElement).value)}>{options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </label>
  );
}

