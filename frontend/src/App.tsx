import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth';
import Home from './pages/Home';
import Recruitment from './pages/Recruitment';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UserDashboard from './pages/user/Dashboard';
import UserGoals from './pages/user/Goals';
import UserProfile from './pages/user/Profile';
import UserRanking from './pages/user/Ranking';
import AdminDashboard from './pages/admin/Dashboard';
import AdminForms from './pages/admin/Forms';
import AdminMembers from './pages/admin/Members';
import AdminGoals from './pages/admin/Goals';
import AdminSubmissions from './pages/admin/Submissions';
import AdminLogs from './pages/admin/Logs';
import Downloads from './pages/Downloads';

function Protected({ children }: { children: JSX.Element }) {
  const { token, mustChangePassword } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return children;
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!['ADMIN', 'ELITE', 'LEADER'].includes(role || '')) return <Navigate to="/" replace />;
  return children;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { token, role, nickname, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" onError={(e:any)=>e.currentTarget.style.display='none'} className="w-10 h-10" />
            <span className="title-pixel">Tropa do Force</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/downloads" className="hover:text-emerald-600">Downloads</Link>
            <Link to="/recruitment" className="hover:text-emerald-600">Recrutamento</Link>
            {token ? (
              <>
                <Link to="/app" className="hover:text-emerald-600">Meu Painel</Link>
                {['ADMIN','ELITE','LEADER'].includes(role||'') && (<Link to="/admin" className="hover:text-emerald-600">Admin</Link>)}
                <span className="text-stone-400">{nickname}</span>
                <button className="btn" onClick={logout}>Sair</button>
              </>
            ) : (
              <Link to="/login" className="btn">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-stone-800 border-t border-stone-700 text-center py-4 text-sm text-stone-400">© TDF</footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<Protected><ChangePassword /></Protected>} />

          <Route path="/app" element={<Protected><UserDashboard /></Protected>} />
          <Route path="/app/goals" element={<Protected><UserGoals /></Protected>} />
          <Route path="/app/profile" element={<Protected><UserProfile /></Protected>} />
          <Route path="/app/ranking" element={<Protected><UserRanking /></Protected>} />

          <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
          <Route path="/admin/forms" element={<AdminOnly><AdminForms /></AdminOnly>} />
          <Route path="/admin/members" element={<AdminOnly><AdminMembers /></AdminOnly>} />
          <Route path="/admin/goals" element={<AdminOnly><AdminGoals /></AdminOnly>} />
          <Route path="/admin/submissions" element={<AdminOnly><AdminSubmissions /></AdminOnly>} />
          <Route path="/admin/logs" element={<AdminOnly><AdminLogs /></AdminOnly>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

