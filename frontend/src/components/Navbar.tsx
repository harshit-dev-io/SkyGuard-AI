import React, { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronDown, Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenAuth: (mode: "login" | "signup") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] bg-sheetWhite dark:bg-sheetWhite-dark border-b border-sage-mist/60 dark:border-sage-dark transition-colors select-none">
      <div className="max-w-[1200px] h-full mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-canopy dark:bg-mint-pulse flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-sheetWhite dark:bg-canopy-dark" />
          </div>
          <a
            href="#"
            className="text-[20px] font-medium tracking-tight text-canopy dark:text-white transition-colors"
          >
            SkyGuard AI
          </a>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-8 text-[14px] font-normal text-bark dark:text-bark-dark">
          <a
            href="#home"
            className="hover:text-canopy dark:hover:text-mint-pulse transition-colors"
          >
            Home
          </a>
          <a
            href="#flow"
            className="hover:text-canopy dark:hover:text-mint-pulse transition-colors"
          >
            Architecture
          </a>
          <div className="relative group">
            <button className="flex items-center gap-1.5 hover:text-canopy dark:hover:text-mint-pulse transition-colors cursor-pointer">
              <span>Observatory</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full -left-4 mt-2 w-48 bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark rounded-cards p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all text-left">
              <a
                href="#network"
                className="block px-3 py-2 rounded-buttons hover:bg-creamPaper dark:hover:bg-canopy-dark/40 text-bark dark:text-bark-dark text-[13px] font-normal"
              >
                Sensor Mesh Topology
              </a>
              <a
                href="#evidence"
                className="block px-3 py-2 rounded-buttons hover:bg-creamPaper dark:hover:bg-canopy-dark/40 text-bark dark:text-bark-dark text-[13px] font-normal"
              >
                Evidence Engines
              </a>
            </div>
          </div>
          <a
            href="#guarantees"
            className="hover:text-canopy dark:hover:text-mint-pulse transition-colors"
          >
            Guarantees
          </a>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-3.5">
          <ThemeToggle />
          <button
            onClick={() => onOpenAuth("login")}
            className="px-5 py-2 text-[14px] font-medium border border-canopy dark:border-mint-pulse text-canopy dark:text-mint-pulse hover:bg-canopy/5 dark:hover:bg-mint-pulse/10 rounded-buttons transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => onOpenAuth("signup")}
            className="px-6 py-2 text-[14px] font-medium bg-canopy dark:bg-mint-pulse text-white dark:text-bark hover:bg-canopy-dark dark:hover:bg-mint-hover rounded-buttons transition-colors cursor-pointer"
          >
            Request Access
          </button>
        </div>

        {/* Mobile Burger */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-bark dark:text-bark-dark"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-canopy dark:text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark p-6 space-y-4 text-[14px]">
          <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block text-bark dark:text-bark-dark font-medium">Home</a>
          <a href="#flow" onClick={() => setMobileMenuOpen(false)} className="block text-bark dark:text-bark-dark font-medium">Architecture</a>
          <a href="#network" onClick={() => setMobileMenuOpen(false)} className="block text-bark dark:text-bark-dark font-medium">Observatory Mesh</a>
          <a href="#evidence" onClick={() => setMobileMenuOpen(false)} className="block text-bark dark:text-bark-dark font-medium">Evidence Engines</a>
          <div className="pt-4 border-t border-sage-mist/50 dark:border-sage-dark/50 flex gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth("login");
              }}
              className="flex-1 py-2.5 text-center border border-canopy dark:border-mint-pulse text-canopy dark:text-mint-pulse font-medium rounded-buttons cursor-pointer text-sm"
            >
              Sign in
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth("signup");
              }}
              className="flex-1 py-2.5 text-center bg-canopy dark:bg-mint-pulse text-white dark:text-bark font-medium rounded-buttons cursor-pointer text-sm"
            >
              Request Access
            </button>
          </div>
        </div>
      )}
    </header>
  );
};