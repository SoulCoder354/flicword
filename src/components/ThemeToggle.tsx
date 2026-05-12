import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("flicword-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("flicword-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setDark((d) => !d)}
      className="glass h-10 w-10 rounded-full grid place-items-center text-foreground/80 hover:text-foreground transition-all hover:scale-105"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
