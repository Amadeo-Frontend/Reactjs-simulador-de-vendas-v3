// components/Header.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import LogoutIcon from './icons/LogoutIcon';
import { ArrowLeft } from 'lucide-react';
import logo from "../images/logo.png";

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Mostra o botão de voltar quando não estiver na home
  const showBack = location.pathname !== '/';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur border-slate-200 dark:border-slate-800">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          {/* Logo + Título */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Sulpet"
              className="w-8 h-8 rounded-full shadow-sm"
            />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Hub Sulpet
            </h1>
          </div>

          {/* Ações à direita */}
          <div className="flex items-center gap-2">
            {showBack && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 bg-white border rounded-md h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                aria-label="Voltar ao menu"
                title="Voltar ao menu"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center bg-white border rounded-md w-9 h-9 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 border rounded-md h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
              aria-label="Sair"
              title="Sair"
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer para compensar a barra fixa (altura = h-16) */}
      <div className="h-16" />
    </>
  );
};

export default Header;
