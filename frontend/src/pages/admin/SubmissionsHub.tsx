import { Link } from 'react-router-dom';

export default function SubmissionsHub(){
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl">Submissões</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/admin/submissions" className="block p-4 rounded border border-slate-700 bg-slate-800/50 hover:shadow-glow transition">
          <div className="text-lg font-semibold">Submissões de Metas</div>
          <p className="text-sm text-slate-400 mt-1">Revisar comprovações de Metas que os membros enviam (com imagens). Você também pode criar uma submissão de Meta para um membro em “Criar Submissão”.</p>
        </Link>
        <Link to="/admin/assignments" className="block p-4 rounded border border-slate-700 bg-slate-800/50 hover:shadow-glow transition">
          <div className="text-lg font-semibold">Tarefas/Submissões</div>
          <p className="text-sm text-slate-400 mt-1">Crie tarefas com título e descrição e atribua a um ou mais membros. Eles concluem enviando explicação e link de print. Você aprova ou recusa.</p>
        </Link>
      </div>
      <div className="card">
        <div className="text-lg font-semibold mb-2">Criar Submissão de Meta</div>
        <p className="text-sm text-slate-400">Use quando você (admin) precisa cadastrar uma comprovação de Meta para um membro específico. Adicione imagens e defina o status inicial.</p>
        <Link to="/admin/create-submission" className="btn mt-3 inline-block">Ir para Criar Submissão</Link>
      </div>
    </div>
  );
}

