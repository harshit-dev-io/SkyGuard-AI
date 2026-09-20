import React, { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronDown, Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenAuth: (mode: "login" | "signup") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-paper-light/90 dark:bg-paper-dark/90 backdrop-blur-md border-b border-borderMuted-light dark:border-borderMuted-dark transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
            [•]
          </span>
          <a
            href="#"
            className="font-sans font-bold text-sm tracking-[0.2em] text-ink-light dark:text-ink-dark uppercase"
          >
            SkyGuard AI
          </a>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          <a
            href="#home"
            className="hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            Home
          </a>
          <a
            href="#about"
            className="hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            About
          </a>
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-ink-light dark:hover:text-ink-dark transition-colors">
              Stations <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <div className="absolute top-full -left-2 mt-2 w-40 bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark rounded-md shadow-card dark:shadow-cardDark py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all text-left">
              <a
                href="#registration"
                className="block px-4 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-ink-light dark:text-ink-dark text-[11px]"
              >
                Registration
              </a>
              <a
                href="#network"
                className="block px-4 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-ink-light dark:text-ink-dark text-[11px]"
              >
                Network Map
              </a>
            </div>
          </div>
          <a
            href="#alerts"
            className="hover:text-ink-light dark:hover:text-ink-dark transition-colors"
          >
            Alerts
          </a>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <button
            onClick={() => onOpenAuth("login")}
            className="px-4 py-1.5 text-xs font-mono font-semibold tracking-wider uppercase border border-borderMuted-light dark:border-borderMuted-dark text-ink-light dark:text-ink-dark hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded transition-all cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => onOpenAuth("signup")}
            className="px-4 py-1.5 text-xs font-mono font-bold tracking-wider uppercase bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:bg-[#262626] dark:hover:bg-[#e0e0e0] rounded transition-all shadow-sm cursor-pointer"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Burger */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-ink-light dark:text-ink-dark"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-borderMuted-light dark:border-borderMuted-dark bg-paper-light dark:bg-paper-dark p-6 space-y-4 font-mono text-xs uppercase">
          <a href="#home" className="block text-ink-light dark:text-ink-dark">Home</a>
          <a href="#about" className="block text-ink-light dark:text-ink-dark">About</a>
          <a href="#stations" className="block text-ink-light dark:text-ink-dark">Stations</a>
          <a href="#alerts" className="block text-ink-light dark:text-ink-dark">Alerts</a>
          <div className="pt-4 border-t border-borderMuted-light dark:border-borderMuted-dark flex gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth("login");
              }}
              className="flex-1 py-2 text-center border border-borderMuted-light dark:border-borderMuted-dark text-ink-light dark:text-ink-dark font-semibold rounded cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth("signup");
              }}
              className="flex-1 py-2 text-center bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-bold rounded cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
};