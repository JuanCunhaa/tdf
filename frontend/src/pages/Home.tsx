import { useEffect, useState } from 'react';
import { API_URL } from '../store/auth';

export default function Home() {
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/public/staff`).then(r=>r.json()).then(d=>setStaff(d.staff||[])).catch(()=>{});
  }, []);

  return (
    <div>
      <section className="bg-obsidian">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-10 text-center">
          <h1 className="text-4xl md:text-5xl title-pixel">Tropa do Force (TDF)</h1>
          <p className="mt-4 text-slate-300">Clân focado em farm e mina, ta com nós, ta no topo!</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a className="btn" href="/recruitment">Recrutamento</a>
            <a className="btn-outline" href="/login">Login</a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="card">
          <h2 className="text-2xl mb-4">Liderança e Elite</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff.map((s:any)=> {
              const apiBase = (API_URL || '').replace(/\/api$/,'');
              const avatar = s.avatar_url ? `${apiBase}${s.avatar_url}` : '/images/logo.png';
              return (
              <div key={s.id} className="p-4 rounded border border-slate-700 bg-slate-800/50 hover:shadow-glow transition">
                <div className="flex items-center gap-3">
                  <img src={avatar} className="w-14 h-14 rounded object-cover border border-slate-700" onError={(e:any)=>{ e.currentTarget.src='/images/logo.png'; }} />
                  <div>
                    <div className="font-semibold">{s.nickname}</div>
                    <div className="text-xs text-slate-400">{roleLabel(s.role)}</div>
                    <div className="text-xs text-slate-500">Discord: {s.discord_tag}</div>
                  </div>
                </div>
              </div>
              );
            })}
            {!staff.length && <div className="text-slate-400">Configure a liderança no Admin e envie fotos.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function roleLabel(code: string){
  switch(code){
    case 'LEADER': return 'Líder';
    case 'ELITE': return 'Elite';
    case 'ADMIN': return 'Admin';
    case 'MEMBER': return 'Membro';
    default: return code;
  }
}
