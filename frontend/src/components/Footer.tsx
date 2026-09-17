import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-borderMuted-light dark:border-borderMuted-dark py-12 px-6 bg-paper-light dark:bg-paper-dark">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink-light dark:text-ink-dark">
            SkyGuard AI
          </span>
          <p className="text-[11px] font-mono text-neutral-500 mt-1">
            Ministry of Earth Sciences · PS 26073
          </p>
        </div>

        <div className="flex flex-wrap gap-8 text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <a href="#" className="hover:text-ink-light dark:hover:text-ink-dark">
            Documentation
          </a>
          <a href="#" className="hover:text-ink-light dark:hover:text-ink-dark">
            WIGOS Schema
          </a>
          <a href="#" className="hover:text-ink-light dark:hover:text-ink-dark">
            API Reference
          </a>
          <a href="#" className="hover:text-ink-light dark:hover:text-ink-dark">
            Audit Logs
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-borderMuted-light/50 dark:border-borderMuted-dark/50 text-center text-[10px] font-mono text-neutral-400">
        © 2026 SkyGuard AI System Architecture. All rights reserved.
      </div>
    </footer>
  );
};