import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Role = 'LEADER' | 'ELITE' | 'ADMIN' | 'MEMBER' | null;

type AuthState = {
  token: string | null;
  role: Role;
  nickname: string | null;
  mustChangePassword: boolean;
  login: (data: { token: string; role: string; nickname: string; mustChangePassword?: boolean }) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tdf_token'));
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('tdf_role') as Role) || null);
  const [nickname, setNickname] = useState<string | null>(() => localStorage.getItem('tdf_nick'));
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => localStorage.getItem('tdf_mcp') === '1');

  const login = (d: { token: string; role: string; nickname: string; mustChangePassword?: boolean }) => {
    setToken(d.token); setRole(d.role as Role); setNickname(d.nickname); setMustChangePassword(!!d.mustChangePassword);
    localStorage.setItem('tdf_token', d.token);
    localStorage.setItem('tdf_role', d.role);
    localStorage.setItem('tdf_nick', d.nickname);
    localStorage.setItem('tdf_mcp', d.mustChangePassword ? '1' : '0');
  };
  const logout = () => {
    setToken(null); setRole(null); setNickname(null); setMustChangePassword(false);
    localStorage.removeItem('tdf_token');
    localStorage.removeItem('tdf_role');
    localStorage.removeItem('tdf_nick');
    localStorage.removeItem('tdf_mcp');
  };

  const value = useMemo(() => ({ token, role, nickname, mustChangePassword, login, logout }), [token, role, nickname, mustChangePassword]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}

export const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path: string, opts: RequestInit = {}, token?: string | null) {
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error || res.statusText);
  return res.json();
}

