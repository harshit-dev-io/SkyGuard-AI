import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Shield, Activity, Network, CheckCircle2 } from 'lucide-react';

interface WalkthroughVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDemo?: () => void;
}

export const WalkthroughVideoModal: React.FC<WalkthroughVideoModalProps> = ({
  isOpen,
  onClose,
  onLaunchDemo,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 select-none">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1B1A18]/70 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-4xl bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] rounded-2xl shadow-[0_24px_48px_-12px_rgba(27,26,24,0.25)] overflow-hidden z-10 flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-between bg-[#FAF9F7] dark:bg-[#26211A]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FDEDE1] dark:bg-[#3A2416] text-[#E1590C] border border-[#FCD9C3] dark:border-[#4A301E]">
                    SYSTEM WALKTHROUGH · 2 MIN
                  </span>
                  <span className="text-xs font-mono text-[#716C64] dark:text-[#9A938A]">
                    v2.4 Live Production Tour
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#1B1A18] dark:text-[#F3EFE8] mt-1 tracking-tight">
                  SkyGuard - AI — Operational &amp; Physical Validation Walkthrough
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716C64] hover:text-[#1B1A18] dark:hover:text-white hover:bg-white dark:hover:bg-[#1E1A15] border border-transparent hover:border-[#E9E5DF] dark:hover:border-[#332C23] transition-colors cursor-pointer"
                aria-label="Close Walkthrough Video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Responsive 16:9 YouTube Video Embed */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#E9E5DF] dark:border-[#332C23] shadow-md">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1"
                  title="SkyGuard - AI System Operational Walkthrough"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* 3 Core Architecture Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#FAF9F7] dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#E1590C]" />
                    <span className="font-mono text-xs font-bold text-[#1B1A18] dark:text-[#F3EFE8]">
                      01 / Ingestion
                    </span>
                  </div>
                  <p className="text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed">
                    120Hz microsecond telemetry stream ingestion across 14 synoptic operational quadrants.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F7] dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#1F9D55]" />
                    <span className="font-mono text-xs font-bold text-[#1B1A18] dark:text-[#F3EFE8]">
                      02 / Sonntag Gate
                    </span>
                  </div>
                  <p className="text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed">
                    Thermodynamic invariant verification guarantees bad sensor pulses never pollute forecasts.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F7] dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
                    <span className="font-mono text-xs font-bold text-[#1B1A18] dark:text-[#F3EFE8]">
                      03 / Consensus
                    </span>
                  </div>
                  <p className="text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed">
                    16-node topological graph corroboration distinguishes microbursts from transducer degradation.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAF9F7] dark:bg-[#26211A] border-t border-[#E9E5DF] dark:border-[#332C23] flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-[#716C64] dark:text-[#9A938A]">
                Ready to explore live telemetry? Launch sandbox without credentials.
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#E9E5DF] dark:border-[#332C23] bg-white dark:bg-[#1E1A15] text-[#1B1A18] dark:text-[#F3EFE8] text-xs font-semibold hover:bg-[#FAF9F7] dark:hover:bg-[#26211A] transition-colors cursor-pointer"
                >
                  Close
                </button>
                {onLaunchDemo && (
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchDemo();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E1590C] hover:bg-[#C24A08] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Live Demo</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
