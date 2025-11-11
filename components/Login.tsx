// components/Login.tsx
import React, { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { Moon, Sun, Lock, Mail } from "lucide-react";
import logo from "../images/logo.png";

type Props = {
  onLogin: () => void;
  api: (path: string, init?: RequestInit) => Promise<Response>;
  logoSrc?: string;
  title?: string;
};

const Login: React.FC<Props> = ({ onLogin, api, logoSrc = "/images/logo.png", title = "Dashboard Sulpet" }) => {
  const { theme, toggleTheme } = useTheme();

  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as any));
        setErr(j?.message || "Credenciais inválidas.");
        return;
      }
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top bar (logo esquerda, tema direita) */}
      <div className="sticky top-0 z-10 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Sulpet" className="rounded-full shadow-sm w-9 h-9" />
            <h1 className="text-lg font-bold sm:text-xl text-slate-800 dark:text-slate-100">
              {title}
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-10 h-10 bg-white border rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Alternar tema"
            aria-label="Alternar tema"
            type="button"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Conteúdo central */}
      <div className="container px-4 py-10 mx-auto">
        <div className="w-full max-w-md mx-auto">
          <div className="p-6 border shadow-md rounded-2xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Entrar
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Use seu usuário e senha para acessar
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
                  Usuário
                </label>
                <div className="relative">
                  <Mail className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    className="w-full py-2 pr-3 bg-white border rounded-md outline-none pl-9 border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
                    value={username}
                    onChange={(e) => setU(e.target.value)}
                    autoComplete="username"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="w-full py-2 pr-3 bg-white border rounded-md outline-none pl-9 border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
                    value={password}
                    onChange={(e) => setP(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {err && (
                <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Sulpet • Todos os direitos reservados
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
