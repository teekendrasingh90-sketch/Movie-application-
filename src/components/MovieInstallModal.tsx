import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, CheckCircle2, Play, X, HardDrive, Wifi, ShieldCheck, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';
import { iosFeedback } from '../services/iosFeedback';

interface MovieInstallModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayInstalled: (item: MediaItem) => void;
  onInstallComplete?: (item: MediaItem) => void;
}

export const MovieInstallModal: React.FC<MovieInstallModalProps> = ({
  item,
  isOpen,
  onClose,
  onPlayInstalled,
  onInstallComplete,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(38.4);

  const steps = [
    { label: 'Connecting to High-Speed Cinema CDN...', icon: Wifi },
    { label: 'Downloading 4K Ultra HD Chunks...', icon: HardDrive },
    { label: 'Encrypting Device DRM Vault License...', icon: ShieldCheck },
    { label: 'Installation Complete • Ready for Offline Play!', icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (!isOpen || !item) {
      setProgress(0);
      setStepIndex(0);
      setIsCompleted(false);
      return;
    }

    iosFeedback('install');
    setProgress(0);
    setStepIndex(0);
    setIsCompleted(false);

    // Simulate authentic install download progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextSpeed = +(35 + Math.random() * 20).toFixed(1);
        setSpeed(nextSpeed);

        if (prev >= 100) {
          clearInterval(interval);
          setIsCompleted(true);
          setStepIndex(3);
          iosFeedback('success');

          if (onInstallComplete) {
            onInstallComplete(item);
          }
          return 100;
        }

        const increment = Math.floor(Math.random() * 8) + 4;
        const newProg = Math.min(100, prev + increment);

        if (newProg < 30) {
          setStepIndex(0);
        } else if (newProg < 80) {
          setStepIndex(1);
        } else if (newProg < 100) {
          setStepIndex(2);
        }

        return newProg;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const CurrentIcon = steps[stepIndex].icon;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md select-none"
        id="movie-install-modal"
      >
        {/* Backdrop dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={() => {
            iosFeedback('pop');
            onClose();
          }}
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#101014] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-[28px] overflow-hidden p-6 z-10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top iOS handle */}
          <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-4 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFB020]/20 flex items-center justify-center text-[#FFB020]">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-bold text-white">
                {isCompleted ? 'Movie Installed' : 'Installing to Device'}
              </h3>
            </div>
            <button
              onClick={() => {
                iosFeedback('pop');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 active:scale-95 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Media Mini Preview Banner */}
          <div className="flex gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-5 items-center">
            <div className="w-14 h-20 rounded-xl overflow-hidden bg-[#1A1A1E] shrink-0 border border-white/10 relative">
              <img
                src={item.poster || item.backdrop}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold text-white truncate mb-1">{item.title}</h4>
              <p className="text-[11.5px] text-[#8E8E93] flex items-center gap-1.5">
                <span>{item.year || '2024'}</span>
                <span>•</span>
                <span className="text-[#FFB020]">★ {item.rating}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">4K UHD (~1.4 GB)</span>
              </p>
              <p className="text-[11px] text-[#5C5C66] mt-1 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> Offline playback supported
              </p>
            </div>
          </div>

          {/* Progress Animation Center */}
          <div className="flex flex-col items-center justify-center py-2 mb-4">
            <div className="relative w-28 h-28 flex items-center justify-center mb-3">
              {/* SVG Circular Progress Track */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-white/10"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="#FFB020"
                  strokeWidth="6"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (289 * progress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-200"
                />
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                ) : (
                  <>
                    <span className="text-2xl font-black text-white">{progress}%</span>
                    <span className="text-[10px] text-[#8E8E93] font-bold">{speed} MB/s</span>
                  </>
                )}
              </div>
            </div>

            {/* Current Step Label */}
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-[12.5px] font-semibold text-center"
            >
              <CurrentIcon
                className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : 'text-[#FFB020]'}`}
              />
              <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-white'}>
                {steps[stepIndex].label}
              </span>
            </motion.div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-5">
            <motion.div
              className={`h-full rounded-full ${
                isCompleted
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-[#FFB020] to-[#FF7A1A]'
              }`}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isCompleted ? (
              <>
                <button
                  onClick={() => {
                    iosFeedback('play');
                    onClose();
                    onPlayInstalled(item);
                  }}
                  className="flex-1 py-3.5 px-4 rounded-[16px] bg-gradient-to-r from-[#FFB020] to-[#FF7A1A] text-black font-extrabold text-[14.5px] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-[#FFB020]/25"
                >
                  <Play className="w-4 h-4 fill-black" />
                  Play Offline Now
                </button>
                <button
                  onClick={() => {
                    iosFeedback('pop');
                    onClose();
                  }}
                  className="px-5 py-3.5 rounded-[16px] bg-white/10 text-white font-bold text-[14.5px] active:scale-95 transition-all hover:bg-white/15"
                >
                  Done
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  iosFeedback('pop');
                  onClose();
                }}
                className="w-full py-3 rounded-[16px] bg-white/10 text-[#8E8E93] hover:text-white font-semibold text-[13.5px] active:scale-95 transition-all"
              >
                Cancel Installation
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
