import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { ThemeProvider, useTheme } from "./hooks/useTheme";
import { LoadingProvider, useLoading } from "./hooks/useLoading";
import LoadingOverlay from "./components/LoadingOverlay";
import RouteChangeLoader from "./components/RouteChangeLoader";

import SunIcon from "./components/icons/SunIcon";
import MoonIcon from "./components/icons/MoonIcon";

import Home from "./pages/Home";
import MarginSimulator from "./components/MarginSimulator";

/* ============== API helper (sem loader automático) ============== */
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

/* ============== UI: Botão de Tema ============== */
const ThemeButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 px-3 text-sm border rounded-md h-9 border-border bg-background hover:bg-secondary"
      aria-label="Alternar tema"
    >
      {theme === "light" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
      <span className="hidden sm:inline">{theme === "light" ? "Escuro" : "Claro"}</span>
    </button>
  );
};

/* ============== Tela de Login (usa o loader) ============== */
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { show, hide } = useLoading();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
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
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-900">
      <div className="absolute right-4 top-4">
        <ThemeButton />
      </div>

      <div className="w-full max-w-md p-6 border shadow rounded-xl border-border bg-card">
        <h1 className="mb-1 text-2xl font-bold text-primary">Simulador de Margem</h1>
        <p className="mb-6 text-sm text-muted-foreground">Faça login para continuar</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Usuário</label>
            <input
              className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
              value={username}
              onChange={(e) => setU(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Senha</label>
            <input
              className="w-full px-3 py-2 border rounded-md outline-none border-input bg-background"
              type="password"
              value={password}
              onChange={(e) => setP(e.target.value)}
              autoComplete="current-password"
            />
          </div>

        {err && <p className="text-sm text-red-500">{err}</p>}

          <button
            type="submit"
            className="w-full px-4 py-2 font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

/* ============== App Shell (usa o loader) ============== */
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

  return (
    <BrowserRouter>
      {/* Loader curto em toda troca de rota */}
      <RouteChangeLoader />

      {/* Topbar global */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between mx-auto h-14">
          <Link to="/" className="font-semibold">
            Sulpet • Painel
          </Link>
          <div className="flex items-center gap-2">
            <ThemeButton />
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  show("Saindo...");
                  await api("/api/logout", { method: "POST" });
                } finally {
                  hide();
                  location.reload();
                }
              }}
            >
              <button
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
                type="submit"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulador" element={<MarginSimulator />} />
      </Routes>
    </BrowserRouter>
  );
};

/* ============== App Root (Theme + Loading Providers) ============== */
const App: React.FC = () => (
  <ThemeProvider>
    <LoadingProvider>
      {/* Overlay global do loader (sempre montado) */}
      <LoadingOverlay />
      <AppContent />
    </LoadingProvider>
  </ThemeProvider>
);

export default App;
