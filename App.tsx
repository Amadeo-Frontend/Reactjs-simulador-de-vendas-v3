// App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider, useTheme } from "./hooks/useTheme";
import { LoadingProvider, useLoading } from "./hooks/useLoading";
import LoadingOverlay from "./components/LoadingOverlay";
import RouteChangeLoader from "./components/RouteChangeLoader";

import Header from "./components/Header";

import Home from "./pages/Home";
import MarginSimulator from "./pages/MarginSimulator";
import ProductsManagement from "./pages/ProductsManager";

import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";

/* ============== API helper ============== */
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://server-simulador-de-vendas-v3.onrender.com";

async function api(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  return fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
}

/* ============== Toggle de Tema (para usar na tela de login) ============== */
const ThemeToggleBtn: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm " +
        "border-border hover:bg-secondary " +
        (className || "")
      }
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Claro" : "Escuro"}
    </button>
  );
};

/* ============== Tela de Login (com loader) ============== */
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { show, hide } = useLoading();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [reveal, setReveal] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      show("Validando credenciais...");
      const r = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as any));
        setErr(j?.message || "Credenciais inválidas.");
        return;
      }
      onLogin();
    } finally {
      hide();
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,rgba(99,102,241,.08),transparent),radial-gradient(800px_500px_at_110%_10%,rgba(16,185,129,.08),transparent)] dark:bg-[radial-gradient(1000px_600px_at_10%_-10%,rgba(99,102,241,.15),transparent),radial-gradient(800px_500px_at_110%_10%,rgba(16,185,129,.12),transparent)] grid place-items-center px-4">
      <div className="w-full max-w-md">
        {/* Logo + título */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <img
            src="/logo.svg"
            alt="Logo"
            className="object-contain w-16 h-16 border shadow-sm rounded-xl border-border"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Dashboard Sulpet</h1>
            <p className="text-sm text-muted-foreground">
              Acesse para gerenciar preços e simulações
            </p>
          </div>
        </div>

        <div className="p-5 border shadow-md rounded-2xl border-border bg-card">
          {/* topo do card: toggle de tema */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              Acesso restrito
            </div>
            <ThemeToggleBtn />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Usuário */}
            <div>
              <label className="block mb-1 text-sm">Usuário</label>
              <div className="relative">
                <User className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  className="w-full py-2 pr-3 border rounded-md outline-none pl-9 border-input bg-background"
                  value={username}
                  onChange={(e) => setU(e.target.value)}
                  autoComplete="username"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block mb-1 text-sm">Senha</label>
              <div className="relative">
                <Lock className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                <input
                  className="w-full py-2 pr-10 border rounded-md outline-none pl-9 border-input bg-background"
                  type={reveal ? "text" : "password"}
                  value={password}
                  onChange={(e) => setP(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="absolute p-1 -translate-y-1/2 rounded right-2 top-1/2 hover:bg-secondary"
                  aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
                  title={reveal ? "Ocultar senha" : "Mostrar senha"}
                >
                  {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {err && (
              <div className="p-2 text-sm text-red-500 border rounded-md border-red-500/30 bg-red-500/5">
                {err}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
            >
              Entrar
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* rodapé pequeno */}
          <div className="mt-4 text-[11px] text-center text-muted-foreground">
            Suporte: TI Sulpet — acesso permitido somente para usuários autorizados.
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============== App Shell ============== */
const AppContent: React.FC = () => {
  const { show, hide } = useLoading();
  const [isLogged, setIsLogged] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        show("Checando sessão...");
        const r = await api("/api/me");
        setIsLogged(r.ok);
      } catch {
        setIsLogged(false);
      } finally {
        hide();
      }
    })();
  }, [show, hide]);

  if (isLogged === null) return <div className="min-h-screen bg-background" />;
  if (!isLogged) return <LoginScreen onLogin={() => setIsLogged(true)} />;

  const doLogout = async () => {
    try {
      show("Saindo...");
      await api("/api/logout", { method: "POST" });
    } finally {
      hide();
      location.reload();
    }
  };

  return (
    <BrowserRouter>
      <RouteChangeLoader />
      <Header onLogout={doLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulador" element={<MarginSimulator />} />
        <Route path="/produtos" element={<ProductsManagement />} />
      </Routes>
    </BrowserRouter>
  );
};

/* ============== App Root (Theme + Loading Providers) ============== */
const App: React.FC = () => (
  <ThemeProvider>
    <LoadingProvider>
      <LoadingOverlay />
      <AppContent />
    </LoadingProvider>
  </ThemeProvider>
);

export default App;
