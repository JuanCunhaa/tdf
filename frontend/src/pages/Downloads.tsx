import { useEffect, useState } from 'react';
import { API_URL } from '../store/auth';

export default function Downloads(){
  const [files, setFiles] = useState<{name:string, url:string}[]>([]);
  useEffect(()=>{ fetch(`${API_URL}/downloads`).then(r=>r.json()).then(d=>setFiles(d.files||[])).catch(()=>{}); },[]);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-4">Downloads</h1>
      <div className="card">
        {!files.length && <div className="text-stone-400">Nenhum arquivo disponível.</div>}
        <ul className="space-y-2">
          {files.map(f => (
            <li key={f.name} className="flex justify-between items-center border-b border-stone-700 py-2">
              <span>{f.name}</span>
              <a className="btn" href={f.url} target="_blank">Baixar</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

