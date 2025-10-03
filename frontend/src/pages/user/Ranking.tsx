import { useEffect, useState } from 'react';
import { API_URL } from '../../store/auth';

export default function UserRanking(){
  const [data, setData] = useState<any>(null);
  useEffect(()=>{ fetch(`${API_URL}/ranking`).then(r=>r.json()).then(setData).catch(()=>{}); },[]);
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Ranking do Clã</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl mb-2">Top Rank Points</h2>
          <ol className="space-y-1 list-decimal list-inside">
            {(data?.topByRankPoints||[]).map((r:any,i:number)=> <li key={i}>{r.nickname} — {r.rank_points}</li>)}
          </ol>
        </div>
        <div className="card">
          <h2 className="text-xl mb-2">Top Metas Concluídas</h2>
          <ol className="space-y-1 list-decimal list-inside">
            {(data?.topByGoalsCompleted||[]).map((r:any,i:number)=> <li key={i}>{r.nickname} — {r.goals_completed}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}

