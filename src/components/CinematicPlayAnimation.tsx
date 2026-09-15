import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, Volume2, Film } from 'lucide-react';
import { MediaItem } from '../types';
import { iosFeedback } from '../services/iosFeedback';

interface CinematicPlayAnimationProps {
  item: MediaItem | null;
  isOpen: boolean;
  onComplete: () => void;
}

export const CinematicPlayAnimation: React.FC<CinematicPlayAnimationProps> = ({
  item,
  isOpen,
  onComplete,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [stage, setStage] = useState<'projector' | 'ready'>('projector');

  useEffect(() => {
    if (!isOpen || !item) return;

    // Trigger authentic cinema theatre sound & haptic vibration
    iosFeedback('cinema');
    setCountdown(3);
    setStage('projector');

    // Countdown step 2
    const t1 = setTimeout(() => {
      setCountdown(2);
      iosFeedback('tap');
    }, 400);

    // Countdown step 1
    const t2 = setTimeout(() => {
      setCountdown(1);
      setStage('ready');
      iosFeedback('play');
    }, 850);

    // Auto complete and transition to player
    const t3 = setTimeout(() => {
      onComplete();
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, item, onComplete]);

  if (!isOpen || !item) return null;

  const bgImage = item.backdrop || item.poster;

  return (
    <AnimatePresence>
      <motion.div
        id="cinematic-play-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onClick={onComplete}
        className="fixed inset-0 z-[200] bg-[#050507] flex items-center justify-center cursor-pointer select-none overflow-hidden"
      >
        {/* Ambient Cinema Backdrop with Zoom */}
        {bgImage && (
          <motion.div
            initial={{ scale: 1.0, filter: 'blur(10px) brightness(0.2)' }}
            animate={{ scale: 1.08, filter: 'blur(4px) brightness(0.25)' }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        {/* Projector Light Beam Cone */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-lg h-[450px] bg-gradient-to-b from-[#FFB020]/25 via-[#7C5CFF]/10 to-transparent blur-3xl pointer-events-none" />

        {/* Dynamic Vignette Mask */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#050507]/60 to-[#050507] pointer-events-none" />

        {/* Subtle Cinema Dust / Particle Sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [-10, 20], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full h-full flex justify-around items-center"
          >
            <Sparkles className="w-4 h-4 text-[#FFB020]/40 absolute top-[25%] left-[20%]" />
            <Sparkles className="w-5 h-5 text-white/30 absolute top-[40%] right-[25%]" />
            <Sparkles className="w-3 h-3 text-[#FFB020]/50 absolute bottom-[30%] left-[45%]" />
          </motion.div>
        </div>

        {/* Central Cinema Reel & Stage Elements */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
          {/* Glowing Animated Ring with Projector Icon */}
          <div className="relative mb-6 flex items-center justify-center">
            {/* Outer Rotating Halo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-28 h-28 rounded-full border-2 border-dashed border-[#FFB020]/50 shadow-[0_0_40px_rgba(255,176,32,0.35)]"
            />

            {/* Inner Glowing Pulse Ring */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-[#FFB020]/30 to-[#7C5CFF]/30 blur-md"
            />

            {/* Core Play / Film Icon */}
            <div className="absolute w-16 h-16 rounded-full bg-[#101014] border border-[#FFB020]/70 flex items-center justify-center text-[#FFB020] shadow-xl">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {stage === 'ready' ? (
                  <Play className="w-8 h-8 fill-[#FFB020] translate-x-0.5" />
                ) : (
                  <span className="text-2xl font-black text-[#FFB020] tracking-tighter">
                    {countdown}
                  </span>
                )}
              </motion.div>
            </div>
          </div>

          {/* Cinema Stream Badge */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10.5px] font-extrabold uppercase tracking-widest text-[#FFB020] mb-3 shadow-lg"
          >
            <Film className="w-3 h-3 text-[#FFB020]" />
            <span>Cinematic Stream Initializing</span>
          </motion.div>

          {/* Movie Title */}
          <motion.h2
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 line-clamp-2 drop-shadow-lg"
          >
            {item.title}
          </motion.h2>

          {/* Format Spec Badges */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center gap-2 text-[11px] font-bold text-[#8E8E93] mb-6"
          >
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-black text-[10px]">
              4K ULTRA HD
            </span>
            <span>•</span>
            <span className="text-[#FFB020]">★ {item.rating || '8.5'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Volume2 className="w-3 h-3" /> DOLBY ATMOS
            </span>
          </motion.div>

          {/* Audio Visualizer Waves */}
          <div className="flex items-center gap-1 h-6 mb-4">
            {[40, 70, 95, 60, 85, 50, 90, 65, 80, 45].map((height, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [`${height * 0.25}%`, `${height}%`, `${height * 0.3}%`],
                }}
                transition={{
                  duration: 0.45,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: i * 0.04,
                }}
                className="w-1 rounded-full bg-gradient-to-t from-[#FFB020] to-white opacity-80"
              />
            ))}
          </div>

          {/* Tap to skip cue */}
          <motion.span
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[11px] text-[#7A7A85] tracking-wider uppercase font-medium"
          >
            Opening Theatre • Tap anywhere to skip
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
