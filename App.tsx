import React, { useState, useCallback, useEffect } from 'react';
import MarginSimulator from './components/MarginSimulator';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';

/** Base da API:
 *  - Produção (Vercel): defina VITE_API_BASE = https://server-simulador-de-vendas-v3.onrender.com
 *  - Dev local: deixe vazio e use proxy do Vite se quiser
 */
const API_BASE = import.meta.env.VITE_API_BASE || 'https://server-simulador-de-vendas-v3.onrender.com';

async function api(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  return fetch(url, {
    credentials: 'include', // envia/recebe cookie httpOnly
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init
  });
}

/* ===================== Login ===================== */
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const resp = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({} as any));
        setError(data?.message || 'Credenciais inválidas. Tente novamente.');
        return;
      }
      onLogin();
    } catch {
      setError('Erro de rede. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Alternar tema"
        >
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
      </div>

      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">
            Simulador de Margem
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Faça login para continuar</p>
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

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-transform transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </Card>
    </div>
  );
};

/* ===================== App ===================== */
const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checando

  // Checa sessão no carregamento. 401 aqui é normal antes do login.
  useEffect(() => {
    (async () => {
      try {
        const r = await api('/api/me');
        setIsLoggedIn(r.ok);
      } catch {
        setIsLoggedIn(false);
      }
    })();
  }, []);

  const handleLogin = useCallback(() => setIsLoggedIn(true), []);

  const handleLogout = useCallback(async () => {
    try {
      await api('/api/logout', { method: 'POST' });
    } catch {}
    setIsLoggedIn(false);
  }, []);

  if (isLoggedIn === null) return null; // pode renderizar um spinner se quiser

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  return <MarginSimulator onLogout={handleLogout} />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
