import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Ctx = { theme: Theme; toggleTheme: () => void };

const ThemeCtx = createContext<Ctx>({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // 1) inicializa de localStorage OU media query
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('theme')) as Theme | null;
    if (stored) {
      setTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  // 2) aplica classe `dark` no <html> e persiste
  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return <ThemeCtx.Provider value={{ theme, toggleTheme }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);
