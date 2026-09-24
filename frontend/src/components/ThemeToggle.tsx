import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex items-center justify-between w-14 h-7 p-1 rounded-pills border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-canopy-dark/40 transition-colors duration-300 cursor-pointer"
    >
      <Sun className="w-3.5 h-3.5 text-canopy ml-1 z-10" />
      <Moon className="w-3.5 h-3.5 text-mint-pulse mr-1 z-10" />
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 bottom-0.5 w-6 h-6 rounded-full bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist/70 dark:border-sage-dark ${
          isDark ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
};