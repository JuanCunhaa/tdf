# TDF — Tropa do Force (Rankup)

Tropa do Force (TDF) — Plataforma Web (Rankup)

Monorepo com frontend (React + Tailwind) e backend (Node/Express + Prisma/PostgreSQL), incluindo autenticação JWT, uploads de imagens, painel Admin e painel Usuário.

Estrutura de diretórios

- backend — API REST (Express, Prisma, JWT, Multer, Zod)
- frontend — SPA (Vite + React + Tailwind)

Requisitos

- Node 18+
- PostgreSQL 14+

Configuração rápida

1) Backend

- Copie `backend/.env.example` para `backend/.env` e ajuste as variáveis.
- Instale dependências: `cd backend && npm i`
- Gere Prisma Client e aplique migrações: `npm run db:push`
- Popule seeds: `npm run seed`
- Inicie API: `npm run dev`

2) Frontend

- `cd frontend && npm i`
- `npm run dev`

Imagens do clã

- Coloque a logo e o banner em `frontend/public/images` como `logo.png` e `banner.jpg`.
- Observação: você mencionou uma pasta local "imagens"; copie os arquivos de lá para o caminho acima.

URLs padrão

- API: http://localhost:4000
- Frontend: http://localhost:5173

Deploy (Render + Vercel)

- PostgreSQL: recomendo PostgreSQL 15 (ou 14+). Prisma suporta 11+ e o projeto foi testado com 15. Em Render, crie um PostgreSQL gerenciado e copie a `DATABASE_URL`.

- Backend (Render):
  - Conecte o repo e use `render.yaml` (Blueprint) para provisionar.
  - Em Variáveis de ambiente, informe `DATABASE_URL` do Render PostgreSQL e ajuste `CORS_ORIGIN` com o domínio Vercel (ex.: https://tdf.vercel.app).
  - O blueprint já define um disco persistente para uploads em `/data/uploads`.

- Frontend (Vercel):
  - Configure o projeto apontando a raiz `frontend/` (ou mantenha o `vercel.json` na raiz como já está).
  - Defina a env `VITE_API_URL` (ex.: `https://tdf-backend.onrender.com/api`).
  - Build: `npm run build`, Output: `dist`.

Obs.: Se preferir proxy no Vercel, pode configurar um rewrite para o backend, mas com `VITE_API_URL` não é necessário.

Contas de exemplo (seeds)

- LEADER: nickname `Noel` (login pelo nickname), senha: definida no seed (veja logs do seed)
- ELITE: nickname `Elite01`
- ADMIN: nickname `Mod01` (também pode autenticar via email em rota admin)
- MEMBER: nickname `Player01`

Fluxos principais cobertos

- Recrutamento: envio de formulário, revisão por admin (Aceitar/Rejeitar). Ao aceitar, cria usuário com senha temporária (mostrada uma única vez na resposta) e registra em `AUDIT_LOGS`.
- Autenticação: JWT. Usuário entra por nickname; Admin por email; flag `must_change_password` força troca no primeiro login.
- Metas: CRUD admin; submissão de comprovação por membro com upload (imagem), aprovação/rejeição por admin.
- Ranking: baseado em `USER_STATS` (pontos e metas concluídas).
- Notificações internas e trilha de auditoria.

Segurança e uploads

- Senhas sempre com hash (bcrypt). Senhas temporárias nunca são salvas em claro; apenas mostradas uma vez ao admin no ato de aceitação.
- Uploads restritos a imagens (PNG/JPG/WebP) com limite de tamanho; metadados persistidos em `UPLOADS`.

Discord (opcional)

- Configure `DISCORD_BOT_TOKEN` e `DISCORD_CHANNEL_ID` no `.env` para enviar notificações (ex.: "Fulano entrou no clã!").

Scripts úteis

- Backend
  - `npm run dev` — servidor com ts-node-dev
  - `npm run build` — compila TypeScript
  - `npm run start` — inicia build
  - `npm run db:push` — aplica schema Prisma no Postgres
  - `npm run seed` — popula dados iniciais
  - `npm run lint` — lint básico (opcional se configurado)

Licença

- Uso interno do clã TDF.
