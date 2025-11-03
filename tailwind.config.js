/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  darkMode: 'class', // <- OBRIGATÓRIO para alternar via classe
  content: [
    "./index.html",
    "./**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      // cria utilitárias text-primary-600, bg-primary-600 etc.
      colors: {
        primary: colors.indigo, // pode trocar por colors.blue se preferir
      },
      // (opcional) suaviza transições de tema
      transitionDuration: { 300: '300ms' },
    }
  },
  plugins: [],
};
