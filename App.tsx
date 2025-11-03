import React, { useState, useCallback, useEffect } from 'react';
import MarginSimulator from './components/MarginSimulator';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import SunIcon from './components/icons/SunIcon';
import MoonIcon from './components/icons/MoonIcon';

/**
 * API helper
 * - Em produção usa a URL do backend na Vercel (VITE_API_BASE)
 * - Em dev local (sem VITE_API_BASE), usa caminho relativo e o proxy do Vite (se configurado)
 */
const API_BASE = import.meta.env.VITE_API_BASE || '';

async function api(path: string, init?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    credentials: 'include', // necessário para enviar/receber cookie httpOnly
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });
  return r;
}

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const resp = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data?.message || 'Credenciais inválidas. Tente novamente.');
        return;
      }

      onLogin();
    } catch {
      setError('Erro de rede. Tente novamente.');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>
      </div>

      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
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
            className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
          >
            Entrar
          </button>
        </form>
      </Card>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // verifica sessão ao carregar (cookie httpOnly)
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

  if (isLoggedIn === null) {
    // pode colocar um spinner aqui se preferir
    return null;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

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
