import { useEffect, useState } from 'react';
import { API_URL } from '../store/auth';

type Award = { id: string; title: string; description: string; tier: string; achieved_on: string };
type RankRow = { user_id: string; nickname: string; rank_points?: number; goals_completed?: number };

export default function Home() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [rank, setRank] = useState<{ topByRankPoints: RankRow[]; topByGoalsCompleted: RankRow[] } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/awards`).then(r => r.json()).then(d => setAwards(d.awards || [])).catch(()=>{});
    fetch(`${API_URL}/ranking`).then(r => r.json()).then(setRank).catch(()=>{});
    fetch(`${API_URL}/public/events`).then(r => r.json()).then(d => setEvents(d.events||[])).catch(()=>{});
    fetch(`${API_URL}/public/staff`).then(r=>r.json()).then(d=>setStaff(d.staff||[])).catch(()=>{});
  }, []);

  return (
    <div>
      <section className="relative">
        <img src="/images/banner.jpg" onError={(e:any)=>e.currentTarget.style.display='none'} className="w-full h-64 object-cover opacity-60"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl title-pixel text-center">Tropa do Force (TDF)</h1>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="card">
          <h2 className="text-2xl mb-2">Quem somos</h2>
          <p>Clã de Minecraft Rankup focado em metas coletivas, performance e muita diversão. Junte-se à TDF para construir, farmar e conquistar.</p>
        </section>

        <section className="card">
          <h2 className="text-2xl mb-4">Liderança e Elite</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff.map((s:any)=> (
              <div key={s.id} className="p-3 rounded border border-stone-700 bg-stone-900/60">
                <div className="font-semibold">{s.nickname}</div>
                <div className="text-sm text-stone-300">{s.role}</div>
                <div className="text-xs text-stone-500">Discord: {s.discord_tag}</div>
              </div>
            ))}
            {!staff.length && <div className="text-stone-400">Em breve.</div>}
          </div>
        </section>

        <section className="card">
          <h2 className="text-2xl mb-4">Conquistas recentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {awards.slice(0,6).map(a => (
              <div key={a.id} className="p-3 rounded border border-stone-700 bg-stone-900/60">
                <div className="text-emerald-600 font-semibold">{a.title}</div>
                <div className="text-sm text-stone-300">{a.description}</div>
                <div className="text-xs text-stone-500 mt-1">{new Date(a.achieved_on).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-2xl mb-2">Ranking (resumo)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-emerald-600 mb-1">Rank Points</h3>
                <ul className="text-sm space-y-1">
                  {(rank?.topByRankPoints||[]).slice(0,5).map((r,i)=> (
                    <li key={i}>{i+1}. {r.nickname} — {r.rank_points}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-600 mb-1">Metas concluidas</h3>
                <ul className="text-sm space-y-1">
                  {(rank?.topByGoalsCompleted||[]).slice(0,5).map((r,i)=> (
                    <li key={i}>{i+1}. {r.nickname} — {r.goals_completed}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="text-2xl mb-2">Próximos eventos</h2>
            <ul className="text-sm space-y-1">
              {events.slice(0,5).map((e:any,i)=> (
                <li key={i}>• {e.title} {e.starts_at?`(início ${new Date(e.starts_at).toLocaleDateString()})`:''}</li>
              ))}
              {!events.length && <li className="text-stone-400">Sem eventos no momento.</li>}
            </ul>
          </div>
        </section>

        <section className="card">
          <h2 className="text-2xl mb-2">Galeria</h2>
          <Gallery />
        </section>
      </div>
    </div>
  );
}

function Gallery(){
  const [items, setItems] = useState<any[]>([]);
  useEffect(()=>{ fetch(`${API_URL}/public/gallery`).then(r=>r.json()).then(d=>setItems(d.items||[])).catch(()=>{}); },[]);
  if(!items.length) return <div className="text-stone-400 text-sm">Envie prints via metas e premiações para aparecer aqui.</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((it:any)=>(<img key={it.id} src={it.url} className="w-full h-32 object-cover rounded border border-stone-700"/>))}
    </div>
  );
}
