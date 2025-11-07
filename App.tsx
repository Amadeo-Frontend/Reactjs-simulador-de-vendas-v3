import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { ThemeProvider, useTheme } from "./hooks/useTheme";
import SunIcon from "./components/icons/SunIcon";
import MoonIcon from "./components/icons/MoonIcon";

import Home from "./pages/Home";
import MarginSimulator from "./components/MarginSimulator";

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

/** Botão de tema usando seu hook atual */
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

/* ---------- Login ---------- */
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j?.message || "Credenciais inválidas.");
      return;
    }
    onLogin();
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

/* ---------- App Shell ---------- */
const AppContent: React.FC = () => {
  const [isLogged, setIsLogged] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/me");
        setIsLogged(r.ok);
      } catch {
        setIsLogged(false);
      }
    })();
  }, []);

  if (isLogged === null) return <div className="min-h-screen bg-background" />;

  if (!isLogged) return <LoginScreen onLogin={() => setIsLogged(true)} />;

  return (
    <BrowserRouter>
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
                  await api("/api/logout", { method: "POST" });
                } catch {}
                location.reload();
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

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
