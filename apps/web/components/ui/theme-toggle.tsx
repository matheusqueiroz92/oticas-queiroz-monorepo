"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800/50 rounded-full p-2">
      <Sun className="mr-2 h-4 w-4" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Alternar tema escuro/claro"
      />
      <Moon className="ml-2 h-4 w-4" />
    </div>
  );
}
 