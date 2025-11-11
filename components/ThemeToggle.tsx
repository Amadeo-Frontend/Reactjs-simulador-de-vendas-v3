// components/ThemeToggle.tsx
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm border-border hover:bg-secondary " +
        (className || "")
      }
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Claro" : "Escuro"}
    </button>
  );
};

export default ThemeToggle;
