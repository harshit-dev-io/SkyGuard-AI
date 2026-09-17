import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("skyguard-theme") === "dark" ||
        (!localStorage.getItem("skyguard-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("skyguard-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("skyguard-theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      aria-label="Toggle theme"
      className="relative flex items-center justify-between w-14 h-7 p-1 rounded-full border border-borderMuted-light dark:border-borderMuted-dark bg-paper-light dark:bg-paper-dark transition-colors duration-300"
    >
      <Sun className="w-3.5 h-3.5 text-amber-500 ml-1 z-10" />
      <Moon className="w-3.5 h-3.5 text-slate-400 mr-1 z-10" />
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 bottom-0.5 w-6 h-6 rounded-full bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark shadow-sm ${
          isDark ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
};