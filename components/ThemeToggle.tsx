import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) setIsDark(saved === "dark");
      else setIsDark(true);
    } catch {}
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Claro</span>
      <Switch checked={isDark} onCheckedChange={setIsDark} />
      <span>Escuro</span>
    </div>
  );
}
