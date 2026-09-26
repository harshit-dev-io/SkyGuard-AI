import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WALKTHROUGH_STEPS, WalkthroughStep } from '../../config/demoConfig';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Target,
} from 'lucide-react';

interface InteractiveWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

// Procedural audio synthesizer for tactile mission audio feedback
const playAudioFeedback = (type: 'next' | 'back' | 'finish' | 'open', soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'next') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'back') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'finish') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    }
  } catch (e) {
    // Gracefully handle browser autoplay policies
  }
};

export const InteractiveWalkthrough: React.FC<InteractiveWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveTab } = useDashboard();
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const activeStep: WalkthroughStep = WALKTHROUGH_STEPS[currentStepIdx] || WALKTHROUGH_STEPS[0];
  const isLastStep = currentStepIdx === WALKTHROUGH_STEPS.length - 1;

  // Track target element position dynamically
  const updateTargetPosition = () => {
    if (!isOpen) return;
    const el = document.getElementById(activeStep.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Remove any rings from previously highlighted targets
      WALKTHROUGH_STEPS.forEach((step) => {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.classList.remove('ring-2', 'ring-[#E1590C]', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-[#15130F]', 'transition-all');
        }
      });
      return;
    }

    if (activeStep.navTab) {
      setActiveTab(activeStep.navTab);
    }

    const timer = setTimeout(() => {
      updateTargetPosition();

      // Add hairline spotlight ring to active target
      WALKTHROUGH_STEPS.forEach((step, idx) => {
        const el = document.getElementById(step.targetId);
        if (el) {
          if (idx === currentStepIdx) {
            el.classList.add('ring-4', 'ring-[#E1590C]', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-[#15130F]', 'shadow-[0_0_24px_rgba(225,89,12,0.35)]', 'transition-all');
          } else {
            el.classList.remove('ring-4', 'ring-[#E1590C]', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-[#15130F]', 'shadow-[0_0_24px_rgba(225,89,12,0.35)]');
          }
        }
      });
    }, 150);

    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isOpen, currentStepIdx, activeStep.targetId, activeStep.navTab, setActiveTab]);

  // Clean up all rings on unmount
  useEffect(() => {
    return () => {
      WALKTHROUGH_STEPS.forEach((step) => {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.classList.remove('ring-4', 'ring-[#E1590C]', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-[#15130F]', 'shadow-[0_0_24px_rgba(225,89,12,0.35)]');
        }
      });
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLastStep) {
          handleFinish();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIdx, isLastStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIdx < WALKTHROUGH_STEPS.length - 1) {
      playAudioFeedback('next', soundEnabled);
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      playAudioFeedback('back', soundEnabled);
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    playAudioFeedback('finish', soundEnabled);
    // Clean up rings
    WALKTHROUGH_STEPS.forEach((step) => {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.classList.remove('ring-4', 'ring-[#E1590C]', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-[#15130F]', 'shadow-[0_0_24px_rgba(225,89,12,0.35)]');
      }
    });
    onClose();
  };

  // Determine popup position (float near bottom-right or adaptively above target)
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none transition-all duration-300">
      {/* Game HUD Spotlight Frame around active section */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 z-[9998]"
          style={{
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
        >
          <div className="w-full h-full rounded-xl border-2 border-[#E1590C] shadow-[0_0_24px_rgba(225,89,12,0.35)] relative">
            {/* Top HUD Badge */}
            <div className="absolute -top-3.5 left-4 px-2.5 py-0.5 rounded-full bg-[#E1590C] text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              MISSION OBJECTIVE: STEP {activeStep.step}
            </div>
            {/* HUD Corner Brackets */}
            <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#E1590C]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#E1590C]" />
            <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#E1590C]" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#E1590C]" />
          </div>
        </div>
      )}

      {/* Ivory Coach Container matching - AI design: 1px border, 12px radius, Inter/JetBrains Mono typography */}
      <div className="absolute bottom-6 right-6 md:right-8 max-w-[440px] w-[calc(100%-3rem)] pointer-events-auto z-50">
        <div className="bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] rounded-xl shadow-[0_12px_32px_-4px_rgba(27,26,24,0.18)] overflow-hidden transition-all duration-300">
          {/* Header block with step counter and utility toggles */}
          <div className="px-5 pt-4 pb-3 border-b border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-between bg-white dark:bg-[#1E1A15]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FDEDE1] dark:bg-[#3A2416] flex items-center justify-center text-[#E1590C]">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#716C64] dark:text-[#9A938A]">
                Step {activeStep.step} of {WALKTHROUGH_STEPS.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                className="p-1 rounded text-[#716C64] hover:text-[#1B1A18] dark:hover:text-white transition-colors cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#E1590C]" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1 rounded text-[#716C64] hover:text-[#1B1A18] dark:hover:text-white transition-colors cursor-pointer"
                title="Close Walkthrough"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Block */}
          <div className="p-5 space-y-3">
            {/* Mission Title & Metric Badge */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold tracking-tight text-[#1B1A18] dark:text-[#F3EFE8] flex items-center gap-2">
                <span>{activeStep.title}</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#FDEDE1] dark:bg-[#3A2416] text-[#E1590C] border border-[#FCD9C3] dark:border-[#4A301E]">
                {activeStep.metricBadge}
              </span>
            </div>

            {/* Subtitle */}
            <div className="text-xs font-medium text-[#716C64] dark:text-[#9A938A]">
              {activeStep.subtitle}
            </div>

            {/* Mission Description matching prompt specification */}
            <div className="p-3 rounded-lg bg-white dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23] text-xs leading-relaxed text-[#1B1A18] dark:text-[#F3EFE8] font-sans">
              <div className="flex items-start gap-2.5">
                <Target className="w-4 h-4 text-[#E1590C] shrink-0 mt-0.5" />
                <span>{activeStep.description}</span>
              </div>
            </div>

            {/* Stepper Progress Bar (Hairline segmented) */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {WALKTHROUGH_STEPS.map((s, idx) => (
                <div
                  key={s.step}
                  onClick={() => {
                    playAudioFeedback('next', soundEnabled);
                    setCurrentStepIdx(idx);
                  }}
                  className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                    idx === currentStepIdx
                      ? 'bg-[#E1590C]'
                      : idx < currentStepIdx
                      ? 'bg-[#1F9D55]'
                      : 'bg-[#E9E5DF] dark:bg-[#332C23]'
                  }`}
                  title={`Go to Step ${s.step}`}
                />
              ))}
            </div>
          </div>

          {/* Footer Controls: Back, Next/Finish, Skip & Explore */}
          <div className="px-5 py-3.5 bg-white dark:bg-[#1E1A15] border-t border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-xs font-medium text-[#716C64] hover:text-[#1B1A18] dark:hover:text-[#F3EFE8] hover:underline cursor-pointer"
            >
              Skip &amp; Explore Freely
            </button>

            <div className="flex items-center gap-2">
              {currentStepIdx > 0 && (
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 rounded-lg border border-[#E9E5DF] dark:border-[#332C23] bg-white dark:bg-[#26211A] text-xs font-medium text-[#1B1A18] dark:text-[#F3EFE8] hover:bg-[#FAF9F7] dark:hover:bg-[#1E1A15] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  className="px-4 py-1.5 rounded-lg bg-[#E1590C] hover:opacity-95 text-white text-xs font-semibold tracking-wide transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete Tour</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-lg bg-[#E1590C] hover:opacity-95 text-white text-xs font-semibold tracking-wide transition-opacity flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveWalkthrough;
