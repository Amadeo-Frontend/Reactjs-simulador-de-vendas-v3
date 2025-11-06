import React, { useState, useCallback, useEffect } from "react";
import MarginSimulator from "./components/MarginSimulator";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import Input from "./components/ui/Input";
import Card from "./components/ui/Card";
import SunIcon from "./components/icons/SunIcon";
import MoonIcon from "./components/icons/MoonIcon";
import Loader from "react-loaders";

/* ==================== API helper (com Bearer) ==================== */

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://reactjs-simulador-de-vendas-v3.vercel.app";

function getToken() {
  try {
    return localStorage.getItem("auth_token") || "";
  } catch {
    return "";
  }
}

async function api(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const method = (init.method || "GET").toString().toUpperCase();
  const headers = new Headers(init.headers || {});

  // Só define Content-Type quando NÃO for GET
  if (method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Anexa Bearer se existir
  const t = getToken();
  if (t && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${t}`);
  }

  return fetch(url, {
    ...init,
    method,
    headers,
    // Mantemos include: se o navegador permitir cookie, beleza; senão, o Bearer resolve
    credentials: "include",
  });
}

/* ==================== UI: Overlay de carregamento ==================== */

const LoaderOverlay: React.FC<{ show: boolean; text?: string }> = ({
  show,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/30 backdrop-blur-sm">
      <Loader type="ball-spin-fade-loader" active />
    </div>
  );
};

/* ==================== Tela de Login ==================== */

const LoginScreen: React.FC<{
  onLogin: () => void;
  setGlobalLoading: (v: boolean) => void;
}> = ({ onLogin, setGlobalLoading }) => {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    setGlobalLoading(true);

    try {
      const resp = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json().catch(() => ({} as any));

      if (!resp.ok || !data?.ok) {
        setError(data?.message || "Credenciais inválidas. Tente novamente.");
        return;
      }

      // Salva token Bearer (evita bloqueio de cookie de terceiros)
      if (data.token) {
        try {
          localStorage.setItem("auth_token", data.token);
        } catch {}
      }

      onLogin();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSubmitting(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 transition-colors rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Alternar tema"
        >
          {theme === "light" ? (
            <MoonIcon className="w-6 h-6" />
          ) : (
            <SunIcon className="w-6 h-6" />
          )}
        </button>
      </div>

      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">
            Simulador de Margem
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Faça login para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Usuário"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            label="Senha"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-center text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 font-semibold text-white transition-transform transform bg-green-400 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </Card>
    </div>
  );
};

/* ==================== App ==================== */

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checando
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);

  // Checa sessão ao carregar (com Bearer se existir)
  useEffect(() => {
    (async () => {
      setGlobalLoading(true);
      try {
        const r = await api("/api/me"); // GET sem Content-Type -> sem preflight
        setIsLoggedIn(r.ok);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setGlobalLoading(false);
      }
    })();
  }, []);

  const handleLogin = useCallback(() => setIsLoggedIn(true), []);

  const handleLogout = useCallback(async () => {
    setGlobalLoading(true);
    try {
      // Remove token Bearer e tenta encerrar cookie (se houver)
      try {
        localStorage.removeItem("auth_token");
      } catch {}
      await api("/api/logout", { method: "POST" });
    } catch {}
    setIsLoggedIn(false);
    setGlobalLoading(false);
  }, []);

  // Render
  return (
    <>
      <LoaderOverlay show={globalLoading} text="Carregando..." />
      {isLoggedIn ? (
        <MarginSimulator onLogout={handleLogout} />
      ) : isLoggedIn === false ? (
        <LoginScreen
          onLogin={handleLogin}
          setGlobalLoading={setGlobalLoading}
        />
      ) : (
        // estado inicial (null): mostra página vazia enquanto overlay aparece
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
