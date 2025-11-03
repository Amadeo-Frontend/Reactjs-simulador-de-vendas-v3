import React from 'react';
import { useTheme } from '../hooks/useTheme';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import LogoutIcon from './icons/LogoutIcon';

interface HeaderProps {
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    Simulador de Margem
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Logout"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
